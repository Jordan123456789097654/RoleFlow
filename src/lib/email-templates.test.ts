import { test } from "node:test";
import assert from "node:assert/strict";
import { TEMPLATES, CATEGORIES, getTemplate, renderEmail, buildTemplate, TemplateInputError, isSafeUrl } from "./email-templates";

function valuesFor(tplId: string): Record<string, string> {
  const tpl = getTemplate(tplId)!;
  return Object.fromEntries(tpl.fields.map((f) => [f.key, f.default || "x"]));
}

test("there are at least 20 templates with unique ids and known categories", () => {
  assert.ok(TEMPLATES.length >= 35, `only ${TEMPLATES.length} templates`);
  const ids = TEMPLATES.map((t) => t.id);
  assert.equal(new Set(ids).size, ids.length, "duplicate template id");
  for (const t of TEMPLATES) assert.ok((CATEGORIES as readonly string[]).includes(t.category), t.id);
});

test("every template renders with its default values", () => {
  for (const t of TEMPLATES) {
    const out = renderEmail(t, valuesFor(t.id), "Ada");
    assert.ok(out.subject.length > 0, `${t.id} subject`);
    assert.match(out.html, /<!DOCTYPE html>/, t.id);
    assert.ok(out.text.includes("Hi Ada,"), t.id);
    assert.ok(!/\{[A-Z]+\}/.test(out.html), `${t.id} left a placeholder in HTML`);
  }
});

test("user text is HTML-escaped in the HTML body", () => {
  const t = getTemplate("thank-you")!;
  const out = renderEmail(t, { body: "<script>alert(1)</script> & \"quotes\"", ctaLabel: "Go", ctaUrl: "https://roleflow.site" }, "<b>Eve</b>");
  assert.ok(!out.html.includes("<script>"));
  assert.ok(out.html.includes("&lt;script&gt;"));
  assert.ok(out.html.includes("&amp;"));
  assert.ok(!out.html.includes("<b>Eve</b>"));
});

test("dollar signs in user text are kept literally", () => {
  const t = getTemplate("community-spotlight")!;
  const out = renderEmail(t, { community: "$& Money $'", body: "Hi {COMMUNITY}", ctaLabel: "Go", ctaUrl: "https://roleflow.site" }, null);
  assert.ok(out.html.includes("$&amp; Money $&#39;"));
});

test("unsafe button links are rejected", () => {
  const t = getTemplate("thank-you")!;
  for (const bad of ["javascript:alert(1)", "http://example.com", "data:text/html,hi", "https://user:pw@evil.com"]) {
    assert.throws(() => renderEmail(t, { body: "Hello there friend", ctaLabel: "Go", ctaUrl: bad }, null), TemplateInputError, bad);
  }
  assert.equal(isSafeUrl("https://roleflow.site/x"), true);
});

test("required fields are enforced", () => {
  const t = getTemplate("product-launch")!;
  assert.throws(() => renderEmail(t, { title: "   ", body: "Some body text", ctaLabel: "Go", ctaUrl: "https://roleflow.site" }, null), TemplateInputError);
});

test("length limits are enforced", () => {
  const t = getTemplate("product-launch")!;
  assert.throws(() => renderEmail(t, { title: "x".repeat(500), body: "Some body text", ctaLabel: "Go", ctaUrl: "https://roleflow.site" }, null), TemplateInputError);
});

test("subject never contains line breaks", () => {
  const t = getTemplate("feature-update")!;
  const out = renderEmail(t, { feature: "Line one\r\nBcc: evil@example.com", body: "Some body text here", ctaLabel: "Go", ctaUrl: "https://roleflow.site" }, null);
  assert.ok(!/[\r\n]/.test(out.subject));
});

test("bullets render as list items", () => {
  const t = getTemplate("changelog-highlights")!;
  const out = renderEmail(t, { version: "May", bullets: "First thing\nSecond thing", body: "Here it is.", ctaLabel: "Go", ctaUrl: "https://roleflow.site" }, null);
  assert.ok(out.html.includes("<li>First thing</li>"));
  assert.ok(out.text.includes("  - Second thing"));
});

test("field keys are unique within each template", () => {
  for (const t of TEMPLATES) {
    const keys = t.fields.map((f) => f.key);
    assert.equal(new Set(keys).size, keys.length, `${t.id} has duplicate field keys`);
  }
});

test("templates have detailed sections, not just a paragraph", () => {
  for (const t of TEMPLATES) {
    const sections = buildTemplate(t, valuesFor(t.id)).sections ?? [];
    assert.ok(sections.length >= 2, `${t.id} has fewer than 2 sections`);
  }
});

test("section titles and bullets appear in the rendered HTML", () => {
  const t = getTemplate("pricing-change")!;
  const out = renderEmail(t, valuesFor("pricing-change"), "Ada");
  assert.ok(out.html.includes("<h2"));
  assert.ok(out.html.includes("When it takes effect"));
  assert.ok(out.text.includes("WHEN IT TAKES EFFECT"));
});
