import { test } from "node:test";
import assert from "node:assert/strict";
import { packImage, categoryPlaceholder, descriptionToFeatures, isProvisionalImage } from "./pack-image";

test("packImage usa la foto subida si existe", () => {
  assert.equal(packImage({ imageUrl: "https://cdn/x.jpg", category: "Karaoke" }), "https://cdn/x.jpg");
});

test("packImage cae al placeholder por categoría si no hay foto", () => {
  assert.equal(packImage({ imageUrl: "", category: "Karaoke" }), "/packs/ph-karaoke.svg");
  assert.equal(packImage({ imageUrl: null, category: "Gaming / Consolas" }), "/packs/ph-gaming.svg");
  assert.equal(packImage({ category: "Fiesta Holi" }), "/packs/ph-holi.svg");
  assert.equal(packImage({ category: "Evento Furor" }), "/packs/ph-furor.svg");
  assert.equal(packImage({ category: "Fiesta de Espuma" }), "/packs/ph-espuma.svg");
});

test("categoryPlaceholder usa el nombre como respaldo y default", () => {
  assert.equal(categoryPlaceholder(null, "Karaoke Opción 1"), "/packs/ph-karaoke.svg");
  assert.equal(categoryPlaceholder("Otra cosa", "Algo"), "/packs/ph-default.svg");
});

test("isProvisionalImage detecta si no hay foto real", () => {
  assert.equal(isProvisionalImage({ imageUrl: "" }), true);
  assert.equal(isProvisionalImage({ imageUrl: "https://cdn/x.jpg" }), false);
});

test("descriptionToFeatures parte por líneas y limpia viñetas", () => {
  const f = descriptionToFeatures("Equipo 1200W\n• Microfonía\n- Montaje incluido\n\n  Seguro RC  ");
  assert.deepEqual(f, ["Equipo 1200W", "Microfonía", "Montaje incluido", "Seguro RC"]);
  assert.deepEqual(descriptionToFeatures(null), []);
});
