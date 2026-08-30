// Tests unitaires des helpers purs de bulk-insert-parts + ai_matcher.
import {
  assertEquals,
  assertStrictEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  extractTireSizeFromName,
  extractVoltageFromName,
  buildTireSizeRegex,
  resolveCompatibilityHints,
  intersectPublishedConfigVoltages,
  isElectricalPart,
  isTirePart,
} from "../_shared/compatibility-helpers.ts";
import {
  resolveModel,
  buildAIPrompt,
  parseAIResponse,
  dedupeAgainstPassA,
  extractHintsFromTechnicalMetadata,
  withTimeout,
  DEFAULT_MODEL,
  type AIMatchResult,
  type AIScooterRow,
} from "../_shared/ai_matcher.ts";
import {
  canonicalSlug,
  normalizeName,
  resolveCategoryMatch,
  extractAirtableId,
  seoRowFields,
} from "./index.ts";
import {
  KEY_WIRED_CATEGORIES,
  fitmentKindForCategory,
  isFitmentMatchable,
  matchTireScooters,
  matchDiscScooters,
} from "../_shared/fitment_matcher.ts";

// ─── Helpers existants (Passe A) ────────────────────────────────────────────

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

// ─── B1.4a — chemin électrique (electrical_specs.voltages) ──────────────────

Deno.test("resolveCompatibilityHints: electrical_specs.voltages [72] → hints.voltages=[72]", () => {
  const hints = resolveCompatibilityHints({
    name: "Chargeur 72V",
    slug: "chargeur-72v",
    electrical_specs: { voltages: [72] },
  });
  assertEquals(hints?.voltages, [72]);
});

Deno.test("resolveCompatibilityHints: electrical_specs court-circuite extractVoltageFromName", () => {
  // Le nom contient '84V' (tension de SORTIE charge) que le regex extrairait à
  // 84 ; electrical_specs.voltages=[72] (nominal batterie) doit gagner et le
  // voltage scalaire rester null → preuve que extractVoltageFromName est ignoré.
  const hints = resolveCompatibilityHints({
    name: "Chargeur 72V vers 84V sortie",
    slug: "chargeur-72v-84v",
    electrical_specs: { voltages: [72] },
  });
  assertEquals(hints?.voltages, [72]);
  assertStrictEquals(hints?.voltage, null);
});

Deno.test("resolveCompatibilityHints: bi-voltage [60,72] préservé", () => {
  const hints = resolveCompatibilityHints({
    name: "Chargeur Dualtron",
    slug: "chargeur-dualtron",
    electrical_specs: { voltages: [60, 72] },
  });
  assertEquals(hints?.voltages, [60, 72]);
  assertStrictEquals(hints?.voltage, null);
});

Deno.test("resolveCompatibilityHints: pièce sans electrical_specs → legacy STRICTEMENT inchangé", () => {
  // Un pneu (pas de '72V' dans le nom) : aucun champ voltages ne doit apparaître,
  // l'objet doit être identique au comportement pré-B1.4.
  const hints = resolveCompatibilityHints({
    name: "Pneu 10x2.50 tubeless",
    slug: "pneu-10x250",
  });
  assertEquals(hints, { tire_size: "10", voltage: null });
});

Deno.test("resolveCompatibilityHints: electrical_specs.voltages vide → fallback legacy", () => {
  // Tableau vide = pas de spec électrique exploitable → on retombe sur le regex.
  const hints = resolveCompatibilityHints({
    name: "Chargeur 52V 2A",
    slug: "chargeur-52v",
    electrical_specs: { voltages: [] },
  });
  assertEquals(hints, { tire_size: null, voltage: 52 });
});

// ─── B1.4b — intersection voltage électrique (helper pur) ───────────────────

// Simule le pipeline DB : .in("voltage", voltages) côté scooter_battery_configs
// PUIS intersection JS avec les scooter_models publiés. `allConfigs` = table
// complète (non filtrée) ; `voltages` = electrical_specs.voltages de la pièce.
function simulateElectricalMatch(
  allConfigs: Array<{ scooter_model_id: string; voltage: number }>,
  voltages: number[],
  publishedModelIds: string[],
): Set<string> {
  const filtered = allConfigs.filter((c) => voltages.includes(c.voltage)); // = .in(voltage)
  return intersectPublishedConfigVoltages(filtered, new Set(publishedModelIds));
}

// Jeu de configs : A=48V, B=60V, C=72V, D=84V (config de sortie hypothétique).
const CONFIGS = [
  { scooter_model_id: "A", voltage: 48 },
  { scooter_model_id: "B", voltage: 60 },
  { scooter_model_id: "C", voltage: 72 },
  { scooter_model_id: "D", voltage: 84 },
];
const ALL_PUBLISHED = ["A", "B", "C", "D"];

Deno.test("intersection: pièce 48V → seul A matché, jamais B/C (60/72)", () => {
  const got = simulateElectricalMatch(CONFIGS, [48], ALL_PUBLISHED);
  assertEquals([...got].sort(), ["A"]);
});

Deno.test("intersection: pièce 72V → C only, la config 84V n'est JAMAIS matchée", () => {
  const got = simulateElectricalMatch(CONFIGS, [72], ALL_PUBLISHED);
  assertEquals([...got].sort(), ["C"]);
  assertEquals(got.has("D"), false); // 84 n'entre jamais dans le match (voltages=[72])
});

Deno.test("intersection: pièce bi-voltage [60,72] → matche B OU C", () => {
  const got = simulateElectricalMatch(CONFIGS, [60, 72], ALL_PUBLISHED);
  assertEquals([...got].sort(), ["B", "C"]);
});

Deno.test("intersection: config au bon voltage mais model NON publié → exclu", () => {
  // A a une config 48V mais n'est pas dans la liste des publiés → aucun candidat.
  const got = simulateElectricalMatch(CONFIGS, [48], ["B", "C", "D"]);
  assertEquals(got.size, 0);
});

Deno.test("intersection: aucun config au voltage de la pièce → 0 candidat, pas d'erreur", () => {
  const got = simulateElectricalMatch(CONFIGS, [24], ALL_PUBLISHED);
  assertEquals(got.size, 0);
});

Deno.test("intersectPublishedConfigVoltages: dédupe un model à plusieurs configs matchées", () => {
  // E a deux variantes (bi-voltage 60 ET 72) toutes deux dans le filtre → 1 seule fois.
  const configs = [
    { scooter_model_id: "E", voltage: 60 },
    { scooter_model_id: "E", voltage: 72 },
    { scooter_model_id: "F", voltage: 60 },
  ];
  const got = intersectPublishedConfigVoltages(configs, new Set(["E", "F"]));
  assertEquals([...got].sort(), ["E", "F"]);
});

Deno.test("intersectPublishedConfigVoltages: configs vides → set vide", () => {
  assertEquals(intersectPublishedConfigVoltages([], new Set(["A"])).size, 0);
});

// ─── B1.6/B3 — isElectricalPart (spec_type autoritaire, skip Passe B IA) ──────

Deno.test("isElectricalPart: spec_type charger/controller/battery → true", () => {
  assertEquals(isElectricalPart({ specType: "charger" }), true);
  assertEquals(isElectricalPart({ specType: "controller" }), true);
  assertEquals(isElectricalPart({ specType: "battery" }), true);
});

Deno.test("isElectricalPart: spec_type 'display' → false (routé generic/IA, pas voltage)", () => {
  // Un afficheur se matche au connecteur/modèle, pas au voltage → hors bucket élec.
  assertEquals(isElectricalPart({ specType: "display" }), false);
});

Deno.test("isElectricalPart: spec_type 'generic' → false", () => {
  assertEquals(isElectricalPart({ specType: "generic" }), false);
});

Deno.test("isElectricalPart: spec_type normalisé casse/espaces ('  Charger ') → true", () => {
  assertEquals(isElectricalPart({ specType: "  Charger " }), true);
});

Deno.test("isElectricalPart: fallback slug — spec_type absent + slug 'chargeurs' → true", () => {
  assertEquals(isElectricalPart({ categorySlug: "chargeurs" }), true);
  // ZT3 Pro : catégorie élec pas encore backfillée, specs vides → capté par le slug.
  assertEquals(isElectricalPart({ categorySlug: "chargeurs", electrical_specs: null }), true);
  assertEquals(isElectricalPart({ categorySlug: "chargeurs", electrical_specs: { voltages: [] } }), true);
});

Deno.test("isElectricalPart: spec_type 'generic' + slug 'chargeurs' → true (le fallback slug l'emporte)", () => {
  // Décision B3 : le slug rétro-compat 'chargeurs' capte même si spec_type est resté
  // à 'generic' (catégorie élec mal configurée) — conservateur, garde les chargeurs
  // hors IA. En prod la migration met chargeurs à spec_type='charger' ; ce cas = filet.
  assertEquals(isElectricalPart({ specType: "generic", categorySlug: "chargeurs" }), true);
});

Deno.test("isElectricalPart: fallback voltages — slug méca + electrical_specs.voltages non vide → true", () => {
  assertEquals(
    isElectricalPart({ categorySlug: "cables", electrical_specs: { voltages: [72] } }),
    true,
  );
  // spec_type 'generic' n'annule pas le signal voltages structurés.
  assertEquals(
    isElectricalPart({ specType: "generic", categorySlug: "cables", electrical_specs: { voltages: [72] } }),
    true,
  );
});

Deno.test("isElectricalPart: slugs méca 'pneus'/'plaquettes'/'disques' → false", () => {
  assertEquals(isElectricalPart({ categorySlug: "pneus" }), false);
  assertEquals(isElectricalPart({ categorySlug: "plaquettes" }), false);
  assertEquals(isElectricalPart({ categorySlug: "disques" }), false);
});

Deno.test("isElectricalPart: pas de match par substring ('support-batterie'/'chargeurs-support' → false)", () => {
  // Un accessoire méca dont le slug contiendrait un mot élec ne doit PAS être capté.
  assertEquals(isElectricalPart({ categorySlug: "support-batterie" }), false);
  assertEquals(isElectricalPart({ categorySlug: "chargeurs-support" }), false);
});

Deno.test("isElectricalPart: tout absent (spec_type/slug/specs null) → false", () => {
  assertEquals(isElectricalPart({ specType: null, categorySlug: null, electrical_specs: null }), false);
  assertEquals(isElectricalPart({}), false);
});

// ─── B3 — isTirePart (spec_type='tire' → tire_size seule + skip Passe B IA) ───

Deno.test("isTirePart: spec_type 'tire' → true", () => {
  assertEquals(isTirePart({ specType: "tire" }), true);
});

Deno.test("isTirePart: spec_type normalisé casse/espaces ('  Tire ') → true", () => {
  assertEquals(isTirePart({ specType: "  Tire " }), true);
});

Deno.test("isTirePart: charger/generic/null/absent → false", () => {
  assertEquals(isTirePart({ specType: "charger" }), false);
  assertEquals(isTirePart({ specType: "generic" }), false);
  assertEquals(isTirePart({ specType: null }), false);
  assertEquals(isTirePart({}), false);
});

// ─── resolveModel ───────────────────────────────────────────────────────────

Deno.test("resolveModel: env vide → DEFAULT_MODEL Sonnet 4.5", () => {
  assertEquals(resolveModel(undefined), DEFAULT_MODEL);
  assertEquals(resolveModel(""), DEFAULT_MODEL);
  assertEquals(resolveModel("   "), DEFAULT_MODEL);
});

Deno.test("resolveModel: env claude-haiku-4-5 valide → utilisée", () => {
  assertEquals(resolveModel("claude-haiku-4-5"), "claude-haiku-4-5");
});

Deno.test("resolveModel: env claude-opus-4 valide → utilisée", () => {
  assertEquals(resolveModel("claude-opus-4-1"), "claude-opus-4-1");
});

Deno.test("resolveModel: env invalide gpt-4 → fallback Sonnet", () => {
  assertEquals(resolveModel("gpt-4-turbo"), DEFAULT_MODEL);
});

Deno.test("resolveModel: env invalide random → fallback", () => {
  assertEquals(resolveModel("totallyrandom"), DEFAULT_MODEL);
});

// ─── parseAIResponse ────────────────────────────────────────────────────────

const validIds = new Set([
  "11111111-1111-1111-1111-111111111111",
  "22222222-2222-2222-2222-222222222222",
]);

Deno.test("parseAIResponse: JSON pur valide", () => {
  const txt = JSON.stringify({
    compatibilities: [
      { scooter_id: "11111111-1111-1111-1111-111111111111", compatible: true, confidence: "high", reason: "ok" },
    ],
  });
  const out = parseAIResponse(txt, validIds);
  assertEquals(out.length, 1);
  assertEquals(out[0].confidence, "high");
});

Deno.test("parseAIResponse: JSON entouré de markdown ```json ... ```", () => {
  const txt = "Voici le résultat:\n```json\n" + JSON.stringify({
    compatibilities: [
      { scooter_id: "22222222-2222-2222-2222-222222222222", compatible: true, confidence: "medium", reason: "specs proches" },
    ],
  }) + "\n```";
  const out = parseAIResponse(txt, validIds);
  assertEquals(out.length, 1);
  assertEquals(out[0].scooter_id, "22222222-2222-2222-2222-222222222222");
});

Deno.test("parseAIResponse: texte garbage → []", () => {
  assertEquals(parseAIResponse("aucun JSON ici", validIds), []);
  assertEquals(parseAIResponse("", validIds), []);
});

Deno.test("parseAIResponse: filtre confidence invalide", () => {
  const txt = JSON.stringify({
    compatibilities: [
      { scooter_id: "11111111-1111-1111-1111-111111111111", compatible: true, confidence: "BAD", reason: "x" },
    ],
  });
  assertEquals(parseAIResponse(txt, validIds), []);
});

Deno.test("parseAIResponse: filtre compatible=false", () => {
  const txt = JSON.stringify({
    compatibilities: [
      { scooter_id: "11111111-1111-1111-1111-111111111111", compatible: false, confidence: "high", reason: "non" },
    ],
  });
  assertEquals(parseAIResponse(txt, validIds), []);
});

Deno.test("parseAIResponse: anti-hallucination UUID inconnu", () => {
  const txt = JSON.stringify({
    compatibilities: [
      { scooter_id: "00000000-0000-0000-0000-000000000000", compatible: true, confidence: "high", reason: "x" },
      { scooter_id: "11111111-1111-1111-1111-111111111111", compatible: true, confidence: "low", reason: "y" },
    ],
  });
  const out = parseAIResponse(txt, validIds);
  assertEquals(out.length, 1);
  assertEquals(out[0].scooter_id, "11111111-1111-1111-1111-111111111111");
});

Deno.test("parseAIResponse: tronque reason à 280 chars", () => {
  const longReason = "x".repeat(500);
  const txt = JSON.stringify({
    compatibilities: [
      { scooter_id: "11111111-1111-1111-1111-111111111111", compatible: true, confidence: "high", reason: longReason },
    ],
  });
  const out = parseAIResponse(txt, validIds);
  assertEquals(out[0].reason.length, 280);
});

// ─── dedupeAgainstPassA ─────────────────────────────────────────────────────

Deno.test("dedupeAgainstPassA: retire les ids déjà dans Passe A", () => {
  const ai: AIMatchResult[] = [
    { scooter_id: "a", confidence: "high", reason: "" },
    { scooter_id: "b", confidence: "medium", reason: "" },
    { scooter_id: "c", confidence: "low", reason: "" },
  ];
  const passA = new Set(["a", "c"]);
  const out = dedupeAgainstPassA(ai, passA);
  assertEquals(out.length, 1);
  assertEquals(out[0].scooter_id, "b");
});

Deno.test("dedupeAgainstPassA: garde tous si Passe A vide", () => {
  const ai: AIMatchResult[] = [
    { scooter_id: "a", confidence: "high", reason: "" },
  ];
  assertEquals(dedupeAgainstPassA(ai, new Set()).length, 1);
});

// ─── buildAIPrompt ──────────────────────────────────────────────────────────

const sampleScooters: AIScooterRow[] = [
  { id: "11111111-1111-1111-1111-111111111111", name: "M365", brand: "Xiaomi", tire_size: "8.5", voltage: 36, power_watts: 250, range_km: 30 },
];

Deno.test("buildAIPrompt: contient nom pièce et liste scooters JSON", () => {
  const { system, user } = buildAIPrompt({
    part: { name: "Pneu 10x2.50", description: "tubeless" },
    scooters: sampleScooters,
  });
  assertEquals(system.includes("expert mécanique"), true);
  assertEquals(user.includes("Pneu 10x2.50"), true);
  assertEquals(user.includes("M365"), true);
  assertEquals(user.includes("Xiaomi"), true);
});

Deno.test("buildAIPrompt: strip HTML de la description", () => {
  const { user } = buildAIPrompt({
    part: { name: "X", description: "<p>Texte <strong>gras</strong></p>" },
    scooters: sampleScooters,
  });
  assertEquals(user.includes("<p>"), false);
  assertEquals(user.includes("Texte gras"), true);
});

// ─── extractHintsFromTechnicalMetadata ──────────────────────────────────────

Deno.test("extractHintsFromTechnicalMetadata: tire_size '10 pouces' → '10'", () => {
  const h = extractHintsFromTechnicalMetadata({ diametre: "10 pouces" });
  assertEquals(h.tire_size, "10");
});

Deno.test("extractHintsFromTechnicalMetadata: voltage '52V' string → 52 number", () => {
  const h = extractHintsFromTechnicalMetadata({ voltage: "52V" });
  assertEquals(h.voltage, 52);
});

Deno.test("extractHintsFromTechnicalMetadata: voltage hors plage → null", () => {
  assertEquals(extractHintsFromTechnicalMetadata({ voltage: 12 }).voltage, null);
  assertEquals(extractHintsFromTechnicalMetadata({ voltage: "200V" }).voltage, null);
});

Deno.test("extractHintsFromTechnicalMetadata: vide → null/null", () => {
  assertEquals(extractHintsFromTechnicalMetadata(null), { tire_size: null, voltage: null });
  assertEquals(extractHintsFromTechnicalMetadata({}), { tire_size: null, voltage: null });
});

// ─── withTimeout ────────────────────────────────────────────────────────────

Deno.test("withTimeout: résout normalement avant timeout", async () => {
  const r = await withTimeout(Promise.resolve("ok"), 100, () => "TIMEOUT");
  assertEquals(r, "ok");
});

Deno.test("withTimeout: déclenche fallback après timeout", async () => {
  const slow = new Promise<string>((resolve) => setTimeout(() => resolve("late"), 200));
  const r = await withTimeout(slow, 50, () => "TIMEOUT");
  assertEquals(r, "TIMEOUT");
});

Deno.test("withTimeout: fallback sur rejection", async () => {
  const r = await withTimeout(Promise.reject(new Error("x")), 100, () => "FALLBACK");
  assertEquals(r, "FALLBACK");
});

// ─── Résolution catégorie : match-ou-flag ───────────────────────────────────

Deno.test("canonicalSlug: accents strippés comme l'UI (Chambres à air → chambres-a-air)", () => {
  assertEquals(canonicalSlug("Chambres à air"), "chambres-a-air");
});

Deno.test("canonicalSlug: simple (Pneus → pneus)", () => {
  assertEquals(canonicalSlug("Pneus"), "pneus");
});

Deno.test("canonicalSlug: ponctuation + accents (Câbles et durites → cables-et-durites)", () => {
  assertEquals(canonicalSlug("Câbles et durites"), "cables-et-durites");
});

Deno.test("canonicalSlug: bords nettoyés (  Garde-boue !  → garde-boue)", () => {
  assertEquals(canonicalSlug("  Garde-boue !  "), "garde-boue");
});

Deno.test("normalizeName: casse + accents + bords (Chambres à Air  → chambres a air)", () => {
  assertEquals(normalizeName("Chambres à Air  "), "chambres a air");
});

Deno.test("normalizeName: conserve les espaces internes (Pneu plein → pneu plein)", () => {
  assertEquals(normalizeName("Pneu plein"), "pneu plein");
});

const SAMPLE_CATEGORIES = [
  { id: "id-cab", name: "Chambres à air", slug: "chambres-air" },
  { id: "id-caa", name: "Chambres à Air", slug: "chambres-a-air" },
  { id: "id-pneus", name: "Pneus", slug: "pneus" },
];

Deno.test("resolveCategoryMatch: 1 candidat → ok + id", () => {
  const r = resolveCategoryMatch("Pneus", undefined, SAMPLE_CATEGORIES);
  assertEquals(r, { status: "ok", id: "id-pneus" });
});

Deno.test("resolveCategoryMatch: match par nom insensible casse/accents", () => {
  const r = resolveCategoryMatch("  PNEUS ", undefined, SAMPLE_CATEGORIES);
  assertEquals(r, { status: "ok", id: "id-pneus" });
});

Deno.test("resolveCategoryMatch: 0 candidat → unknown", () => {
  const r = resolveCategoryMatch("Batteries", undefined, SAMPLE_CATEGORIES);
  assertEquals(r, { status: "unknown" });
});

Deno.test("resolveCategoryMatch: ≥2 candidats (doublon) → ambiguous + slugs triés", () => {
  const r = resolveCategoryMatch("Chambres à air", undefined, SAMPLE_CATEGORIES);
  assertEquals(r, {
    status: "ambiguous",
    slugs: ["chambres-a-air", "chambres-air"],
  });
});

Deno.test("resolveCategoryMatch: categorySlug explicite matche par slug", () => {
  const r = resolveCategoryMatch("Libellé différent", "pneus", SAMPLE_CATEGORIES);
  assertEquals(r, { status: "ok", id: "id-pneus" });
});

// ─── extractAirtableId (cascade d'identité, M5 #2) ──────────────────────────

Deno.test("extractAirtableId: bag sync-airtable complet → l'id", () => {
  assertStrictEquals(
    extractAirtableId({
      technical_metadata: {
        source: "airtable",
        airtable_id: "recDCEOqfO5H9Obmr",
        compatible_model_record_ids: [],
      },
    }),
    "recDCEOqfO5H9Obmr",
  );
});

Deno.test("extractAirtableId: payload sync-parts (aucun technical_metadata) → ''", () => {
  // Cas de non-régression : la cascade historique sku → slug doit rester intacte.
  assertStrictEquals(extractAirtableId({}), "");
});

Deno.test("extractAirtableId: valeur vide, non-string ou bag partiel → ''", () => {
  assertStrictEquals(extractAirtableId({ technical_metadata: { source: "airtable" } }), "");
  assertStrictEquals(extractAirtableId({ technical_metadata: { airtable_id: "   " } }), "");
  assertStrictEquals(extractAirtableId({ technical_metadata: { airtable_id: 42 } }), "");
  assertStrictEquals(extractAirtableId({ technical_metadata: null }), "");
});

// ─── seoRowFields (garde anti-null SEO, M6.1) ───────────────────────────────

Deno.test("seoRowFields: clés SEO absentes → aucun champ dans row", () => {
  // Chemin UPDATE : row sans ces clés ⇒ .update() ne touche pas les colonnes,
  // le SEO acquis en base survit.
  assertEquals(seoRowFields({}), {});
  // Cas réel du payload sync quand les champs Airtable sont vides (c44911e) :
  // les clés ne sont pas posées → undefined.
  assertEquals(
    seoRowFields({ description: undefined, meta_title: undefined, meta_description: undefined }),
    {},
  );
});

Deno.test("seoRowFields: strings non vides → écrites telles quelles (valeur brute)", () => {
  // Le trim décide, il n'écrit pas : les espaces de bord sont conservés.
  assertEquals(
    seoRowFields({
      description: "<h2>Pneu</h2>",
      meta_title: " Pneu 10 pouces ",
      meta_description: "Pneu 10x2.50 pour trottinette.",
    }),
    {
      description: "<h2>Pneu</h2>",
      meta_title: " Pneu 10 pouces ",
      meta_description: "Pneu 10x2.50 pour trottinette.",
    },
  );
});

Deno.test("seoRowFields: string vide, espaces seuls, null ou non-string → champ omis", () => {
  assertEquals(
    seoRowFields({
      description: "",
      meta_title: "   ",
      meta_description: null,
    }),
    {},
  );
  assertEquals(seoRowFields({ description: 42, meta_title: undefined }), {});
  // Mixte : seul le champ réellement rempli entre dans row.
  assertEquals(
    seoRowFields({ description: "", meta_title: "Titre", meta_description: null }),
    { meta_title: "Titre" },
  );
});

// ─── Moteur K (fitment_matcher) ─────────────────────────────────────────────

Deno.test("KEY_WIRED_CATEGORIES: allowlist actée, plaquettes exclue", () => {
  assertEquals(KEY_WIRED_CATEGORIES, [
    "chargeurs", "chambres-a-air", "pneus", "pneus-gonflables", "pneus-pleins", "disques",
  ]);
  assertEquals(KEY_WIRED_CATEGORIES.includes("plaquettes"), false);
});

Deno.test("fitmentKindForCategory: familles par slug", () => {
  assertEquals(fitmentKindForCategory("chargeurs"), { kind: "electrical" });
  assertEquals(fitmentKindForCategory("pneus"), { kind: "tire", family: "pneumatic" });
  assertEquals(fitmentKindForCategory("chambres-a-air"), { kind: "tire", family: "pneumatic" });
  assertEquals(fitmentKindForCategory("pneus-pleins"), { kind: "tire", family: "solid" });
  assertEquals(fitmentKindForCategory("disques"), { kind: "disc" });
  assertEquals(fitmentKindForCategory("plaquettes"), null);
});

Deno.test("isFitmentMatchable: règle dure — clés minimales", () => {
  const tire = { kind: "tire" as const, family: "pneumatic" };
  // Conforme : family + rim_diameters (sections optionnelles → cas partiel)
  assertEquals(isFitmentMatchable(tire, { fitment_specs: { tire_family: "pneumatic", rim_diameters: ["10"] } }), true);
  // Famille divergente ou absente → non matchable
  assertEquals(isFitmentMatchable(tire, { fitment_specs: { tire_family: "solid", rim_diameters: ["10"] } }), false);
  assertEquals(isFitmentMatchable(tire, { fitment_specs: { rim_diameters: ["10"] } }), false);
  // Pièce nue → non matchable
  assertEquals(isFitmentMatchable(tire, {}), false);
  // Disque : les 3 ensembles exigés
  const disc = { kind: "disc" as const };
  assertEquals(isFitmentMatchable(disc, { fitment_specs: { brake_disc: { diameters: ["160"], pcds: ["48"], holes: ["6"] } } }), true);
  assertEquals(isFitmentMatchable(disc, { fitment_specs: { brake_disc: { diameters: ["160"], pcds: ["48"] } } }), false);
  // Électrique : voltages entiers non vides
  const elec = { kind: "electrical" as const };
  assertEquals(isFitmentMatchable(elec, { electrical_specs: { voltages: [52, 60] } }), true);
  assertEquals(isFitmentMatchable(elec, { electrical_specs: { voltages: [] } }), false);
});

Deno.test("matchTireScooters: complet → high, section absente → partial, mismatch → rien", () => {
  const scooters = [
    { id: "s-full", tire_family: "pneumatic", rim_diameter_code: "6.5", tire_section_code: "90/65" },
    { id: "s-null-section", tire_family: "pneumatic", rim_diameter_code: "6.5", tire_section_code: null },
    { id: "s-wrong-section", tire_family: "pneumatic", rim_diameter_code: "6.5", tire_section_code: "8.5x2" },
    { id: "s-wrong-rim", tire_family: "pneumatic", rim_diameter_code: "10", tire_section_code: "90/65" },
    { id: "s-solid", tire_family: "solid", rim_diameter_code: "6.5", tire_section_code: "90/65" },
    { id: "s-null-family", tire_family: null, rim_diameter_code: "6.5", tire_section_code: "90/65" },
  ];
  const out = matchTireScooters({ family: "pneumatic", rimDiameters: ["6.5"], tireSections: ["90/65"] }, scooters);
  assertEquals(out, [
    { scooterId: "s-full", confidence: "high", reason: "fitment:pneumatic rim=6.5 section=90/65" },
    { scooterId: "s-null-section", confidence: "medium", reason: "fitment:partial rim=6.5" },
  ]);
});

Deno.test("matchTireScooters: pièce sans sections → tout en partial medium", () => {
  const out = matchTireScooters(
    { family: "solid", rimDiameters: ["6"], tireSections: null },
    [{ id: "s1", tire_family: "solid", rim_diameter_code: "6", tire_section_code: "8x4" }],
  );
  assertEquals(out, [{ scooterId: "s1", confidence: "medium", reason: "fitment:partial rim=6" }]);
});

Deno.test("matchDiscScooters: triple match exigé, aucun partial", () => {
  const scooters = [
    { id: "d-ok", disc_diameter_code: "160", disc_pcd_code: "48", disc_holes_code: "6" },
    { id: "d-wrong-pcd", disc_diameter_code: "160", disc_pcd_code: "44", disc_holes_code: "6" },
    { id: "d-null-holes", disc_diameter_code: "160", disc_pcd_code: "48", disc_holes_code: null },
  ];
  const out = matchDiscScooters({ diameters: ["140", "160"], pcds: ["48"], holes: ["6"] }, scooters);
  assertEquals(out, [
    { scooterId: "d-ok", confidence: "high", reason: "fitment:disc d=160 pcd=48 holes=6" },
  ]);
});
