/* Bloc Garage de l'accueil — pitch « carte Rider » (24/10/2026, demande de Nolan : « le côté carte Rider pour donner
   envie de s'inscrire, expliquer l'utilité : gérer tes commandes… le délire wallpaper gratuit, on s'en fout »).
   Propositions derrière ?rider=1..5 ; sans paramètre : le bloc inchangé.
   Uniquement des fonctions qui existent : garage + trott, filtre des pièces compatibles, suivi des commandes
   (OrderHistorySection), XP et niveaux, carte Rider partageable, code RIDER-XXXXXX (-20 %, max 30 €, 1 commande,
   60 jours après l'ouverture, hors trottinettes complètes et batteries), +50 XP à l'inscription. */
import { Link } from "react-router-dom";
import { ArrowRight, Check, Package, Percent, ScanLine, Trophy, X } from "lucide-react";

const UNB = "'Unbounded', sans-serif";
const FONT = "'Plus Jakarta Sans', sans-serif";
const CARBON = "#1A1A1A";
const GREEN = "#4A7C59";
const SOFT = "#8FBF9C";
const PAPER = "#FAFAF8";
const cut = (px: number) => `polygon(0 0, calc(100% - ${px}px) 0, 100% ${px}px, 100% 100%, 0 100%)`;

export type RiderPitchLook = 1 | 2 | 3 | 4 | 5;
export const riderParam = (): RiderPitchLook | null => {
  if (typeof window === "undefined") return null;
  const n = Number(new URLSearchParams(window.location.search).get("rider"));
  return n >= 1 && n <= 5 ? (n as RiderPitchLook) : null;
};

const BENEFITS: { icon: typeof Package; t: string; d: string }[] = [
  { icon: Percent, t: "-20 % sur ta 1re commande", d: "Ton code RIDER perso, jusqu'à 30 € d'économie." },
  { icon: Package, t: "Tes commandes au même endroit", d: "Suivi de chaque commande, depuis ton garage." },
  { icon: ScanLine, t: "Que les pièces qui vont sur TA trott", d: "Ajoute ta trott, le site trie les pièces compatibles." },
  { icon: Trophy, t: "Ta carte Rider", d: "Ton niveau monte à chaque commande et chaque entretien." },
];
const FINE = "Code valable une fois, 60 jours après l'ouverture, hors trottinettes complètes et batteries.";

const Cta = ({ auth, light = true }: { auth: boolean; light?: boolean }) => (
  <Link to={auth ? "/garage" : "/register"} className="flex items-center justify-between min-h-[56px] px-5 text-[15px] font-extrabold uppercase tracking-wide"
    style={{ fontFamily: FONT, background: light ? "#FFFFFF" : GREEN, color: light ? CARBON : "#FFFFFF", clipPath: cut(10) }}>
    {auth ? "Ouvrir mon garage" : <span>Créer ma carte Rider <span style={{ color: light ? GREEN : "#DDF0E2" }}>· gratuit</span></span>}
    <ArrowRight className="w-5 h-5" />
  </Link>
);

/** La carte Rider, version accueil : à quoi ressemblera TA carte (pseudo et code masqués). */
export const RiderMiniCard = ({ photo, big = false }: { photo?: string | null; big?: boolean }) => (
  <div className="relative overflow-hidden" style={{ background: CARBON, clipPath: cut(big ? 22 : 16), boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.08)` }}>
    <div aria-hidden className="absolute -right-10 -top-10 w-48 h-48 rounded-full" style={{ background: "radial-gradient(circle, rgba(143,191,156,0.35), transparent 70%)" }} />
    <div className={`relative ${big ? "p-5 lg:p-6" : "p-4"}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-extrabold uppercase tracking-[0.18em]" style={{ fontFamily: FONT, color: SOFT }}>Carte Rider</span>
        <img src="/brand/logo-pt-2026-negatif.svg" alt="" className={big ? "h-7" : "h-5"} />
      </div>
      <div className="mt-4 flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <p className={`${big ? "text-[28px] lg:text-[32px]" : "text-[22px]"} uppercase leading-none`} style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: "#FFFFFF" }}>Ton pseudo</p>
          <p className="mt-2 text-sm font-semibold" style={{ fontFamily: FONT, color: "rgba(255,255,255,0.7)" }}>Niveau 1 · ta trott · ta ville</p>
          <div className="mt-3 h-1.5 w-full max-w-[200px]" style={{ background: "rgba(255,255,255,0.12)" }}><div className="h-full w-1/4" style={{ background: SOFT }} /></div>
        </div>
        {photo && <img src={photo} alt="" className={`${big ? "h-28 lg:h-32" : "h-20"} w-auto object-contain shrink-0`} style={{ filter: "drop-shadow(0 10px 10px rgba(0,0,0,0.4))" }} />}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 px-3 py-2.5" style={{ background: "#262626", clipPath: cut(8) }}>
        <span className="text-base font-extrabold tracking-[0.16em]" style={{ fontFamily: FONT, color: "#FFFFFF" }}>RIDER-••••••</span>
        <span className="text-sm font-extrabold uppercase" style={{ fontFamily: FONT, color: SOFT }}>-20 %</span>
      </div>
    </div>
  </div>
);

/** Le panneau qui remplace la liste « 19 wallpapers… » (variantes 1 à 4), ou toute la colonne (variante 5). */
export const RiderPitch = ({ look, auth, photo }: { look: RiderPitchLook; auth: boolean; photo?: string | null }) => {
  // 1 · Repassé : même boîte carbone, même place ; la liste parle carte Rider, commandes, pièces, -20 %.
  if (look === 1) return (
    <div className="p-4 lg:p-5" style={{ background: CARBON, clipPath: cut(14) }}>
      <p className="text-sm font-extrabold uppercase tracking-[0.16em]" style={{ fontFamily: FONT, color: SOFT }}>Avec ta carte Rider</p>
      <ul className="mt-1 flex flex-col">
        {BENEFITS.map(({ t, d }, k) => (
          <li key={t} className="py-2.5" style={{ borderTop: k ? "1px solid rgba(255,255,255,0.1)" : "none" }}>
            <p className="text-[15px] font-extrabold" style={{ fontFamily: FONT, color: "#FFFFFF" }}>{t}</p>
            <p className="text-sm" style={{ fontFamily: FONT, color: "rgba(255,255,255,0.7)" }}>{d}</p>
          </li>
        ))}
      </ul>
      <div className="mt-3"><Cta auth={auth} /></div>
    </div>
  );

  // 2 · La carte d'abord : la carte Rider dessinée, puis 3 raisons en icônes.
  if (look === 2) return (
    <div className="flex flex-col gap-3">
      <RiderMiniCard photo={photo} />
      <div className="p-4 lg:p-5" style={{ background: PAPER, clipPath: cut(14) }}>
        <ul className="grid gap-3">
          {BENEFITS.slice(0, 3).map(({ icon: I, t, d }) => (
            <li key={t} className="flex items-start gap-3">
              <span className="w-10 h-10 shrink-0 flex items-center justify-center" style={{ background: GREEN, color: "#fff", clipPath: cut(7) }}><I className="w-5 h-5" /></span>
              <span><b className="block text-[15px]" style={{ fontFamily: FONT, color: CARBON }}>{t}</b><span className="text-sm text-[#4B5563]" style={{ fontFamily: FONT }}>{d}</span></span>
            </li>
          ))}
        </ul>
        <div className="mt-4"><Cta auth={auth} light={false} /></div>
      </div>
    </div>
  );

  // 3 · En 3 étapes : le vrai parcours, dans l'ordre.
  if (look === 3) {
    const steps = [
      { t: "Crée ta carte Rider", d: "Gratuit, 1 minute. Ton code RIDER-XXXXXX arrive avec." },
      { t: "Ajoute ta trott", d: "Le site ne te montre plus que les pièces qui vont dessus." },
      { t: "Commande à -20 %", d: "Sur ta 1re commande, jusqu'à 30 €. Le suivi est dans ton garage." },
    ];
    return (
      <div className="p-4 lg:p-5" style={{ background: CARBON, clipPath: cut(14) }}>
        <p className="text-sm font-extrabold uppercase tracking-[0.16em]" style={{ fontFamily: FONT, color: SOFT }}>Comment ça marche</p>
        <ol className="mt-3 grid gap-3">
          {steps.map((s, i) => (
            <li key={s.t} className="flex items-start gap-3">
              <span className="text-[28px] leading-none w-9 shrink-0" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: SOFT }}>{i + 1}</span>
              <span><b className="block text-[15px] text-white" style={{ fontFamily: FONT }}>{s.t}</b><span className="text-sm text-white/70" style={{ fontFamily: FONT }}>{s.d}</span></span>
            </li>
          ))}
        </ol>
        <div className="mt-4"><Cta auth={auth} /></div>
        <p className="mt-2 text-sm text-white/55" style={{ fontFamily: FONT }}>{FINE}</p>
      </div>
    );
  }

  // 4 · Sans compte / avec ta carte : ce que l'inscription change, ligne par ligne.
  if (look === 4) {
    const rows: [string, boolean, boolean][] = [
      ["Prix des pièces", true, true],
      ["-20 % sur ta 1re commande", false, true],
      ["Pièces triées pour TA trott", false, true],
      ["Suivi de tes commandes", false, true],
      ["Carte Rider et niveau", false, true],
    ];
    const mark = (ok: boolean) => ok ? <Check className="w-5 h-5 mx-auto" style={{ color: SOFT }} /> : <X className="w-5 h-5 mx-auto text-white/30" />;
    return (
      <div className="p-4 lg:p-5" style={{ background: CARBON, clipPath: cut(14) }}>
        <div className="grid grid-cols-[1fr_72px_72px] items-end gap-y-1 text-sm" style={{ fontFamily: FONT }}>
          <span />
          <span className="text-center font-bold text-white/60 uppercase">Sans compte</span>
          <span className="text-center font-extrabold uppercase" style={{ color: SOFT }}>Carte Rider</span>
          {rows.map(([t, a, b]) => (
            <div key={t} className="contents">
              <span className="py-2.5 text-[15px] font-bold text-white border-t border-white/10">{t}</span>
              <span className="py-2.5 border-t border-white/10">{mark(a)}</span>
              <span className="py-2.5 border-t border-white/10" style={{ background: "rgba(143,191,156,0.08)" }}>{mark(b)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4"><Cta auth={auth} /></div>
      </div>
    );
  }

  // 5 · Carte en grand : la carte Rider prend la colonne, le rider de la semaine passe au second plan.
  return (
    <div className="flex flex-col gap-3">
      <RiderMiniCard photo={photo} big />
      <div className="p-4 lg:p-5" style={{ background: PAPER, clipPath: cut(14) }}>
        <ul className="grid sm:grid-cols-2 gap-x-5 gap-y-3">
          {BENEFITS.map(({ icon: I, t }) => (
            <li key={t} className="flex items-center gap-2.5 text-[15px] font-bold" style={{ fontFamily: FONT, color: CARBON }}>
              <I className="w-5 h-5 shrink-0" style={{ color: GREEN }} />{t}
            </li>
          ))}
        </ul>
        <div className="mt-4"><Cta auth={auth} light={false} /></div>
        <p className="mt-2 text-sm text-[#6B7280]" style={{ fontFamily: FONT }}>{FINE}</p>
      </div>
    </div>
  );
};

export const riderHidesWeek = (look: RiderPitchLook | null) => look === 5;
