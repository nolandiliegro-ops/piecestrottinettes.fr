// Comptoir Pro (25/10/2026) — écran des magasins revendeurs, direction « Rayons » choisie par Nolan.
// Ouvert par le lien perso envoyé sur WhatsApp (/pro/<jeton>), sans mot de passe ni email.
// Rayons en grandes photos → grille photo de la famille → panier de la semaine collé en bas → récap → commande à régler au retrait.
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { optimizedImage } from "@/lib/imageTransform";
import {
  resolveProToken, proMe, proCatalogue, proCartSet, proCommander, proCommandes, proErrorMessage,
  eurFR, jourFR, PRO_STATUS_LABEL, type ProPiece, type ProCart,
} from "@/lib/pro";

const C = { ink: "#1A1A1A", green: "#4A7C59", greenD: "#3A6449", greenL: "#E6EEE8", orange: "#FF6600", bg: "#FAFAF8", line: "#E2DED5", muted: "#5E625C", red: "#DC2626" };
const JAK = "'Plus Jakarta Sans', system-ui, sans-serif";
const UNB = "'Unbounded', 'Arial Black', sans-serif";
const cut = (n: number) => `polygon(${n}px 0,100% 0,100% calc(100% - ${n}px),calc(100% - ${n}px) 100%,0 100%,0 ${n}px)`;
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[×*]/g, "x");

type Cat = { id: string; name: string; slug: string; display_order: number | null };

function useCountdown(iso: string | undefined) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 60_000); return () => clearInterval(t); }, []);
  if (!iso) return "";
  const ms = new Date(iso).getTime() - now;
  if (ms <= 0) return "";
  const h = Math.floor(ms / 3_600_000), j = Math.floor(h / 24);
  return j >= 1 ? `${j} j ${h % 24} h` : `${h} h ${Math.floor((ms % 3_600_000) / 60_000)} min`;
}

const Stepper = ({ q, onChange, big }: { q: number; onChange: (n: number) => void; big?: boolean }) => (
  <div className="flex items-center justify-between bg-white" style={{ border: `2px solid ${C.ink}`, height: big ? 52 : 46 }}>
    <button type="button" aria-label="Enlever un" onClick={() => onChange(q - 1)} className="w-12 h-full text-[24px] font-extrabold active:bg-black/5">−</button>
    <span className="text-[18px] font-extrabold tabular-nums">{q}</span>
    <button type="button" aria-label="Ajouter un" onClick={() => onChange(q + 1)} className="w-12 h-full text-[24px] font-extrabold active:bg-black/5">+</button>
  </div>
);

const AddBtn = ({ onClick }: { onClick: () => void }) => (
  <button type="button" onClick={onClick} className="w-full font-extrabold text-[15px] bg-white active:bg-[#E6EEE8]"
    style={{ border: `2px solid ${C.green}`, color: C.greenD, height: 46 }}>+ Ajouter</button>
);

const Photo = ({ src, alt, ratio = "1 / 1" }: { src: string | null; alt: string; ratio?: string }) => (
  <div className="bg-white grid place-items-center overflow-hidden" style={{ aspectRatio: ratio }}>
    {src ? <img src={optimizedImage(src, 400)} alt={alt} loading="lazy" className="w-[88%] h-[88%] object-contain" />
      : <span className="text-[14px]" style={{ color: C.muted }}>Photo à venir</span>}
  </div>
);

const Pro = () => {
  const { token: tokenParam } = useParams();
  const token = useMemo(() => resolveProToken(tokenParam), [tokenParam]);
  const qc = useQueryClient();
  const [tab, setTab] = useState<"commander" | "commandes">("commander");
  const [rayon, setRayon] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [qty, setQty] = useState<Record<string, number>>({});
  const [cart, setCart] = useState<ProCart | null>(null);
  const [recap, setRecap] = useState(false);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<{ order_number: string; total_ttc: number; retrait: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const seq = useRef(0);
  const topRef = useRef<HTMLDivElement>(null);

  const me = useQuery({ queryKey: ["pro-me", token], queryFn: () => proMe(token!), enabled: !!token, retry: false, staleTime: 60_000 });
  const cat = useQuery({ queryKey: ["pro-cat", token], queryFn: () => proCatalogue(token!), enabled: !!token && me.isSuccess, staleTime: 300_000 });
  const cats = useQuery({
    queryKey: ["pro-categories"], staleTime: 3_600_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id, name, slug, display_order");
      if (error) throw error;
      return (data ?? []) as Cat[];
    },
  });
  const orders = useQuery({ queryKey: ["pro-orders", token], queryFn: () => proCommandes(token!), enabled: !!token && tab === "commandes" });

  // Panier serveur → état local, une fois au chargement.
  useEffect(() => {
    if (me.data && cart === null) {
      setCart(me.data.panier);
      setQty(Object.fromEntries(me.data.panier.lignes.map((l) => [l.part_id, l.quantite])));
    }
  }, [me.data, cart]);

  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 3500); return () => clearTimeout(t); }, [toast]);

  const countdown = useCountdown(cart?.cycle.cloture || me.data?.cycle.cloture);
  const pieces = cat.data ?? [];
  const byId = useMemo(() => new Map(pieces.map((p) => [p.part_id, p])), [pieces]);

  const rayons = useMemo(() => {
    const m = new Map<string, ProPiece[]>();
    for (const p of pieces) { if (!p.category_id) continue; (m.get(p.category_id) ?? m.set(p.category_id, []).get(p.category_id)!).push(p); }
    return (cats.data ?? [])
      .filter((c) => (m.get(c.id)?.length ?? 0) > 0)
      .map((c) => {
        const list = m.get(c.id)!;
        const cover = list.find((p) => p.image_url && p.stock > 0) ?? list.find((p) => p.image_url) ?? list[0];
        return { ...c, list, cover: cover?.image_url ?? null };
      })
      .sort((a, b) => b.list.length - a.list.length);
  }, [pieces, cats.data]);

  const visible: ProPiece[] = useMemo(() => {
    const q = norm(search.trim());
    if (q) {
      const words = q.split(/\s+/).filter(Boolean);
      return pieces.filter((p) => { const h = norm(`${p.name} ${p.sku ?? ""} ${p.ean ?? ""}`); return words.every((w) => h.includes(w)); }).slice(0, 60);
    }
    return rayon ? rayons.find((r) => r.id === rayon)?.list ?? [] : [];
  }, [search, rayon, pieces, rayons]);

  const setQuantity = (partId: string, n: number) => {
    if (!token) return;
    const q = Math.max(0, Math.min(999, n));
    setQty((s) => ({ ...s, [partId]: q }));
    const mine = ++seq.current;
    proCartSet(token, partId, q)
      .then((c) => { if (mine === seq.current) { setCart(c); setQty(Object.fromEntries(c.lignes.map((l) => [l.part_id, l.quantite]))); } })
      .catch((e) => {
        setToast(proErrorMessage(e));
        if (mine === seq.current) { setCart(null); qc.invalidateQueries({ queryKey: ["pro-me", token] }); }
      });
  };

  // Recommander une ancienne commande : écritures l'une après l'autre (le panier renvoyé par la dernière fait foi).
  const recommander = async (lignes: { part_id: string | null; quantite: number }[]) => {
    if (!token) return;
    const mine = ++seq.current;
    let last: ProCart | null = null, absent = 0;
    try {
      for (const l of lignes) {
        if (!l.part_id || !byId.has(l.part_id)) { absent++; continue; }
        last = await proCartSet(token, l.part_id, (qty[l.part_id] ?? 0) + l.quantite);
      }
    } catch (e) { setToast(proErrorMessage(e)); }
    if (last && mine === seq.current) { setCart(last); setQty(Object.fromEntries(last.lignes.map((x) => [x.part_id, x.quantite]))); }
    setTab("commander");
    if (last) setToast(absent ? `Pièces ajoutées. ${absent} n'est plus au catalogue.` : "Pièces ajoutées à ton panier de la semaine.");
  };

  const nbPieces = Object.values(qty).reduce((a, b) => a + b, 0);

  const commander = async () => {
    if (!token || sending) return;
    setSending(true);
    try {
      const r = await proCommander(token, note.trim() || null);
      setDone(r); setRecap(false); setNote(""); setQty({});
      setCart((c) => (c ? { ...c, lignes: [], sous_total_ht: 0, tva: 0, total_ttc: 0 } : c));
      qc.invalidateQueries({ queryKey: ["pro-cat", token] });
      qc.invalidateQueries({ queryKey: ["pro-orders", token] });
    } catch (e) {
      setToast(proErrorMessage(e));
    } finally {
      setSending(false);
    }
  };

  const goRayon = (id: string | null) => { setRayon(id); setSearch(""); topRef.current?.scrollIntoView({ block: "start" }); };

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen" style={{ background: C.bg, color: C.ink, fontFamily: JAK }}>
      <Helmet><title>Comptoir Pro · piecestrottinettes.fr</title><meta name="robots" content="noindex,nofollow" /></Helmet>
      {children}
    </div>
  );

  if (!token || me.isError) {
    return shell(
      <div className="max-w-md mx-auto px-5 pt-20 text-center grid gap-4">
        <img src="/brand/logo-pt-2026.svg" alt="piecestrottinettes.fr" className="w-[220px] mx-auto" />
        <h1 className="text-[22px] font-black uppercase italic" style={{ fontFamily: UNB }}>Comptoir Pro</h1>
        <p className="text-[16px]">{token ? proErrorMessage(me.error) : "Ouvre le lien que Nolan t'a envoyé sur WhatsApp pour accéder à ton comptoir."}</p>
      </div>,
    );
  }

  if (me.isLoading || !me.data) {
    return shell(<div className="min-h-screen grid place-items-center"><img src="/brand/logo-pt-2026.svg" alt="" className="w-[220px] animate-pulse motion-reduce:animate-none" /></div>);
  }

  const m = me.data;
  const cycle = cart?.cycle ?? m.cycle;

  return shell(
    <>
      {/* En-tête */}
      <div ref={topRef} className="sticky top-0 z-30" style={{ background: C.ink }}>
        <div className="max-w-[1180px] mx-auto px-4 py-3 flex items-center justify-between gap-3 text-white">
          <span className="text-[16px] font-black italic tracking-tight" style={{ fontFamily: UNB }}>pieces<span style={{ color: "#8FC29E" }}>trott</span> PRO</span>
          <span className="text-right leading-tight min-w-0">
            <span className="block text-[14px] font-bold truncate">{m.nom_magasin}</span>
            <span className="block text-[14px] font-bold" style={{ color: "#8FC29E" }}>{m.palier.nom} · −{Number(m.palier.remise_pct)} %</span>
          </span>
        </div>
        <div style={{ background: C.greenL, color: C.greenD }}>
          <div className="max-w-[1180px] mx-auto px-4 py-2 flex justify-between gap-2 text-[14px] font-extrabold">
            <span>Avant {jourFR(cycle.cloture)?.split(" ")[0]} 12 h{countdown ? ` · ${countdown}` : ""}</span>
            <span className="whitespace-nowrap">Retrait {cycle.retrait ? new Date(`${cycle.retrait.slice(0, 10)}T12:00:00`).toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "2-digit" }) : ""}</span>
          </div>
        </div>
        <div className="bg-white border-b" style={{ borderColor: C.line }}>
          <div className="max-w-[1180px] mx-auto px-4 flex">
            {(["commander", "commandes"] as const).map((t) => (
              <button key={t} type="button" onClick={() => { setTab(t); setDone(null); }}
                className="flex-1 sm:flex-none sm:px-8 h-12 text-[15px] font-extrabold"
                style={{ borderBottom: `3px solid ${tab === t ? C.green : "transparent"}`, color: tab === t ? C.ink : C.muted }}>
                {t === "commander" ? "Commander" : "Mes commandes"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-[1180px] mx-auto pb-36">
        {tab === "commander" && done && (
          <section className="px-4 pt-8 grid gap-4 max-w-lg mx-auto text-center">
            <div className="mx-auto w-16 h-16 grid place-items-center text-white text-[30px] font-black" style={{ background: C.green, clipPath: cut(10) }}>✓</div>
            <h1 className="text-[22px] font-black uppercase italic" style={{ fontFamily: UNB }}>Commande envoyée</h1>
            <p className="text-[16px]">N° <b>{done.order_number}</b> · {eurFR(done.total_ttc)}</p>
            <p className="text-[16px]">Retrait au magasin à partir du <b>{jourFR(done.retrait)}</b>. Tu règles sur place : espèces, carte ou virement.</p>
            <p className="text-[14px]" style={{ color: C.muted }}>Nolan a reçu ta commande. Il te prévient sur WhatsApp quand elle est prête.</p>
            <button type="button" onClick={() => { setDone(null); goRayon(null); }} className="h-12 font-extrabold text-white" style={{ background: C.green, clipPath: cut(10) }}>Nouvelle commande</button>
          </section>
        )}

        {tab === "commander" && !done && (
          <>
            <div className="px-4 pt-3">
              <label htmlFor="pro-search" className="sr-only">Chercher une pièce</label>
              <input id="pro-search" value={search} onChange={(e) => setSearch(e.target.value)} inputMode="search" autoComplete="off"
                placeholder="🔍 Chercher : 10x2, Mi4, GX16, Magura…"
                className="w-full h-12 px-4 text-[16px] bg-white outline-none focus:ring-2 focus:ring-[#4A7C59]" style={{ border: `1.5px solid ${C.line}` }} />
            </div>

            {!search && !rayon && (
              <section className="px-4 pt-4">
                <h2 className="sr-only">Rayons</h2>
                {cat.isLoading ? <p className="py-10 text-center" style={{ color: C.muted }}>Chargement du catalogue…</p> : (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {rayons.map((r) => (
                      <button key={r.id} type="button" onClick={() => goRayon(r.id)} className="text-left bg-white overflow-hidden active:scale-[.98] transition-transform" style={{ border: `1px solid ${C.line}` }}>
                        <Photo src={r.cover} alt="" ratio="4 / 3" />
                        <span className="flex justify-between items-baseline gap-2 px-3 py-2.5 text-white" style={{ background: C.ink }}>
                          <span className="text-[14px] font-extrabold italic uppercase leading-tight" style={{ fontFamily: UNB }}>{r.name}</span>
                          <span className="text-[14px] whitespace-nowrap" style={{ color: "#C9D9CD" }}>{r.list.length} réf.</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </section>
            )}

            {(search || rayon) && (
              <section className="px-4 pt-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h2 className="text-[20px] font-black italic uppercase leading-tight" style={{ fontFamily: UNB }}>
                    {search ? `${visible.length} résultat${visible.length > 1 ? "s" : ""}` : rayons.find((r) => r.id === rayon)?.name}
                  </h2>
                  <button type="button" onClick={() => goRayon(null)} className="h-11 px-4 text-[14px] font-extrabold bg-white whitespace-nowrap" style={{ border: `1.5px solid ${C.ink}` }}>← Rayons</button>
                </div>
                {visible.length === 0 && <p className="py-8 text-center" style={{ color: C.muted }}>Aucune pièce trouvée. Essaie une taille (10x2) ou un modèle (Mi4).</p>}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {visible.map((p) => {
                    const q = qty[p.part_id] ?? 0;
                    return (
                      <article key={p.part_id} className="bg-white grid gap-2 pb-2.5 relative" style={{ border: `1px solid ${q ? C.green : C.line}`, boxShadow: q ? `inset 0 0 0 2px ${C.green}` : undefined }}>
                        {p.deja_commande > 0 && <span className="absolute top-2 left-2 z-10 text-[14px] font-bold px-2 py-0.5 text-white" style={{ background: C.ink }}>Déjà pris</span>}
                        <Photo src={p.image_url} alt={p.name} />
                        <div className="px-2.5 grid gap-1">
                          {/* police posée à la main : la règle globale du site met h1-h3 en Bebas Neue majuscule */}
                          <h3 className="text-[14px] font-bold leading-tight line-clamp-2 min-h-[2.5em] normal-case tracking-normal" style={{ fontFamily: JAK }}>{p.name}</h3>
                          <p className="text-[16px] font-extrabold" style={{ color: C.greenD }}>
                            {eurFR(p.prix_pro_ht)}
                            {p.prix_pro_ht < p.prix_public_ht && <s className="ml-1.5 text-[14px] font-semibold" style={{ color: C.muted }}>{eurFR(p.prix_public_ht)}</s>}
                                                      </p>
                          <p className="text-[14px] font-bold" style={{ color: p.stock > 0 ? C.greenD : C.muted }}>{p.stock > 0 ? "En magasin" : "Sous 3-5 jours"}</p>
                        </div>
                        <div className="px-2.5">{q ? <Stepper q={q} onChange={(n) => setQuantity(p.part_id, n)} /> : <AddBtn onClick={() => setQuantity(p.part_id, 1)} />}</div>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}

        {tab === "commandes" && (
          <section className="px-4 pt-5 grid gap-5 max-w-2xl">
            <div className="bg-white p-4 grid gap-2" style={{ border: `1px solid ${C.line}` }}>
              <p className="text-[15px] font-extrabold">Palier {m.palier.nom} : −{Number(m.palier.remise_pct)} % sur tout</p>
              {m.suivant ? (
                <>
                  <div className="h-3 relative" style={{ background: C.line }}>
                    <span className="absolute inset-y-0 left-0" style={{ background: C.green, width: `${Math.min(100, (m.ca_12m_ht / m.suivant.seuil_ca_ht) * 100)}%` }} />
                  </div>
                  <p className="text-[14px]" style={{ color: C.muted }}>Encore <b style={{ color: C.ink }}>{eurFR(m.suivant.reste_ht)}</b> d'achats sur 12 mois pour passer {m.suivant.nom} (−{Number(m.suivant.remise_pct)} %).</p>
                </>
              ) : <p className="text-[14px]" style={{ color: C.muted }}>Tu es au palier le plus haut.</p>}
            </div>
            {orders.isLoading && <p style={{ color: C.muted }}>Chargement…</p>}
            {orders.data && orders.data.length === 0 && <p style={{ color: C.muted }}>Pas encore de commande.</p>}
            {orders.data?.map((o) => (
              <article key={o.order_number} className="bg-white p-4 grid gap-3" style={{ border: `1px solid ${C.line}` }}>
                <div className="flex justify-between gap-3 items-baseline">
                  <span className="text-[16px] font-extrabold">{o.order_number}</span>
                  <span className="text-[14px] font-extrabold px-2 py-0.5" style={{ background: o.status === "prete" ? C.orange : C.greenL, color: o.status === "prete" ? "#fff" : C.greenD }}>{PRO_STATUS_LABEL[o.status] ?? o.status}</span>
                </div>
                <p className="text-[14px]" style={{ color: C.muted }}>{new Date(o.created_at).toLocaleDateString("fr-FR")} · retrait {jourFR(o.retrait_prevu)} · <b style={{ color: C.ink }}>{eurFR(o.total_ttc)}</b></p>
                <div className="flex gap-2 overflow-x-auto">
                  {(o.lignes ?? []).map((l, i) => (
                    <span key={i} className="relative flex-none w-14 h-14 bg-white grid place-items-center" style={{ border: `1px solid ${C.line}` }} title={l.name}>
                      {l.image_url ? <img src={optimizedImage(l.image_url, 120)} alt={l.name} className="w-[85%] h-[85%] object-contain" loading="lazy" /> : null}
                      <span className="absolute -top-1.5 -right-1.5 min-w-6 h-6 px-1 rounded-full text-white text-[14px] font-extrabold grid place-items-center" style={{ background: C.ink }}>{l.quantite}</span>
                    </span>
                  ))}
                </div>
                <button type="button" className="h-11 font-extrabold text-[15px] bg-white" style={{ border: `2px solid ${C.green}`, color: C.greenD }}
                  onClick={() => recommander(o.lignes ?? [])}>
                  Recommander ces pièces
                </button>
              </article>
            ))}
          </section>
        )}
      </main>

      {/* Panier collé en bas */}
      {tab === "commander" && !done && nbPieces > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 bg-white border-t" style={{ borderColor: C.line, boxShadow: "0 -8px 24px -18px rgba(0,0,0,.5)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
          <div className="max-w-[1180px] mx-auto px-4 py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0 leading-tight">
              <p className="text-[16px] font-extrabold">{nbPieces} pièce{nbPieces > 1 ? "s" : ""} · {eurFR(cart?.total_ttc ?? 0)}</p>
              <p className="text-[14px]" style={{ color: C.muted }}>À régler au retrait · pas de TVA</p>
            </div>
            <button type="button" onClick={() => setRecap(true)} className="h-[52px] px-6 text-white text-[16px] font-extrabold" style={{ background: C.orange, clipPath: cut(12) }}>Valider</button>
          </div>
        </div>
      )}

      {/* Récap avant envoi */}
      {recap && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label="Récapitulatif de ta commande" onClick={() => setRecap(false)}>
          <div className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto bg-white" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
            <div className="sticky top-0 bg-white flex justify-between items-center px-4 py-3 border-b" style={{ borderColor: C.line }}>
              <h2 className="text-[18px] font-black italic uppercase" style={{ fontFamily: UNB }}>Ma commande</h2>
              <button type="button" onClick={() => setRecap(false)} className="w-11 h-11 text-[22px] font-bold" aria-label="Fermer">✕</button>
            </div>
            <div className="px-4 py-2 grid">
              {(cart?.lignes ?? []).map((l) => (
                <div key={l.part_id} className="grid grid-cols-[64px_minmax(0,1fr)] gap-3 py-3 border-b items-center" style={{ borderColor: C.line }}>
                  <div className="w-16 h-16 bg-white grid place-items-center" style={{ border: `1px solid ${C.line}` }}>
                    {l.image_url && <img src={optimizedImage(l.image_url, 140)} alt="" className="w-[88%] h-[88%] object-contain" />}
                  </div>
                  <div className="grid gap-1.5 min-w-0">
                    <p className="text-[14px] font-bold leading-tight line-clamp-2">{l.name}</p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[14px] font-extrabold" style={{ color: C.greenD }}>{eurFR(l.prix_pro_ht * l.quantite)}</span>
                      <div className="w-[132px]"><Stepper q={qty[l.part_id] ?? l.quantite} onChange={(n) => setQuantity(l.part_id, n)} /></div>
                    </div>
                  </div>
                </div>
              ))}
              <label htmlFor="pro-note" className="text-[14px] font-bold pt-3">Un mot pour Nolan (facultatif)</label>
              <textarea id="pro-note" value={note} onChange={(e) => setNote(e.target.value.slice(0, 500))} rows={2}
                className="mt-1 p-3 text-[16px] outline-none focus:ring-2 focus:ring-[#4A7C59]" style={{ border: `1.5px solid ${C.line}` }} placeholder="Ex. : je passe vendredi vers 17 h" />
              <div className="grid gap-1 py-4 text-[15px]">
                                <p className="text-[14px]" style={{ color: C.muted }}>TVA non applicable, art. 293 B du CGI</p>
                <div className="flex justify-between text-[17px]"><b>À régler au retrait</b><b>{eurFR(cart?.total_ttc ?? 0)}</b></div>
                <p className="text-[14px] pt-1" style={{ color: C.muted }}>Retrait au magasin à partir du {jourFR(cycle.retrait)}. Espèces, carte ou virement.</p>
              </div>
              <button type="button" disabled={sending || nbPieces === 0} onClick={commander}
                className="h-14 mb-4 text-white text-[17px] font-extrabold disabled:opacity-50" style={{ background: C.orange, clipPath: cut(12) }}>
                {sending ? "Envoi…" : "Confirmer la commande"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div role="status" className="fixed left-4 right-4 bottom-28 z-[60] mx-auto max-w-md px-4 py-3 text-white text-[15px] font-bold text-center" style={{ background: C.ink }}>{toast}</div>
      )}
    </>,
  );
};

export default Pro;
