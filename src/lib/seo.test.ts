import { test } from "node:test";
import assert from "node:assert/strict";
import { pageTitle, TITLE_SUFFIX, openingHoursToSpec } from "./seo";

test("pageTitle añade el sufijo de marca", () => {
  assert.equal(pageTitle("Preguntas frecuentes"), `Preguntas frecuentes${TITLE_SUFFIX}`);
});

test("pageTitle no duplica el sufijo si ya lo lleva", () => {
  const already = `Pack Fiesta${TITLE_SUFFIX}`;
  assert.equal(pageTitle(already), already);
});

test("openingHoursToSpec convierte un rango simple", () => {
  assert.deepEqual(openingHoursToSpec("Mo-Su 09:00-21:00"), [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: "09:00",
      closes: "21:00",
    },
  ]);
});

test("openingHoursToSpec admite varios tramos y un solo día", () => {
  const specs = openingHoursToSpec("Mo-Fr 09:00-20:00, Sa 10:00-14:00");
  assert.equal(specs?.length, 2);
  assert.deepEqual(specs?.[0].dayOfWeek, ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
  assert.deepEqual(specs?.[1], {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Saturday"],
    opens: "10:00",
    closes: "14:00",
  });
});

test("openingHoursToSpec devuelve null si el formato no se reconoce", () => {
  assert.equal(openingHoursToSpec("de lunes a domingo"), null);
  assert.equal(openingHoursToSpec("Xx-Yy 09:00-21:00"), null);
  assert.equal(openingHoursToSpec(""), null);
});
