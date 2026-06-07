import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Markdown, markdownToPlain } from "./markdown";

const html = (source: string) => renderToStaticMarkup(createElement(Markdown, { source }));

test("renderiza encabezados, negrita y listas", () => {
  const out = html("# Título\n\nTexto con **negrita**.\n\n- uno\n- dos");
  assert.match(out, /<h2[^>]*>Título<\/h2>/);
  assert.match(out, /<strong>negrita<\/strong>/);
  assert.match(out, /<ul[^>]*>[\s\S]*<li>uno<\/li>[\s\S]*<li>dos<\/li>[\s\S]*<\/ul>/);
});

test("enlaces seguros: http externo con rel, javascript: neutralizado", () => {
  const out = html("[ok](https://example.com) y [malo](javascript:alert(1))");
  assert.match(out, /href="https:\/\/example\.com"[^>]*rel="noopener noreferrer"/);
  assert.doesNotMatch(out, /javascript:/);
  assert.match(out, /href="#"/);
});

test("no inyecta HTML embebido", () => {
  const out = html("Hola <script>alert(1)</script> mundo");
  assert.doesNotMatch(out, /<script>/);
  assert.match(out, /&lt;script&gt;/);
});

test("markdownToPlain limpia marcas y trunca", () => {
  assert.equal(markdownToPlain("# Hola\n\n**mundo** [x](https://a)"), "Hola mundo x");
  const long = markdownToPlain("palabra ".repeat(40), 20);
  assert.ok(long.length <= 20);
  assert.match(long, /…$/);
});
