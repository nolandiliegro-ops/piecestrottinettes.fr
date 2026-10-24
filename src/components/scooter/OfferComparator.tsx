/* « Où acheter » en comparateur multi-offres (24/10/2026, demande de Nolan : « plusieurs liens avec plusieurs prix »).
   Lit public.scooter_offers (une ligne par boutique, prix relevé chaque nuit par le robot de prix, voir
   claude/robot-prix-plan.md). Propositions derrière ?comparo=1..5 ; sans paramètre : rien ne change.
   Règles : prix affiché seulement s'il a 7 jours ou moins (livePrice) ; « dès » quand la boutique vend plusieurs
   versions (price_max) ; en stock d'abord, puis le moins cher ; Amazon jamais en tête s'il existe une autre offre
   (dernier recours, choix de Nolan) ; tout lien sortant en rel="sponsored" (compté par affiliateClicks). */
import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { partnerOf, type Partner } from "@/config/partners";
import { laName } from "@/lib/article";
import { livePrice, partnerLogo, useBuyCtx, TagLink } from "@/components/scooter/BuyProposals";
import type { ReactNode } from "react";
import { PriceAlertForm } from "@/components/scooter/PriceAlert";

const UNB = "'Unbounded', sans-serif";
const FONT = "'Plus Jakarta Sans', sans-serif";
const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const CARBON = "#1A1A1A";
const GREEN = "#4A7C59";
const LINE = "#E7E1D6";
const STONE = "#EDE6DA";
const CHAMFER = "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)";
const CHAMFER_L = "polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 0 100%)";

export type ComparoLook = 1 | 2 | 3 | 4 | 5;
// 24/10 (choix de Nolan, reco) : « Le meilleur d'abord » (3) par défaut ; ?comparo=0 = ancien bloc, 1..5 = propositions.
export const comparoParam = (): ComparoLook | null => {
  if (typeof window === "undefined") return 3;
  const sp = new URLSearchParams(window.location.search);
  if (!sp.has("comparo")) return 3;
  const n = Number(sp.get("comparo"));
  return n >= 1 && n <= 5 ? (n as ComparoLook) : null;
};

interface OfferRow {
  id: string;
  merchant_host: string;
  offer_type: "marque" | "revendeur" | "amazon";
  affiliate_url: string;
  price_eur: number | null;
  price_max: number | null;
  in_stock: boolean | null;
  price_checked_at: string | null;
}
interface Offer extends OfferRow { p: Partner & { host: string }; price: number | null; from: boolean }

const eur = (n: number) => `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: n % 1 ? 2 : 0, minimumFractionDigits: n % 1 ? 2 : 0 }).format(n).replace(/\s/g, " ")} €`;
const day = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
const isOfficial = (p: Partner) => (p.tagline ?? "").toLowerCase().includes("officielle");

const rank = (o: Offer) => [o.offer_type === "amazon" ? 1 : 0, o.in_stock === false ? 1 : 0, o.price ?? Number.MAX_SAFE_INTEGER];
const byRank = (a: Offer, b: Offer) => {
  const ra = rank(a), rb = rank(b);
  for (let i = 0; i < ra.length; i++) if (ra[i] !== rb[i]) return ra[i] - rb[i];
  return 0;
};

const useOffers = (scooterId?: string | null) => useQuery({
  queryKey: ["scooter-offers", scooterId],
  enabled: !!scooterId,
  staleTime: 10 * 60_000,
  queryFn: async (): Promise<Offer[]> => {
    // Table hors des types générés : cast local (même méthode que affiliateClicks).
    const { data, error } = await (supabase as unknown as { from: (t: string) => any })
      .from("scooter_offers")
      .select("id, merchant_host, offer_type, affiliate_url, price_eur, price_max, in_stock, price_checked_at")
      .eq("scooter_model_id", scooterId)
      .eq("is_active", true);
    if (error) throw error;
    return ((data ?? []) as OfferRow[]).flatMap((r) => {
      const p = partnerOf(r.affiliate_url);
      if (!p) return [];
      const price = livePrice(r.price_eur, r.price_checked_at);
      // Pas de « dès » (24/10) : le prix max d'une page produit mélange parfois un autre modèle (Blade Mini Pro/Ultra)
      // ou un pack de 2 (i9Ultra × 2). On affiche le prix exact de la variante où atterrit le visiteur.
      return [{ ...r, p, price, from: false }];
    }).sort(byRank);
  },
});

const Legal = () => (
  <p className="flex items-start gap-2 text-sm text-gray-500">
    <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
    <span>Liens partenaires : une petite commission pour nous, aucun surcoût pour toi. Prix relevés chaque nuit sur les boutiques, à vérifier au moment de l'achat.</span>
  </p>
);
const Stock = ({ o }: { o: Offer }) => o.in_stock === false
  ? <span className="text-sm font-bold" style={{ color: "#DC2626" }}>Rupture</span>
  : o.in_stock ? <span className="inline-flex items-center gap-1 text-sm font-bold" style={{ color: GREEN }}><Check className="w-4 h-4" />En stock</span> : null;
const PriceTxt = ({ o, size = "text-2xl" }: { o: Offer; size?: string }) => o.price == null
  ? <span className="text-sm text-gray-500">Prix sur la boutique</span>
  : <span className="whitespace-nowrap">{o.from && <span className="text-sm font-semibold text-gray-500 mr-1">dès</span>}<span className={size} style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: CARBON }}>{eur(o.price)}</span></span>;
const Checked = ({ offers }: { offers: Offer[] }) => {
  const d = offers.map((o) => o.price_checked_at).filter(Boolean).sort().pop();
  return d ? <span className="text-sm text-gray-500">Relevé le {day(d!)}</span> : null;
};
const Logo = ({ o, brandLogo, size }: { o: Offer; brandLogo: string | null; size: number }) => {
  const src = partnerLogo(o.p, brandLogo);
  return src ? (
    <span className="shrink-0 flex items-center justify-center bg-white" style={{ width: size, height: size, clipPath: CHAMFER, boxShadow: `inset 0 0 0 1px ${LINE}` }}>
      <img src={src} alt={`Logo ${o.p.name}`} className="object-contain" style={{ width: size * 0.72, height: size * 0.72 }} />
    </span>
  ) : (
    <span className="shrink-0 flex items-center justify-center text-base font-black uppercase" style={{ width: size, height: size, background: STONE, color: CARBON, clipPath: CHAMFER }}>{o.p.name.slice(0, 1)}</span>
  );
};
const Go = ({ o, label = "Voir l'offre", tone = GREEN, full = false, small = false }: { o: Offer; label?: string; tone?: string; full?: boolean; small?: boolean }) => (
  <a href={o.affiliate_url} target="_blank" rel="sponsored noopener noreferrer" data-placement="comparateur"
    className={`group inline-flex items-center justify-center gap-2 ${small ? "min-h-[44px] px-4 text-sm" : "min-h-[56px] px-6 text-base"} ${full ? "w-full" : ""} font-extrabold uppercase tracking-wider text-white transition-opacity hover:opacity-90`}
    style={{ background: tone, clipPath: CHAMFER, fontFamily: FONT }}>
    <span className="whitespace-nowrap">{label}</span><ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
  </a>
);
// Alerte de baisse de prix : branchée le 24/10 (PriceAlert.tsx → subscribe_price_alert, mail la nuit).
const Alert = () => <PriceAlertForm />;
const Title = ({ name }: { name: string }) => (
  <h2 className="text-xl lg:text-2xl uppercase" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: CARBON }}>Où acheter {laName(name)}</h2>
);

export const OfferComparator = ({ look, name, fallback = null }: { look: ComparoLook; name: string; fallback?: ReactNode }) => {
  const buy = useBuyCtx();
  const { data: offers } = useOffers(buy.scooterId);
  // Chargement, erreur ou aucune offre en base : l'ancien bloc à un lien reste affiché (jamais de trou).
  if (!offers || offers.length === 0) return <>{fallback}</>;
  const best = offers[0];
  const others = offers.slice(1);
  const brandLogo = buy.brandLogo;
  const n = offers.length;
  const count = `${n} boutique${n > 1 ? "s" : ""}`;

  // 1 · Repassé : la ligne de comparateur choisie le 24/10, répétée par boutique, « Meilleur prix » sur la première.
  if (look === 1) return (
    <div id="ou-acheter" className="mt-10 scroll-mt-24" style={{ fontFamily: FONT }}>
      <div className="flex items-end justify-between gap-3 mb-3"><Title name={name} /><Checked offers={offers} /></div>
      <div className="grid gap-3">
        {offers.map((o, i) => (
          <div key={o.id} className="bg-white grid grid-cols-[auto_1fr] lg:grid-cols-[auto_1fr_auto_auto] gap-4 items-center p-4 lg:p-5"
            style={{ clipPath: CHAMFER_L, boxShadow: `inset 4px 0 0 ${i === 0 ? GREEN : LINE}, inset 0 0 0 1px ${LINE}` }}>
            <Logo o={o} brandLogo={brandLogo} size={56} />
            <div className="min-w-0">
              {i === 0 && n > 1 && <span className="inline-block mb-1 px-2 py-0.5 text-sm font-extrabold uppercase tracking-wider text-white" style={{ background: GREEN }}>Meilleur prix</span>}
              <p className="text-lg font-extrabold uppercase leading-tight" style={{ color: CARBON }}>{o.p.name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">{isOfficial(o.p) && <span className="text-sm font-bold" style={{ color: GREEN }}>Boutique officielle</span>}<Stock o={o} /></div>
            </div>
            <div className="col-span-2 lg:col-span-1 lg:text-right"><PriceTxt o={o} size="text-3xl" /></div>
            <div className="col-span-2 lg:col-span-1"><Go o={o} full /></div>
          </div>
        ))}
      </div>
      <div className="mt-3"><Legal /></div>
    </div>
  );

  // 2 · Tableau : le comparateur au pied de la lettre, une ligne dense par boutique.
  if (look === 2) return (
    <div id="ou-acheter" className="mt-10 scroll-mt-24" style={{ fontFamily: FONT }}>
      <Title name={name} />
      <p className="mt-1 text-sm text-gray-500">{count} comparée{n > 1 ? "s" : ""} · <Checked offers={offers} /></p>
      <div className="mt-3 bg-white" style={{ clipPath: CHAMFER_L, boxShadow: `inset 0 0 0 1px ${LINE}` }}>
        <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-2 text-sm font-extrabold uppercase tracking-wider text-gray-500" style={{ background: STONE }}>
          <span>Boutique</span><span className="w-24">Stock</span><span className="w-32 text-right">Prix</span><span className="w-36" />
        </div>
        {offers.map((o, i) => (
          <div key={o.id} className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_auto_auto_auto] gap-x-4 gap-y-2 items-center px-4 sm:px-5 py-3" style={{ borderTop: i ? `1px solid ${LINE}` : undefined }}>
            <span className="min-w-0">
              <span className="block text-base font-extrabold uppercase truncate" style={{ color: CARBON }}>{o.p.name}</span>
              {i === 0 && n > 1 && <span className="block text-sm font-bold" style={{ color: GREEN }}>Le moins cher</span>}
            </span>
            <span className="sm:w-24 text-right sm:text-left"><Stock o={o} /></span>
            <span className="sm:w-32 sm:text-right"><PriceTxt o={o} size="text-xl" /></span>
            <span className="sm:w-36 justify-self-end"><Go o={o} label="Voir" small /></span>
          </div>
        ))}
      </div>
      <div className="mt-3"><Legal /></div>
    </div>
  );

  // 3 · Le meilleur d'abord : grande carte pour la meilleure offre, les autres en lignes discrètes (orange réservé à NOS produits).
  if (look === 3) return (
    <div id="ou-acheter" className="mt-10 scroll-mt-24" style={{ fontFamily: FONT }}>
      <Title name={name} />
      <div className="mt-3 p-5 lg:p-7 bg-white grid lg:grid-cols-[1fr_auto] gap-5 items-center" style={{ clipPath: CHAMFER_L, boxShadow: `inset 0 0 0 2px ${CARBON}` }}>
        <div className="flex items-center gap-4 min-w-0">
          <Logo o={best} brandLogo={brandLogo} size={72} />
          <div className="min-w-0">
            <p className="text-sm font-extrabold uppercase tracking-[0.14em]" style={{ color: GREEN }}>{n > 1 ? "Le meilleur prix en ce moment" : "Prix en ce moment"}</p>
            <p className="mt-1"><PriceTxt o={best} size="text-4xl" /></p>
            <p className="mt-1 text-base font-bold" style={{ color: CARBON }}>chez {best.p.name} <span className="ml-2"><Stock o={best} /></span></p>
          </div>
        </div>
        <TagLink href={best.affiliate_url} line1="Voir l'offre" line2={`chez ${best.p.name}`} full />
      </div>
      {others.length > 0 && (
        <ul className="mt-2">
          {others.map((o) => (
            <li key={o.id}>
              <a href={o.affiliate_url} target="_blank" rel="sponsored noopener noreferrer" data-placement="comparateur"
                className="flex items-center gap-3 min-h-[52px] px-4 hover:bg-white transition-colors" style={{ borderBottom: `1px solid ${LINE}` }}>
                <span className="flex-1 min-w-0 text-base font-semibold truncate" style={{ color: CARBON }}>Aussi chez {o.p.name}</span>
                <PriceTxt o={o} size="text-lg" />
                <ArrowRight className="w-5 h-5 shrink-0" style={{ color: GREEN }} />
              </a>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-3"><Alert /><Checked offers={offers} /></div>
      <div className="mt-3"><Legal /></div>
    </div>
  );

  // 4 · Relevé de l'atelier : dans l'esprit de l'« ordre de réparation » des conseils, lignes pointillées jusqu'au prix.
  if (look === 4) return (
    <div id="ou-acheter" className="mt-10 scroll-mt-24 -mx-4 lg:mx-0 px-5 py-6 lg:px-8 lg:py-7" style={{ background: "#FBF8F3", boxShadow: `inset 0 0 0 1px ${LINE}`, clipPath: CHAMFER_L, fontFamily: FONT }}>
      <div className="flex flex-wrap items-end justify-between gap-2 pb-3" style={{ borderBottom: `2px dashed ${CARBON}` }}>
        <div>
          <p className="text-sm font-extrabold uppercase tracking-[0.16em]" style={{ color: GREEN }}>Relevé de prix de l'atelier</p>
          <Title name={name} />
        </div>
        <span className="text-sm" style={{ fontFamily: MONO, color: CARBON }}>{count.toUpperCase()} · <Checked offers={offers} /></span>
      </div>
      <ol className="mt-2">
        {offers.map((o, i) => (
          <li key={o.id} className="py-3" style={{ borderBottom: `1px dashed ${LINE}` }}>
            <div className="flex items-baseline gap-2">
              <span className="text-sm shrink-0" style={{ fontFamily: MONO, color: GREEN }}>{String(i + 1).padStart(2, "0")}</span>
              <span className="text-base font-extrabold uppercase shrink-0" style={{ color: CARBON }}>{o.p.name}</span>
              <span className="flex-1 min-w-[12px] border-b-2 border-dotted translate-y-[-4px]" style={{ borderColor: "#B9B1A3" }} />
              <PriceTxt o={o} size="text-2xl" />
            </div>
            <div className="mt-2 pl-7 flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-3">{isOfficial(o.p) && <span className="text-sm text-gray-600">Boutique officielle</span>}<Stock o={o} /></span>
              <Go o={o} label="Voir l'offre" small tone={i === 0 ? GREEN : CARBON} />
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-4"><Legal /></div>
    </div>
  );

  // 5 · Sobre : une ligne par boutique (nom + prix + flèche), l'alerte de prix juste dessous.
  return (
    <div id="ou-acheter" className="mt-10 scroll-mt-24" style={{ fontFamily: FONT }}>
      <div className="flex items-end justify-between gap-3"><Title name={name} /><Checked offers={offers} /></div>
      <div className="mt-3 grid gap-2">
        {offers.map((o, i) => (
          <a key={o.id} href={o.affiliate_url} target="_blank" rel="sponsored noopener noreferrer" data-placement="comparateur"
            className="group flex items-center gap-4 min-h-[64px] px-5 bg-white transition-shadow"
            style={{ clipPath: CHAMFER, boxShadow: `inset 0 0 0 ${i === 0 ? 2 : 1}px ${i === 0 ? GREEN : LINE}` }}>
            <span className="flex-1 min-w-0">
              <span className="block text-base font-extrabold uppercase truncate" style={{ color: CARBON }}>{o.p.name}</span>
              {o.in_stock === false && <span className="block"><Stock o={o} /></span>}
            </span>
            <PriceTxt o={o} size="text-2xl" />
            <span className="w-10 h-10 shrink-0 flex items-center justify-center text-white transition-transform group-hover:translate-x-0.5" style={{ background: i === 0 ? GREEN : CARBON }}><ArrowRight className="w-5 h-5" /></span>
          </a>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3"><Alert /></div>
      <div className="mt-3"><Legal /></div>
    </div>
  );
};
