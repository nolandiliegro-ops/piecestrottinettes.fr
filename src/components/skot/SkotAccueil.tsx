// 29/10/2026 — Accueil de SKOT, tour « tout ce qu'il sait faire » (Nolan : « que dès le début on comprenne qu'il peut
// te trouver ta trottinette, tu peux lui envoyer une photo, tu peux parler de trottinette avec lui… qu'on ait envie de
// jouer avec lui… parler avec lui comme un pote »). ?skotaccueil=1..5 (0 = pastilles actuelles de la Messagerie).
// Commun aux 5 : la bulle de l'en-tête fait défiler ses talents (SkotPanel) et la saisie montre des exemples qui s'écrivent.
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const GREEN = "#4A7C59";
const CARBON = "#1A1A1A";
const JAK = "'Plus Jakarta Sans', sans-serif";
const UNB = "'Unbounded', sans-serif";

export const SKOTACCUEIL_DEFAUT = 3; // 29/10 : « Vitrine » retenue par Nolan ; ?skotaccueil=0 = anciennes pastilles.
export const readSkotAccueil = (): number => {
  if (typeof window === "undefined") return SKOTACCUEIL_DEFAUT;
  try {
    const q = new URLSearchParams(window.location.search).get("skotaccueil");
    if (q !== null && /^[0-5]$/.test(q)) { window.sessionStorage.setItem("pt-skotaccueil", q); return Number(q); }
    const s = window.sessionStorage.getItem("pt-skotaccueil");
    return s && /^[0-5]$/.test(s) ? Number(s) : SKOTACCUEIL_DEFAUT;
  } catch { return SKOTACCUEIL_DEFAUT; }
};

/** Un talent de SKOT : ce qu'il sait faire, une phrase d'exemple, et le geste qui le lance pour de vrai. */
export type Capa = { emoji: string; court: string; titre: string; exemple: string; defi: string; go: () => void; pose?: string };

/** Exemples qui s'écrivent dans la saisie (commun aux 5). */
export const PLACEHOLDERS = [
  "Il me faut des pneus pour ma G30…",
  "Tu reconnais ma trott en photo ?",
  "Quelle trott pour 15 km par jour ?",
  "Il pleut, je roule ou pas ?",
  "L'autonomie d'une Xiaomi Pro 2 ?",
  "T'as une trott préférée ?",
];
export const useTypedPlaceholder = (on: boolean, fallback: string) => {
  const [txt, setTxt] = useState(fallback);
  useEffect(() => {
    if (!on) { setTxt(fallback); return; }
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { setTxt(PLACEHOLDERS[0]); return; }
    let i = 0, k = 0, back = false;
    const t = setInterval(() => {
      const full = PLACEHOLDERS[i];
      if (!back) { k += 1; if (k >= full.length + 18) back = true; } // ~1,5 s de pause une fois écrit
      else { k -= 3; if (k <= 0) { back = false; k = 0; i = (i + 1) % PLACEHOLDERS.length; } }
      setTxt(full.slice(0, Math.min(k, full.length)) || " ");
    }, 70);
    return () => clearInterval(t);
  }, [on, fallback]);
  return txt;
};

const Pastille = ({ c, busy }: { c: Capa; busy: boolean }) => (
  <button type="button" disabled={busy} onClick={c.go} className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-full bg-white text-[14px] font-bold disabled:opacity-50 active:scale-95 transition"
    style={{ fontFamily: JAK, color: CARBON, border: `1.5px solid ${GREEN}` }}>
    <span className="text-[16px] leading-none">{c.emoji}</span>{c.court}
  </button>
);

/* Petite bulle de SKOT (même peau que la Messagerie). */
const Bulle = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <div className="bg-white px-3.5 py-2.5 text-[15px] leading-relaxed rounded-[18px] rounded-bl-[6px] skf-in" style={{ fontFamily: JAK, color: CARBON, boxShadow: "0 1px 2px rgba(0,0,0,.08), 0 2px 10px rgba(0,0,0,.05)", animationDelay: `${delay}s` }}>
    {children}
  </div>
);

export const SkotAccueil = ({ v, capas, busy }: { v: number; capas: Capa[]; busy: boolean }) => {
  // 1 · Menu complet : les mêmes pastilles qu'aujourd'hui, mais TOUS ses talents, avec un emoji chacun.
  if (v === 1) return (
    <div className="pl-9 skf-in">
      <p className="text-[13px] font-bold mb-2 text-[#6B6B6B]" style={{ fontFamily: JAK }}>Je sais faire tout ça 👇</p>
      <div className="flex flex-wrap gap-2">{capas.map((c) => <Pastille key={c.court} c={c} busy={busy} />)}</div>
    </div>
  );

  // 2 · Il se présente : SKOT écrit 3 messages à la suite, comme un pote qui t'explique ; chaque talent se touche.
  if (v === 2) {
    const groupes = [
      { intro: "Montre-moi ta trott 📸", items: capas.slice(0, 2) },
      { intro: "Tu cherches une trott ? 🛴", items: capas.slice(2, 4) },
      { intro: "Et aussi, entre potes 💬", items: capas.slice(4) },
    ];
    return (
      <div className="pl-9 space-y-1.5">
        {groupes.map((g, k) => (
          <div key={k} className="max-w-[92%]">
            <Bulle delay={0.5 + k * 0.9}>
              <span className="block font-extrabold mb-1">{g.intro}</span>
              {g.items.map((c) => (
                <button key={c.court} type="button" disabled={busy} onClick={c.go} className="flex items-center gap-2 w-full min-h-[40px] text-left text-[14.5px] disabled:opacity-50 group">
                  <span className="text-[17px] leading-none">{c.emoji}</span>
                  <span className="flex-1 min-w-0">{c.titre}</span>
                  <span className="text-[13px] font-bold shrink-0 group-active:scale-95" style={{ color: GREEN }}>Essaie ›</span>
                </button>
              ))}
            </Bulle>
          </div>
        ))}
      </div>
    );
  }

  // 3 · Vitrine (retenue le 29/10) : une carte par talent, SKOT en vrai dans chaque carte, peu de texte, on fait glisser.
  if (v === 3) return <Vitrine capas={capas} busy={busy} />;

  // 4 · Questions de potes : des phrases toutes prêtes, côté client (à droite), qu'il suffit de toucher pour les envoyer.
  if (v === 4) return (
    <div className="space-y-2 pt-1">
      <p className="text-center text-[13px] font-bold text-[#6B6B6B] skf-in" style={{ fontFamily: JAK }}>Touche une phrase pour lui parler</p>
      {capas.map((c, k) => (
        <div key={c.court} className="flex justify-end">
          <button type="button" disabled={busy} onClick={c.go} className="max-w-[84%] text-left text-[15px] leading-snug px-3.5 py-2.5 rounded-[18px] rounded-br-[6px] bg-white disabled:opacity-50 active:scale-[.97] transition skf-in"
            style={{ fontFamily: JAK, color: CARBON, border: `1.5px dashed ${GREEN}`, animationDelay: `${0.3 + k * 0.12}s` }}>
            {c.exemple} <span className="text-[16px]">{c.emoji}</span>
          </button>
        </div>
      ))}
    </div>
  );

  // 5 · Teste-moi : ses talents présentés comme des défis à lui lancer (jeu), en grandes cartes vertes.
  return (
    <div className="pl-9 skf-in">
      <p className="italic uppercase mb-2" style={{ fontFamily: UNB, fontWeight: 900, fontSize: 15, color: CARBON }}>Teste-moi !</p>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2">
        {capas.map((c, k) => (
          <button key={c.court} type="button" disabled={busy} onClick={c.go}
            className={`text-left rounded-[18px] p-3 min-h-[92px] flex flex-col disabled:opacity-50 active:scale-[.96] transition ${k === 0 ? "col-span-2 text-white" : "bg-white"}`}
            style={k === 0 ? { background: GREEN, fontFamily: JAK } : { fontFamily: JAK, boxShadow: "0 1px 2px rgba(0,0,0,.06), 0 3px 10px rgba(0,0,0,.05)" }}>
            <span className={k === 0 ? "text-[28px] leading-none" : "text-[22px] leading-none"}>{c.emoji}</span>
            <span className={`mt-1.5 font-extrabold leading-tight ${k === 0 ? "text-[16px]" : "text-[14px]"}`} style={k === 0 ? undefined : { color: CARBON }}>{c.defi}</span>
            <span className={`mt-auto pt-1.5 text-[12.5px] font-bold ${k === 0 ? "text-white/85" : ""}`} style={k === 0 ? undefined : { color: GREEN }}>Défi lancé ›</span>
          </button>
        ))}
      </div>
    </div>
  );
};

/* Vitrine retenue (29/10) : SKOT dans la bonne pose sur chaque carte, un titre court, « Essaie ». La rangée fait un
   petit aller-retour à l'ouverture pour montrer qu'elle glisse ; flèches sur ordinateur (pas de glisser à la souris). */
const TEINTES = ["#E7F0EA", "#F3ECDF"];
const Vitrine = ({ capas, busy }: { capas: Capa[]; busy: boolean }) => {
  const row = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = row.current;
    if (!el || (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)) return;
    const a = setTimeout(() => el.scrollTo({ left: 90, behavior: "smooth" }), 1300);
    const b = setTimeout(() => el.scrollTo({ left: 0, behavior: "smooth" }), 2100);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, []);
  const slide = (d: number) => row.current?.scrollBy({ left: d * 300, behavior: "smooth" });
  return (
    <div className="-mx-3 skf-in">
      <div className="flex items-center gap-2 pl-12 pr-4 mb-2">
        <p className="flex-1 italic uppercase leading-none" style={{ fontFamily: UNB, fontWeight: 900, fontSize: 14, color: CARBON }}>
          Mes talents <span className="not-italic text-[13px] font-bold normal-case" style={{ fontFamily: JAK, color: GREEN }}>· {capas.length} · fais glisser</span>
        </p>
        <button type="button" onClick={() => slide(-1)} aria-label="Talents précédents" className="hidden md:grid w-9 h-9 rounded-full bg-white place-items-center" style={{ boxShadow: "0 1px 3px rgba(0,0,0,.1)" }}><ChevronLeft className="w-4 h-4" /></button>
        <button type="button" onClick={() => slide(1)} aria-label="Talents suivants" className="hidden md:grid w-9 h-9 rounded-full bg-white place-items-center" style={{ boxShadow: "0 1px 3px rgba(0,0,0,.1)" }}><ChevronRight className="w-4 h-4" /></button>
      </div>
      <div ref={row} className="flex gap-2.5 overflow-x-auto pl-12 pr-6 pb-3 snap-x snap-mandatory scroll-pl-12" style={{ scrollbarWidth: "none" }}>
        {capas.map((c, k) => (
          <button key={c.court} type="button" disabled={busy} onClick={c.go}
            className="snap-start shrink-0 w-[156px] flex flex-col text-left bg-white rounded-[22px] overflow-hidden disabled:opacity-50 active:scale-[.96] transition"
            style={{ boxShadow: "0 1px 2px rgba(0,0,0,.06), 0 6px 16px rgba(0,0,0,.07)" }}>
            <span className="relative block h-[118px] overflow-hidden" style={{ background: TEINTES[k % 2] }}>
              {/* Zoom sur la tête et le guidon : c'est là que la pose se lit (appareil photo, loupe, clé, colis…). */}
              {c.pose && <img src={c.pose} alt="" loading="eager" draggable={false} className="absolute left-1/2 -translate-x-[42%] -top-1 h-[200px] max-w-none w-auto select-none" style={{ filter: "drop-shadow(0 6px 6px rgba(0,0,0,.15))" }} />}
              <span className="absolute top-2 left-2 w-8 h-8 rounded-full bg-white grid place-items-center text-[17px] leading-none" style={{ boxShadow: "0 1px 3px rgba(0,0,0,.12)" }}>{c.emoji}</span>
            </span>
            <span className="flex-1 px-3 pt-2.5 text-[14.5px] font-extrabold leading-tight" style={{ fontFamily: JAK, color: CARBON }}>{c.titre}</span>
            <span className="mx-3 mt-2.5 mb-3 self-start inline-flex items-center h-8 px-3 rounded-full text-[13px] font-bold text-white" style={{ fontFamily: JAK, background: GREEN }}>Essaie</span>
          </button>
        ))}
      </div>
    </div>
  );
};
