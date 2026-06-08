import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeForKey, dedupKey } from "./song-dedup";

test("normalizeForKey quita acentos, mayúsculas y signos", () => {
  assert.equal(normalizeForKey("  ¿Cómo Estás? "), "como estas");
  assert.equal(normalizeForKey("Niña — (Remix)"), "nina remix");
});

test("dedupKey agrupa la misma canción con distinta grafía", () => {
  assert.equal(dedupKey("Corazón Partío", "Alejandro Sanz"), dedupKey("corazon partio", "ALEJANDRO  SANZ"));
  assert.notEqual(dedupKey("A", "X"), dedupKey("B", "X"));
});
