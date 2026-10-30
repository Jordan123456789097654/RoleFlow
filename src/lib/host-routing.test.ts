import { test } from "node:test";
import assert from "node:assert/strict";
import { isPlatformHostName } from "./platform-hosts";
import { isPlatformHost } from "./custom-domain";

test("platform hosts are recognized and never routed to custom domain resolution", () => {
  const hosts = [
    "roleflow.site",
    "www.roleflow.site",
    "applyhub.roleflow.site",
    "localhost",
    "preview.vercel.app",
    "roleflow-branch-preview.vercel.app",
  ];

  for (const h of hosts) {
    assert.equal(isPlatformHost(h), true, `Host ${h} should be recognized as platform host in custom-domain.ts`);
    assert.equal(isPlatformHostName(h), true, `Host ${h} should be recognized as platform host in platform-hosts.ts`);
  }
});

test("unknown third-party custom domains are forwarded to domain resolution", () => {
  const customDomains = [
    "apply.bloxstudio.com",
    "recruitment.emergencyclan.org",
    "jobs.robloxdev.net",
    "portal.myserver.gg",
  ];

  for (const cd of customDomains) {
    assert.equal(isPlatformHost(cd), false, `Domain ${cd} must NOT be treated as a platform host`);
    assert.equal(isPlatformHostName(cd), false, `Domain ${cd} must NOT be treated as a platform host`);
  }
});

test("lookalike domains are safely identified as custom domains", () => {
  const lookalikes = [
    "roleflow.site.attacker.com",
    "applyhub.roleflow.site.phishing.org",
    "www.roleflow.site.fake.com",
  ];

  for (const l of lookalikes) {
    assert.equal(isPlatformHost(l), false, `Lookalike ${l} must be sent to domain lookup, not bypass it`);
  }
});
