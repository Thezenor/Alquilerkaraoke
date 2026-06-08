import { test } from "node:test";
import assert from "node:assert/strict";
import { SONG_LANGUAGES, languageName, normalizeLanguageCode } from "./song-languages";

test("la leyenda tiene códigos únicos", () => {
  const codes = SONG_LANGUAGES.map((l) => l.code);
  assert.equal(new Set(codes).size, codes.length);
  assert.ok(codes.length >= 90);
});

test("languageName respeta las abreviaturas del cliente (no ISO)", () => {
  assert.equal(languageName("AL"), "Alemán");
  assert.equal(languageName("IN", "en"), "English");
  assert.equal(languageName("po"), "Portugués"); // case-insensitive
  assert.equal(languageName("TA", "en"), "Thai");
  assert.equal(languageName(""), "Desconocido");
  assert.equal(languageName("XX"), "XX"); // desconocido → devuelve el código
});

test("normalizeLanguageCode valida contra la leyenda", () => {
  assert.equal(normalizeLanguageCode(" es "), "ES");
  assert.equal(normalizeLanguageCode("zzz"), null);
});
