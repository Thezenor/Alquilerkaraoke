import { test } from "node:test";
import assert from "node:assert/strict";
import { SONG_LANGUAGES, languageName, normalizeLanguageCode, languageFromCode } from "./song-languages";

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

test("languageFromCode extrae el idioma del prefijo del código", () => {
  assert.equal(languageFromCode("AL82215"), "AL"); // Alemán
  assert.equal(languageFromCode("in40276"), "IN"); // Inglés (minúsculas)
  assert.equal(languageFromCode("ES001"), "ES");
  assert.equal(languageFromCode("123456"), null); // sin prefijo de letras
  assert.equal(languageFromCode(""), null);
});
