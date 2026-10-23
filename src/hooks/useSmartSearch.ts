/**
 * Recherche « intelligente » du site (24/10/2026).
 * - Catalogue complet chargé UNE fois à l'ouverture (≈ 440 trottinettes + 560 pièces + marques + familles) :
 *   la recherche se fait dans le navigateur, instantanée, tolérante aux fautes (« teverne » → Teverun).
 * - Résultats SÉPARÉS : marques, trottinettes, pièces, familles — jamais mélangés dans une seule liste.
 * - Une marque reconnue (« teverun », « pneu teverun ») ouvre ses trottinettes ET ses pièces compatibles
 *   (compatibilités vérifiées en base), triées par famille.
 */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SBrand = { id: string; name: string; slug: string; logo_url: string | null; models: number };
export type SScooter = { id: string; slug: string; name: string; image: string | null; parts: number; affiliate: boolean; brandId: string; brandName: string; brandSlug: string };
export type SPart = { id: string; slug: string; name: string; price: number | null; image: string | null; stock: number | null; catName: string; catSlug: string };
export type SFamily = { id: string; name: string; slug: string; count: number };

export const normTxt = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[×]/g, "x").replace(/,/g, ".").replace(/[^a-z0-9.+/x ]+/g, " ").replace(/\s+/g, " ").trim();
const tokens = (s: string) => normTxt(s).split(" ").filter(Boolean);

const lev = (a: string, b: string, max: number) => {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      best = Math.min(best, cur[j]);
    }
    if (best > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
};

/** Score d'un mot cherché contre les mots d'un libellé (0 = absent). */
const tokenScore = (q: string, words: string[], joined: string) => {
  let best = 0;
  for (const w of words) {
    if (w === q) return 3;
    if (w.startsWith(q)) best = Math.max(best, 2.5);
    else if (q.length >= 3 && w.includes(q)) best = Math.max(best, 2);
    else if (q.length >= 4) {
      const d = lev(q, w.slice(0, q.length + 1), 2);
      if (d <= 1) best = Math.max(best, 1.6);
      else if (d === 2 && q.length >= 6) best = Math.max(best, 1.1);
    }
  }
  // « g30 », « 10x2.5 » collés ou séparés
  if (!best && q.length >= 2 && joined.replace(/ /g, "").includes(q)) best = 1.8;
  return best;
};
/** Tous les mots doivent être trouvés ; renvoie la somme (0 si un mot manque). */
const scoreLabel = (qs: string[], label: string) => {
  const words = tokens(label);
  const joined = words.join(" ");
  let total = 0;
  for (const q of qs) {
    const s = tokenScore(q, words, joined);
    if (!s) return 0;
    total += s;
  }
  return total;
};

const FAMILY_WORDS: Record<string, string[]> = {
  pneus: ["pneu", "pneus", "gonflable", "tubeless"],
  "pneus-pleins": ["plein", "pleins", "increvable", "anticrevaison"],
  "chambres-a-air": ["chambre", "chambres", "air", "valve"],
  plaquettes: ["plaquette", "plaquettes", "frein", "freins"],
  disques: ["disque", "disques", "rotor"],
  chargeurs: ["chargeur", "chargeurs", "charge", "batterie"],
};

export const useSearchCatalogue = (enabled: boolean) =>
  useQuery({
    queryKey: ["smart-search-catalogue"],
    enabled,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const [b, s, p, c] = await Promise.all([
        supabase.from("brands").select("id, name, slug, logo_url"),
        supabase.from("scooter_models").select("id, slug, name, image_url, compatible_parts_count, affiliate_link, brand_id, brand:brands!scooter_models_brand_id_fkey(name, slug)").eq("published", true),
        supabase.from("parts").select("id, slug, name, price, image_url, stock_quantity, category:categories(name, slug)").eq("published", true),
        supabase.from("categories").select("id, name, slug"),
      ]);
      if (s.error) throw s.error;
      const scooters: SScooter[] = (s.data || []).map((r) => {
        const x = r as unknown as { id: string; slug: string; name: string; image_url: string | null; compatible_parts_count: number | null; affiliate_link: string | null; brand_id: string; brand: { name: string; slug: string } | null };
        return { id: x.id, slug: x.slug, name: x.name, image: x.image_url, parts: x.compatible_parts_count ?? 0, affiliate: !!x.affiliate_link, brandId: x.brand_id, brandName: x.brand?.name ?? "", brandSlug: x.brand?.slug ?? "" };
      });
      const count = new Map<string, number>();
      scooters.forEach((x) => count.set(x.brandId, (count.get(x.brandId) ?? 0) + 1));
      const brands: SBrand[] = ((b.data || []) as { id: string; name: string; slug: string; logo_url: string | null }[])
        .map((x) => ({ ...x, models: count.get(x.id) ?? 0 })).filter((x) => x.models > 0);
      const parts: SPart[] = (p.data || []).map((r) => {
        const x = r as unknown as { id: string; slug: string; name: string; price: number | null; image_url: string | null; stock_quantity: number | null; category: { name: string; slug: string } | null };
        return { id: x.id, slug: x.slug, name: x.name, price: x.price, image: x.image_url, stock: x.stock_quantity, catName: x.category?.name ?? "", catSlug: x.category?.slug ?? "" };
      });
      const famCount = new Map<string, number>();
      parts.forEach((x) => famCount.set(x.catSlug, (famCount.get(x.catSlug) ?? 0) + 1));
      const families: SFamily[] = ((c.data || []) as { id: string; name: string; slug: string }[])
        .map((x) => ({ ...x, count: famCount.get(x.slug) ?? 0 })).filter((x) => x.count > 0);
      return { brands, scooters, parts, families };
    },
  });

/** Pièces compatibles (vérifiées) avec les trottinettes d'une marque — chargées seulement quand une marque est reconnue. */
const useBrandParts = (brandId: string | null) =>
  useQuery({
    queryKey: ["smart-search-brand-parts", brandId],
    enabled: !!brandId,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("part_compatibility")
        .select("part_id, confidence_level, suggestion_reason, scooter_models!inner(brand_id)")
        .eq("scooter_models.brand_id", brandId as string)
        .limit(2000);
      if (error) throw error;
      const ok = new Set<string>();
      (data || []).forEach((r) => {
        const x = r as { part_id: string; confidence_level: string | null; suggestion_reason: string | null };
        const verified = x.confidence_level === "validated" || (x.suggestion_reason?.startsWith("fitment:") && !x.suggestion_reason.startsWith("fitment:partial"));
        if (verified) ok.add(x.part_id);
      });
      return ok;
    },
  });

export type SmartResults = {
  brand: SBrand | null;
  brands: SBrand[];
  scooters: SScooter[];
  parts: SPart[];
  brandParts: SPart[];
  families: SFamily[];
  familyFilter: string | null;
  ready: boolean;
};

export const useSmartSearch = (query: string, enabled: boolean): SmartResults => {
  const { data } = useSearchCatalogue(enabled);
  const qs = useMemo(() => tokens(query), [query]);

  // Marque reconnue = un mot cherché qui ressemble au nom d'une marque (fautes tolérées).
  const brandHit = useMemo(() => {
    if (!data || !qs.length) return null;
    let best: { b: SBrand; tok: string; s: number } | null = null;
    for (const b of data.brands) {
      const bn = normTxt(b.name).replace(/ /g, "");
      for (const t of qs) {
        if (t.length < 3) continue;
        const s = bn === t ? 3 : bn.startsWith(t) ? 2.5 : t.length >= 5 && lev(t, bn, 2) <= 2 ? 1.5 : t.length >= 4 && lev(t, bn, 1) <= 1 ? 1.8 : 0;
        if (s && (!best || s > best.s)) best = { b, tok: t, s };
      }
    }
    return best;
  }, [data, qs]);

  const { data: brandPartIds } = useBrandParts(brandHit?.b.id ?? null);

  return useMemo<SmartResults>(() => {
    const empty: SmartResults = { brand: null, brands: [], scooters: [], parts: [], brandParts: [], families: [], familyFilter: null, ready: !!data };
    if (!data || !qs.length || (qs.length === 1 && qs[0].length < 2)) return empty;
    const brand = brandHit?.b ?? null;
    const rest = brandHit ? qs.filter((t) => t !== brandHit.tok) : qs;
    const familyFilter = Object.entries(FAMILY_WORDS).find(([, ws]) => rest.some((t) => ws.some((w) => w.startsWith(t) && t.length >= 3)))?.[0] ?? null;

    const brands = data.brands
      .map((b) => ({ b, s: scoreLabel(qs, b.name) || (brand?.id === b.id ? 3 : 0) }))
      .filter((x) => x.s > 0).sort((a, b) => b.s - a.s || b.b.models - a.b.models).slice(0, 4).map((x) => x.b);

    const scooters = data.scooters
      .map((x) => {
        const inBrand = brand && x.brandId === brand.id;
        const s = inBrand ? (rest.length ? scoreLabel(rest, x.name) : 1) : scoreLabel(qs, `${x.brandName} ${x.name}`);
        return { x, s: s ? s + (x.affiliate ? 0.4 : 0) + Math.min(x.parts, 40) / 40 : 0 };
      })
      .filter((r) => r.s > 0).sort((a, b) => b.s - a.s || a.x.name.localeCompare(b.x.name, "fr")).map((r) => r.x);

    const partTerms = familyFilter ? rest.filter((t) => !FAMILY_WORDS[familyFilter].some((w) => w.startsWith(t))) : rest;
    const parts = (brand && !rest.length ? [] : data.parts)
      .filter((p) => !familyFilter || p.catSlug === familyFilter)
      .map((p) => ({ p, s: partTerms.length ? scoreLabel(partTerms, `${p.name} ${p.catName}`) : familyFilter ? 1 : 0 }))
      .filter((r) => r.s > 0).sort((a, b) => b.s - a.s || (b.p.stock ?? 0) - (a.p.stock ?? 0)).map((r) => r.p);

    // Pièces de la marque = compatibilités vérifiées + pièces qui portent son nom (« Pneu … Teverun Fighter 10 »).
    const brandParts = brand
      ? data.parts.filter((p) => (brandPartIds?.has(p.id) || normTxt(p.name).includes(normTxt(brand.name))) && (!familyFilter || p.catSlug === familyFilter)
          && (!partTerms.length || scoreLabel(partTerms, `${p.name} ${p.catName}`) > 0))
      : [];

    const families = data.families
      .filter((f) => (familyFilter ? f.slug === familyFilter : qs.some((t) => t.length >= 3 && FAMILY_WORDS[f.slug]?.some((w) => w.startsWith(t)))))
      .map((f) => (brand ? { ...f, count: brandParts.filter((p) => p.catSlug === f.slug).length } : f)).filter((f) => f.count > 0);

    return { brand, brands, scooters, parts: brand ? [] : parts, brandParts, families, familyFilter, ready: true };
  }, [data, qs, brandHit, brandPartIds]);
};
