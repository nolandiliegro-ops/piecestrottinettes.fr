// T6 — masquage pneus pleins. Hors src/ : tsc ne le compile pas au build.
// Lancement : node --test claude/tests/solid-tires.test.ts (Node >= 22, TS strippé
// nativement ; compatibilityStatus.ts est un module pur, zéro import).
//
// Ce test est la SEULE preuve du masquage : la base est déjà propre, donc
// l'écran ne peut rien prouver (aucune ligne compat pneu plein n'existe
// aujourd'hui sur une trotte 'no'/NULL). On fabrique ici le cas interdit.
import assert from "node:assert/strict";
import { test } from "node:test";
import { filterSolidTires, isSolidTirePart } from "../../src/lib/compatibilityStatus.ts";

const solidWithSpecs = {
  id: "p-solid-specs",
  category: { slug: "pneus-pleins" },
  fitment_specs: { tire_family: "solid", rim: "6.5" },
};

// Le piège : rangée dans la catégorie, mais fitment_specs à NULL (2 pièces
// réelles dans ce cas en base). Un filtre qui ne lit que fitment_specs la rate.
const solidNoSpecs = {
  id: "p-solid-nospecs",
  category: { slug: "pneus-pleins" },
  fitment_specs: null,
};

// L'inverse : clé solid portée sans être rangée dans la catégorie.
const solidOffCategory = {
  id: "p-solid-offcat",
  category: { slug: "roues" },
  fitment_specs: { tire_family: "solid" },
};

const notSolid = {
  id: "p-tube",
  category: { slug: "chambres-a-air" },
  fitment_specs: { tire_family: "pneumatic" },
};

const UNKNOWN = { tire_family: "pneumatic", solid_conversion: null };
const CONVERTIBLE = { tire_family: "pneumatic", solid_conversion: "yes" };
const BLOCKED = { tire_family: "pneumatic", solid_conversion: "no" };
const NATIVE_SOLID = { tire_family: "solid", solid_conversion: null };

test("solid_conversion NULL (on ne sait pas) → le pneu plein est retiré", () => {
  const kept = filterSolidTires([solidWithSpecs, notSolid], UNKNOWN);
  assert.deepEqual(kept.map((p) => p.id), ["p-tube"]);
});

test("solid_conversion 'yes' → le pneu plein est gardé", () => {
  const kept = filterSolidTires([solidWithSpecs, notSolid], CONVERTIBLE);
  assert.deepEqual(kept.map((p) => p.id), ["p-solid-specs", "p-tube"]);
});

test("catégorie 'pneus-pleins' + fitment_specs NULL sur modèle NULL → retiré (le piège)", () => {
  const kept = filterSolidTires([solidNoSpecs, notSolid], UNKNOWN);
  assert.deepEqual(kept.map((p) => p.id), ["p-tube"]);
});

test("clé solid hors catégorie sur modèle NULL → retiré aussi", () => {
  const kept = filterSolidTires([solidOffCategory, notSolid], UNKNOWN);
  assert.deepEqual(kept.map((p) => p.id), ["p-tube"]);
});

test("solid_conversion 'no' → retiré, quelle que soit la forme du pneu plein", () => {
  const kept = filterSolidTires([solidWithSpecs, solidNoSpecs, solidOffCategory, notSolid], BLOCKED);
  assert.deepEqual(kept.map((p) => p.id), ["p-tube"]);
});

test("trotte nativement 'solid' → tout est gardé", () => {
  const kept = filterSolidTires([solidWithSpecs, solidNoSpecs, notSolid], NATIVE_SOLID);
  assert.equal(kept.length, 3);
});

test("modèle absent (appelant qui oublie les flags) → masqué, jamais proposé à tort", () => {
  assert.deepEqual(filterSolidTires([solidWithSpecs, notSolid], null).map((p) => p.id), ["p-tube"]);
  assert.deepEqual(filterSolidTires([solidWithSpecs, notSolid], undefined).map((p) => p.id), ["p-tube"]);
});

test("une pièce non-pneu-plein n'est jamais détectée comme telle", () => {
  assert.equal(isSolidTirePart(notSolid), false);
  assert.equal(isSolidTirePart({ category: null, fitment_specs: null }), false);
  assert.equal(isSolidTirePart({ category: { slug: null }, fitment_specs: undefined }), false);
});
