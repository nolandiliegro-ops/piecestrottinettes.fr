// 29/10/2026 — Accueil de SKOT, tour « tout ce qu'il sait faire » (Nolan : « que dès le début on comprenne qu'il peut
// te trouver ta trottinette, tu peux lui envoyer une photo, tu peux parler de trottinette avec lui… qu'on ait envie de
// jouer avec lui… parler avec lui comme un pote »). ?skotaccueil=1..5 (0 = pastilles actuelles de la Messagerie).
// Commun aux 5 : la bulle de l'en-tête fait défiler ses talents (SkotPanel) et la saisie montre des exemples qui s'écrivent.
import { useEffect, useState } from "react";

const GREEN = "#4A7C59";
const CARBON = "#1A1A1A";
const JAK = "'Plus Jakarta Sans', sans-serif";
const UNB = "'Unbounded', sans-serif";

export const SKOTACCUEIL_DEFAUT = 0;
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
export type Capa = { emoji: string; court: string; titre: string; exemple: string; defi: string; go: () => void };

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

  // 3 · Vitrine (lecture littérale « les signes de tout ce qu'il sait faire ») : une carte par talent, qu'on fait glisser.
  if (v === 3) return (
    <div className="-mx-3 skf-in">
      <p className="px-12 text-[13px] font-bold mb-2 text-[#6B6B6B]" style={{ fontFamily: JAK }}>Ce que je sais faire · fais glisser →</p>
      <div className="flex gap-2.5 overflow-x-auto pl-12 pr-4 pb-2 snap-x snap-mandatory" style={{ scrollbarWidth: "none" }}>
        {capas.map((c) => (
          <button key={c.court} type="button" disabled={busy} onClick={c.go} className="snap-start shrink-0 w-[168px] min-h-[150px] flex flex-col text-left bg-white rounded-[20px] p-3.5 disabled:opacity-50 active:scale-[.97] transition"
            style={{ boxShadow: "0 1px 2px rgba(0,0,0,.06), 0 4px 14px rgba(0,0,0,.06)" }}>
            <span className="text-[30px] leading-none">{c.emoji}</span>
            <span className="mt-2 text-[14.5px] font-extrabold leading-tight" style={{ fontFamily: JAK, color: CARBON }}>{c.titre}</span>
            <span className="mt-1 text-[13px] leading-snug text-[#6B6B6B] flex-1" style={{ fontFamily: JAK }}>« {c.exemple} »</span>
            <span className="mt-2 text-[13px] font-bold" style={{ fontFamily: JAK, color: GREEN }}>Essaie →</span>
          </button>
        ))}
      </div>
    </div>
  );

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
