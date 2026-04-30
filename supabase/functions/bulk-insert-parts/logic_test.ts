// Tests unitaires des helpers purs de bulk-insert-parts.
import {
  assertEquals,
  assertStrictEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  extractTireSizeFromName,
  extractVoltageFromName,
  buildTireSizeRegex,
  resolveCompatibilityHints,
} from "./index.ts";

Deno.test("extractTireSizeFromName: pneu 10x2.50 → 10", () => {
  assertEquals(extractTireSizeFromName("Pneu 10x2.50 tubeless"), "10");
});

Deno.test("extractTireSizeFromName: chambre 8.5x2 → 8.5", () => {
  assertEquals(extractTireSizeFromName("Chambre à air 8.5×2"), "8.5");
});

Deno.test("extractTireSizeFromName: plaquettes → null", () => {
  assertEquals(extractTireSizeFromName("Plaquettes de frein semi-métallique"), null);
});

Deno.test("extractTireSizeFromName: chargeur 100V ne matche pas comme pneu", () => {
  assertEquals(extractTireSizeFromName("Chargeur 100V 2A"), null);
});

Deno.test("extractVoltageFromName: 52V → 52", () => {
  assertEquals(extractVoltageFromName("Chargeur 52V 2A"), 52);
});

Deno.test("extractVoltageFromName: 60 volts → 60", () => {
  assertEquals(extractVoltageFromName("Chargeur 60 volts"), 60);
});

Deno.test("extractVoltageFromName: pneu 10x2.50 → null", () => {
  assertEquals(extractVoltageFromName("Pneu 10x2.50"), null);
});

Deno.test("extractVoltageFromName: voltage hors plage → null", () => {
  assertEquals(extractVoltageFromName("Marquage 12V auto"), null);
  assertEquals(extractVoltageFromName("Pièce 200V"), null);
});

Deno.test("buildTireSizeRegex: 10 ne matche PAS 100", () => {
  const re = new RegExp(buildTireSizeRegex("10"), "i");
  assertEquals(re.test("100 pouces"), false);
  assertEquals(re.test("100x2"), false);
  assertEquals(re.test("10 pouces"), true);
  assertEquals(re.test("10x2.50"), true);
  assertEquals(re.test("10×2"), true);
  assertEquals(re.test("Pneu 10 pouces tubeless"), true);
});

Deno.test("buildTireSizeRegex: 8.5 matche correctement", () => {
  const re = new RegExp(buildTireSizeRegex("8.5"), "i");
  assertEquals(re.test("8.5 pouces"), true);
  assertEquals(re.test("8.5x2"), true);
  assertEquals(re.test("85 pouces"), false);
});

Deno.test("resolveCompatibilityHints: hints explicites prioritaires", () => {
  const hints = resolveCompatibilityHints({
    name: "Chargeur 52V 2A",
    slug: "chargeur-52v",
    compatibility_hints: { voltage: 60, tire_size: null },
  });
  assertEquals(hints, { tire_size: null, voltage: 60 });
});

Deno.test("resolveCompatibilityHints: fallback regex sur nom pneu", () => {
  const hints = resolveCompatibilityHints({
    name: "Pneu 10x2.50 tubeless",
    slug: "pneu-10x250",
  });
  assertEquals(hints?.tire_size, "10");
  assertStrictEquals(hints?.voltage, null);
});

Deno.test("resolveCompatibilityHints: fallback regex sur chargeur 52V", () => {
  const hints = resolveCompatibilityHints({
    name: "Chargeur 52V 2A",
    slug: "chargeur-52v",
  });
  assertStrictEquals(hints?.tire_size, null);
  assertEquals(hints?.voltage, 52);
});

Deno.test("resolveCompatibilityHints: plaquettes sans hint → null", () => {
  const hints = resolveCompatibilityHints({
    name: "Plaquettes de frein semi-métallique",
    slug: "plaquettes-frein",
  });
  assertEquals(hints, null);
});

Deno.test("resolveCompatibilityHints: hints vides → fallback", () => {
  const hints = resolveCompatibilityHints({
    name: "Pneu 10x2.50",
    slug: "p",
    compatibility_hints: {},
  });
  assertEquals(hints?.tire_size, "10");
});
