import { test } from "node:test";
import assert from "node:assert/strict";
import { isPrivateAddress, isSafeUrl, parseOpenGraph } from "./link-preview";

test("flags private, loopback, and reserved addresses", () => {
  for (const ip of ["10.1.2.3", "127.0.0.1", "192.168.1.5", "172.20.0.1", "169.254.1.1", "::1", "fd00::1", "::ffff:10.0.0.1"]) {
    assert.equal(isPrivateAddress(ip), true, ip);
  }
});

test("allows public addresses", () => {
  for (const ip of ["8.8.8.8", "1.1.1.1", "2606:4700::1111"]) {
    assert.equal(isPrivateAddress(ip), false, ip);
  }
});

test("only public https URLs are safe", () => {
  assert.ok(isSafeUrl("https://example.com/portfolio"));
  assert.equal(isSafeUrl("http://example.com"), null);
  assert.equal(isSafeUrl("https://user:pw@example.com"), null);
  assert.equal(isSafeUrl("https://localhost/x"), null);
  assert.equal(isSafeUrl("https://192.168.0.1/"), null);
  assert.equal(isSafeUrl("https://[::1]/"), null);
  assert.equal(isSafeUrl("https://example.com:8443/"), null);
  assert.equal(isSafeUrl("not a url"), null);
});

test("reads Open Graph tags and resolves relative images", () => {
  const html = `<html><head><title>Fallback</title>
    <meta property="og:title" content="My Portfolio">
    <meta content="Work samples" property="og:description">
    <meta property="og:image" content="/img/cover.png">
    </head></html>`;
  const p = parseOpenGraph(html, "https://example.com/work");
  assert.equal(p.title, "My Portfolio");
  assert.equal(p.description, "Work samples");
  assert.equal(p.image, "https://example.com/img/cover.png");
});

test("falls back to the page title when Open Graph is missing", () => {
  const p = parseOpenGraph("<title> Plain Page </title>", "https://example.com/");
  assert.equal(p.title, "Plain Page");
  assert.equal(p.image, null);
});
