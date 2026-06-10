import { test } from "node:test";
import assert from "node:assert/strict";
import { parseConsent, serializeConsent } from "./cookie-consent";

test("parseConsent acepta el formato granular analytics=true/false", () => {
  assert.deepEqual(parseConsent("analytics=true"), { analytics: true });
  assert.deepEqual(parseConsent("analytics=false"), { analytics: false });
});

test("parseConsent rechaza valores ausentes o corruptos", () => {
  assert.equal(parseConsent(null), null);
  assert.equal(parseConsent(undefined), null);
  assert.equal(parseConsent(""), null);
  assert.equal(parseConsent("analytics=yes"), null);
  assert.equal(parseConsent("otra=true"), null);
  assert.equal(parseConsent("basura"), null);
});

test("serializeConsent y parseConsent son inversas", () => {
  for (const analytics of [true, false]) {
    assert.deepEqual(parseConsent(serializeConsent({ analytics })), { analytics });
  }
});
