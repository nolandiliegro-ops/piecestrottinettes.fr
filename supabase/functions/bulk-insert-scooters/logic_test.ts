// Tests unitaires du helper pur fitmentCodeFields (garde-preserve + validation référentiel).
// Lancer : deno test supabase/functions/bulk-insert-scooters/logic_test.ts
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  fitmentCodeFields,
  specFields,
  missingForPublish,
  TIRE_FAMILIES,
  SOLID_CONVERSION,
  type FitmentVocab,
  type FitmentWarning,
  type PublishCheckRow,
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
  fitment_brake_types: new Set(["disc_hydraulic", "disc_mechanical", "drum"]),
  fitment_rim_types: new Set(["monobloc", "demi_jante"]),
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

// ─── Lot 2 : brake_type / rim_type + specFields ─────────────────────────────

Deno.test("6. brake_type 'disc_hydraulic' au vocab → écrit ; 'disque' absent → warning", () => {
  const warnings: FitmentWarning[] = [];
  const ok = fitmentCodeFields({ slug: "t", brake_type: "disc_hydraulic", rim_type: "demi_jante" }, vocab, warnings);
  assertEquals(ok, { brake_type: "disc_hydraulic", rim_type: "demi_jante" });
  assertEquals(warnings, []);
  const out = fitmentCodeFields({ slug: "t", brake_type: "disque" }, vocab, warnings);
  assertEquals("brake_type" in out, false);
  assertEquals(warnings, [{ name: "t", field: "brake_type", code: "disque" }]);
});

Deno.test("7. specFields : weight_kg 25.5 écrit ; -1 sauté + warning", () => {
  const warnings: FitmentWarning[] = [];
  assertEquals(specFields({ slug: "t", weight_kg: 25.5 }, warnings), { weight_kg: 25.5 });
  assertEquals(warnings, []);
  assertEquals(specFields({ slug: "t", weight_kg: -1 }, warnings), {});
  assertEquals(warnings, [{ name: "t", field: "weight_kg", code: "-1" }]);
});

Deno.test("8. specFields : score_offroad 101 sauté + warning ; 0 et 100 acceptés", () => {
  const warnings: FitmentWarning[] = [];
  assertEquals(specFields({ slug: "t", score_offroad: 101 }, warnings), {});
  assertEquals(warnings, [{ name: "t", field: "score_offroad", code: "101" }]);
  assertEquals(specFields({ slug: "t", score_offroad: 0 }, []), { score_offroad: 0 });
  assertEquals(specFields({ slug: "t", score_offroad: 100 }, []), { score_offroad: 100 });
});

Deno.test("9. specFields : foldable 'true' (string) sauté + warning ; true (boolean) écrit", () => {
  const warnings: FitmentWarning[] = [];
  assertEquals(specFields({ slug: "t", foldable: "true" }, warnings), {});
  assertEquals(warnings, [{ name: "t", field: "foldable", code: "true" }]);
  assertEquals(specFields({ slug: "t", foldable: false }, []), { foldable: false });
});

Deno.test("10. specFields : suspension '' absente sans warning ; clé absente absente ; texte trimé", () => {
  const warnings: FitmentWarning[] = [];
  assertEquals(specFields({ slug: "t", suspension: "", ip_rating: "   " }, warnings), {});
  assertEquals(specFields({ slug: "t" }, warnings), {});
  assertEquals(specFields({ slug: "t", suspension: null }, warnings), {});
  assertEquals(warnings, []);
  assertEquals(specFields({ slug: "t", suspension: " double ", ip_rating: "IPX5" }, []), {
    suspension: "double",
    ip_rating: "IPX5",
  });
});

Deno.test("11. specFields : max_speed_private_kmh entier exigé, NaN / string rejetés", () => {
  const warnings: FitmentWarning[] = [];
  assertEquals(specFields({ slug: "t", max_speed_private_kmh: 70 }, warnings), { max_speed_private_kmh: 70 });
  assertEquals(specFields({ slug: "t", max_speed_private_kmh: 70.5 }, warnings), {});
  assertEquals(specFields({ slug: "t", wheel_inches: Number.NaN }, warnings), {});
  assertEquals(specFields({ slug: "t", max_load_kg: "150" }, warnings), {});
  assertEquals(warnings.map((w) => w.field), ["max_speed_private_kmh", "wheel_inches", "max_load_kg"]);
  assertEquals(specFields({ slug: "t", wheel_inches: 8.5 }, []), { wheel_inches: 8.5 });
});

// ─── Lot 3 : missingForPublish ──────────────────────────────────────────────

const complete: PublishCheckRow = {
  images: [{ url: "a.png" }],
  image_url: null,
  meta_title: "Titre",
  meta_description: "Desc",
  brake_type: "disc_hydraulic",
  disc_diameter_code: "160",
  disc_pcd_code: "44",
  disc_holes_code: "6",
  score_performance: 80,
  score_autonomy: 70,
  score_offroad: 60,
};

Deno.test("12. missingForPublish : ligne complète disc_hydraulic → []", () => {
  assertEquals(missingForPublish(complete), []);
});

Deno.test("13. missingForPublish : drum sans codes disque → []", () => {
  assertEquals(
    missingForPublish({
      ...complete, brake_type: "drum", disc_diameter_code: null, disc_pcd_code: null, disc_holes_code: null,
    }),
    [],
  );
});

Deno.test("14. missingForPublish : disc_mechanical sans disc_pcd_code → ['disc_pcd_code']", () => {
  assertEquals(missingForPublish({ ...complete, brake_type: "disc_mechanical", disc_pcd_code: null }), ["disc_pcd_code"]);
});

Deno.test("15. missingForPublish : images [] et image_url null → contient 'photo' ; image_url seule suffit", () => {
  assertEquals(missingForPublish({ ...complete, images: [], image_url: null }).includes("photo"), true);
  assertEquals(missingForPublish({ ...complete, images: [], image_url: "https://x/y.png" }), []);
});

Deno.test("16. missingForPublish : score_offroad null → contient 'score_offroad' ; brake_type null → brake_type, pas de clés disque", () => {
  assertEquals(missingForPublish({ ...complete, score_offroad: null }).includes("score_offroad"), true);
  assertEquals(
    missingForPublish({ ...complete, brake_type: null, disc_diameter_code: null }),
    ["brake_type"],
  );
  assertEquals(missingForPublish({ ...complete, meta_title: "  " }), ["meta_title"]);
});
