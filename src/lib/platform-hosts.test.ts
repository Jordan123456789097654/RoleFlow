import { test } from "node:test";
import assert from "node:assert/strict";
import { isPlatformHostName, platformHostNames, PARENT_HOST, APPLICATIONS_HOST } from "./platform-hosts";

test("recognizes parent host and www parent host", () => {
  assert.equal(isPlatformHostName("roleflow.site"), true);
  assert.equal(isPlatformHostName("www.roleflow.site"), true);
  assert.equal(isPlatformHostName("ROLEFLOW.SITE"), true);
  assert.equal(isPlatformHostName("roleflow.site:3000"), true);
  assert.equal(isPlatformHostName("www.roleflow.site:443"), true);
});

test("recognizes applications host", () => {
  assert.equal(isPlatformHostName("applyhub.roleflow.site"), true);
  assert.equal(isPlatformHostName("APPLYHUB.ROLEFLOW.SITE:8080"), true);
});

test("recognizes vercel preview domains and localhost", () => {
  assert.equal(isPlatformHostName("localhost"), true);
  assert.equal(isPlatformHostName("localhost:3000"), true);
  assert.equal(isPlatformHostName("roleflow-preview.vercel.app"), true);
  assert.equal(isPlatformHostName("my-app-branch.vercel.app:443"), true);
});

test("rejects empty, null, or undefined host", () => {
  assert.equal(isPlatformHostName(""), false);
  assert.equal(isPlatformHostName(null), false);
  assert.equal(isPlatformHostName(undefined), false);
  assert.equal(isPlatformHostName("   "), false);
});

test("rejects spoofed and lookalike hosts", () => {
  assert.equal(isPlatformHostName("roleflow.site.evil.com"), false);
  assert.equal(isPlatformHostName("notroleflow.site"), false);
  assert.equal(isPlatformHostName("fakeapplyhub.roleflow.site.attacker.net"), false);
  assert.equal(isPlatformHostName("community-portal.com"), false);
});

test("respects PLATFORM_EXTRA_HOSTS", () => {
  process.env.PLATFORM_EXTRA_HOSTS = "staging.roleflow.site, preview.internal";
  assert.equal(isPlatformHostName("staging.roleflow.site"), true);
  assert.equal(isPlatformHostName("preview.internal"), true);
  delete process.env.PLATFORM_EXTRA_HOSTS;
});
