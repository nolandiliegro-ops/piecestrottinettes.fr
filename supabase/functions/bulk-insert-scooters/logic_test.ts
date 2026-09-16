// Tests unitaires du helper pur fitmentCodeFields (garde-preserve + validation référentiel).
// Lancer : deno test supabase/functions/bulk-insert-scooters/logic_test.ts
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  fitmentCodeFields,
  TIRE_FAMILIES,
  SOLID_CONVERSION,
  type FitmentVocab,
  type FitmentWarning,
} from "./index.ts";

const COLUMNS = [
  "rim_diameter_code", "rim_width_code", "tire_section_code", "disc_diameter_code",
  "disc_pcd_code", "disc_holes_code", "caliper_family", "tire_family", "solid_conversion",
];

const vocab: FitmentVocab = {
  fitment_rim_diameters: new Set(["6.5", "134mm"]),
  fitment_rim_widths: new Set(["44mm"]),
  fitment_tire_sections: new Set(["90/65", "8x4"]),
  fitment_disc_diameters: new Set(["160"]),
  fitment_disc_pcd: new Set(["48"]),
  fitment_disc_holes: new Set(["6"]),
  fitment_caliper_families: new Set(["nutt_4p"]),
  tire_family: TIRE_FAMILIES,
  solid_conversion: SOLID_CONVERSION,
};

Deno.test("1. payload { slug } seul → aucune des 9 colonnes, aucun warning", () => {
  const warnings: FitmentWarning[] = [];
  const out = fitmentCodeFields({ slug: "thunder" }, vocab, warnings);
  assertEquals(Object.keys(out), []);
  for (const c of COLUMNS) assertEquals(c in out, false);
  assertEquals(warnings, []);
});

Deno.test("1b. clés présentes mais null / vide / espaces → idem, jamais posées", () => {
  const warnings: FitmentWarning[] = [];
  const out = fitmentCodeFields(
    {
      slug: "thunder", rim_diameter: "", tire_section: "   ", caliper_family: null,
      tire_family: undefined, rim_width: "", solid_conversion: null,
    },
    vocab,
    warnings,
  );
  assertEquals(Object.keys(out), []);
  assertEquals(warnings, []);
});

Deno.test("2. code hors référentiel → colonne sautée + warning, les autres colonnes posées", () => {
  const warnings: FitmentWarning[] = [];
  const out = fitmentCodeFields(
    { name: "Dualtron Thunder", slug: "thunder", rim_diameter: "9.9", tire_section: "90/65", disc_diameter: 160 },
    vocab,
    warnings,
  );
  assertEquals("rim_diameter_code" in out, false);
  assertEquals(out, { tire_section_code: "90/65", disc_diameter_code: "160" });
  assertEquals(warnings, [{ name: "Dualtron Thunder", field: "rim_diameter_code", code: "9.9" }]);
});

Deno.test("3. 9 codes valides (entiers ou strings non trimées) → 9 colonnes en string trimée", () => {
  const warnings: FitmentWarning[] = [];
  const out = fitmentCodeFields(
    {
      slug: "thunder",
      rim_diameter: " 6.5 ",
      rim_width: " 44mm",
      tire_section: "90/65",
      disc_diameter: 160,
      disc_pcd: "48",
      disc_holes: 6,
      caliper_family: "nutt_4p ",
      tire_family: "pneumatic",
      solid_conversion: "yes ",
    },
    vocab,
    warnings,
  );
  assertEquals(out, {
    rim_diameter_code: "6.5",
    rim_width_code: "44mm",
    tire_section_code: "90/65",
    disc_diameter_code: "160",
    disc_pcd_code: "48",
    disc_holes_code: "6",
    caliper_family: "nutt_4p",
    tire_family: "pneumatic",
    solid_conversion: "yes",
  });
  assertEquals(Object.keys(out).length, 9);
  for (const v of Object.values(out)) assertEquals(typeof v, "string");
  assertEquals(warnings, []);
});

Deno.test("4. tire_family 'Pneumatic' (majuscule) et 'plein' → colonne sautée + warning", () => {
  for (const bad of ["Pneumatic", "plein"]) {
    const warnings: FitmentWarning[] = [];
    const out = fitmentCodeFields({ slug: "compact", tire_family: bad }, vocab, warnings);
    assertEquals("tire_family" in out, false);
    assertEquals(warnings, [{ name: "compact", field: "tire_family", code: bad }]);
  }
  // Contrôle : la casse exacte passe.
  const ok = fitmentCodeFields({ slug: "compact", tire_family: "solid" }, vocab, []);
  assertEquals(ok, { tire_family: "solid" });
});

Deno.test("5. solid_conversion 'oui' / 'YES' → sautée + warning ; rim_width hors référentiel → sautée + warning", () => {
  for (const bad of ["oui", "YES"]) {
    const warnings: FitmentWarning[] = [];
    const out = fitmentCodeFields({ slug: "compact", solid_conversion: bad }, vocab, warnings);
    assertEquals("solid_conversion" in out, false);
    assertEquals(warnings, [{ name: "compact", field: "solid_conversion", code: bad }]);
  }
  const warnings: FitmentWarning[] = [];
  const out = fitmentCodeFields(
    { slug: "compact", rim_width: "34mm", solid_conversion: "no" },
    vocab,
    warnings,
  );
  assertEquals(out, { solid_conversion: "no" });
  assertEquals(warnings, [{ name: "compact", field: "rim_width_code", code: "34mm" }]);
});
