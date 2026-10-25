// 25/10/2026 — Fenêtre de SKOT aux couleurs de la nouvelle mascotte (Nolan : « que la fenêtre reste dans la même DA que lui…
// entre le site moderne et sa DA à lui… une belle communication entre lui et les gens »).
// 5 propositions : ?skotfen=1..5 ; sans paramètre ou ?skotfen=0 = fenêtre actuelle (rendue par SkotWidget).
// Commun aux 5 : la mascotte remplace l'avatar « Le pilote », et son visage suit la conversation
// (clin d'œil à l'ouverture, écoute, réfléchit pendant la recherche, content quand la réponse arrive).
import { useEffect, useRef, useState, type FormEvent, type ReactNode, type RefObject } from "react";
import { Link } from "react-router-dom";
import { X, Send, Camera, Loader2, ThumbsUp, ThumbsDown, Search, Package, Wrench, Bike, CircleDot, LayoutGrid } from "lucide-react";
import { skotSaison, SAISON_TEXTE, type SkotSaison } from "@/lib/skotSaison";
import type { SkotCard } from "@/lib/skot";

export type SkotFenVariant = 1 | 2 | 3 | 4 | 5;
export const readSkotFenVariant = (): SkotFenVariant | null => {
  try {
    // 25/10 : Nolan choisit la 3 « Il te parle » = défaut ; ?skotfen=0 = ancienne fenêtre, 1..5 = les autres propositions.
    const raw = new URLSearchParams(window.location.search).get("skotfen");
    if (raw === null) return 3;
    const n = Number(raw);
    return n >= 1 && n <= 5 ? (n as SkotFenVariant) : n === 0 ? null : 3;
  } catch {
    return 3;
  }
};

export type PanelMsg = { role: "user" | "skot"; text: string; cards?: SkotCard[]; image?: string; id?: string | null; conv?: string; fb?: 1 | -1 };
type Mood = "ecoute" | "clin" | "reflechit" | "content";

export const SKOT_GREETING_V2 =
  "Salut ! Moi c'est SKOT, la patinette de l'atelier. Pas de moteur, pas de batterie… mais je connais toutes les trottinettes électriques par cœur. Dis-moi ta trott et ce qu'il te faut : je vérifie dans le catalogue ce qui monte vraiment. Une photo du flanc de ton pneu ou de ta prise de charge, ça marche aussi.";

const GREEN = "#4A7C59";
const GREEN_D = "#3A6449";
const BEIGE = "#F5F0E8";
const CREAM = "#FAFAF8";
const CARBON = "#1A1A1A";
const UNB = "'Unbounded', sans-serif";
const JAK = "'Plus Jakarta Sans', sans-serif";
const CHROME = "linear-gradient(145deg,#ffffff 0%,#d4d7d3 38%,#8f948e 52%,#e9ebe8 70%,#b9bdb8 100%)";
const cutTR = (n: number) => `polygon(0 0, calc(100% - ${n}px) 0, 100% ${n}px, 100% 100%, 0 100%)`;
const cut2 = (n: number) => `polygon(0 0, calc(100% - ${n}px) 0, 100% ${n}px, 100% 100%, ${n}px 100%, 0 calc(100% - ${n}px))`;

const head = (m: Mood) => `/skot/tete-${m}.webp`;
const body = (m: Mood) => `/skot/skot-${m}.webp`;

const CSS = `
@keyframes skf-dot{0%,80%,100%{opacity:.25;transform:translateY(0)}40%{opacity:1;transform:translateY(-3px)}}
@keyframes skf-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes skf-pulse{0%{box-shadow:0 0 0 0 rgba(74,124,89,.55)}100%{box-shadow:0 0 0 8px rgba(74,124,89,0)}}
@keyframes skf-bar{from{transform:translateX(-100%)}to{transform:translateX(250%)}}
@keyframes skf-bob{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-3px) rotate(-1.2deg)}}
.skf-dot{display:inline-block;width:6px;height:6px;border-radius:9999px;background:currentColor;animation:skf-dot 1.1s infinite}
.skf-dot:nth-child(2){animation-delay:.15s}.skf-dot:nth-child(3){animation-delay:.3s}
.skf-in{animation:skf-in .35s ease-out both}
.skf-pulse{animation:skf-pulse 1.6s infinite}
.skf-bar{animation:skf-bar 1.1s ease-in-out infinite}
.skf-bob{animation:skf-bob 3.4s ease-in-out infinite}
@keyframes skf-pose{0%{opacity:0;transform:translateY(10px) scale(.9)}60%{opacity:1;transform:translateY(-4px) scale(1.04)}100%{transform:none}}
@keyframes skf-jump{0%,100%{transform:translateY(0)}30%{transform:translateY(-22px) rotate(-4deg)}55%{transform:translateY(0) rotate(2deg)}70%{transform:translateY(-8px)}}
@keyframes skf-shake{0%,100%{transform:rotate(0)}20%{transform:rotate(-5deg)}40%{transform:rotate(4deg)}60%{transform:rotate(-3deg)}80%{transform:rotate(2deg)}}
@keyframes skf-breathe{0%,100%{transform:scale(1) translateY(0)}50%{transform:scale(1.02,.985) translateY(2px)}}
@keyframes skf-scan{0%,100%{transform:rotate(-3deg) translateX(-3px)}50%{transform:rotate(3deg) translateX(3px)}}
@keyframes skf-roll{0%{transform:translateX(-30px)}100%{transform:translateX(0)}}
.skf-pose{animation:skf-pose .45s cubic-bezier(.2,.9,.3,1.25) both}
.skf-a-jump{transform-origin:50% 100%;animation:skf-jump 1.1s ease-in-out 2}
.skf-a-shake{transform-origin:50% 100%;animation:skf-shake .7s ease-in-out 3}
.skf-a-breathe{transform-origin:50% 100%;animation:skf-breathe 3.6s ease-in-out infinite}
.skf-a-scan{transform-origin:50% 100%;animation:skf-scan 1.6s ease-in-out infinite}
.skf-a-roll{animation:skf-roll .6s cubic-bezier(.2,.9,.3,1.2) both}
.skf-a-bob{transform-origin:50% 100%;animation:skf-bob 3.4s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.skf-dot,.skf-in,.skf-pulse,.skf-bar,.skf-bob,.skf-pose,.skf-a-jump,.skf-a-shake,.skf-a-breathe,.skf-a-scan,.skf-a-roll,.skf-a-bob{animation:none!important}}`;
let cssInjected = false;

/* Le visage suit la conversation : clin d'œil à l'ouverture, réfléchit pendant la recherche, content 3,5 s après une réponse. */
const useMood = (busy: boolean, count: number): Mood => {
  const [mood, setMood] = useState<Mood>("clin");
  const prev = useRef(count);
  useEffect(() => { const t = setTimeout(() => setMood((m) => (m === "clin" ? "ecoute" : m)), 1400); return () => clearTimeout(t); }, []);
  useEffect(() => {
    if (busy) { setMood("reflechit"); return; }
    if (count > prev.current) {
      prev.current = count;
      setMood("content");
      const t = setTimeout(() => setMood("ecoute"), 3500);
      return () => clearTimeout(t);
    }
    setMood((m) => (m === "reflechit" ? "ecoute" : m));
  }, [busy, count]);
  return mood;
};

const STATUS: Record<Mood, [string, string]> = {
  clin: ["Salut !", "Pose ta question, je vérifie tout dans le catalogue."],
  ecoute: ["Je t'écoute.", "Ta trott, ta pièce, ta commande : vas-y."],
  reflechit: ["Je fouille l'atelier…", "Je croise les tailles et les compatibilités."],
  content: ["Voilà !", "Dis-moi si tu veux que je creuse."],
};

export interface SkotPanelProps {
  variant: SkotFenVariant;
  msgs: PanelMsg[];
  busy: boolean;
  input: string;
  setInput: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
  send: (t: string) => void;
  onClose: () => void;
  onSearch: () => void;
  pickPhoto: () => void;
  photo: { preview: string } | null;
  clearPhoto: () => void;
  rate: (i: number, v: 1 | -1) => void;
  listRef: RefObject<HTMLDivElement>;
  renderCard: (c: SkotCard) => ReactNode;
}

/* Tête de la mascotte dans un phare chromé (ou un rond simple). */
const Head = ({ mood, size, chrome = false, bg = BEIGE }: { mood: Mood; size: number; chrome?: boolean; bg?: string }) => (
  <span className="block rounded-full shrink-0" style={{ width: size, height: size, padding: chrome ? 3 : 0, background: chrome ? CHROME : "transparent" }}>
    <span className="block w-full h-full rounded-full overflow-hidden" style={{ background: bg, border: chrome ? "none" : `1.5px solid ${CARBON}14` }}>
      <img src={head(mood)} alt="" draggable={false} className="w-full h-full object-cover select-none" style={{ transform: "scale(1.12) translateY(5%)" }} />
    </span>
  </span>
);
const Body = ({ mood, size, flip = false, className = "" }: { mood: Mood; size: number; flip?: boolean; className?: string }) => (
  <img src={body(mood)} alt="" draggable={false} width={size} height={size} className={`block select-none pointer-events-none ${className}`}
    style={{ width: size, height: size, transform: flip ? "scaleX(-1)" : undefined, filter: "drop-shadow(0 10px 12px rgba(0,0,0,.18))" }} />
);

const Dots = ({ label = "Je fouille l'atelier…" }: { label?: string }) => (
  <span className="inline-flex items-center gap-2 text-[14px]" style={{ fontFamily: JAK, color: "#555" }}>
    <span className="inline-flex gap-1" style={{ color: GREEN }}><i className="skf-dot" /><i className="skf-dot" /><i className="skf-dot" /></span>
    {label}
  </span>
);

const Rating = ({ m, i, rate }: { m: PanelMsg; i: number; rate: SkotPanelProps["rate"] }) =>
  m.id ? (
    <div className="flex items-center gap-1 text-gray-500">
      <button type="button" onClick={() => rate(i, 1)} disabled={!!m.fb} aria-label="Réponse utile" aria-pressed={m.fb === 1}
        className={`w-11 h-11 grid place-items-center ${m.fb === 1 ? "text-[#4A7C59]" : "hover:text-[#1A1A1A]"} disabled:cursor-default`}><ThumbsUp className="w-4 h-4" /></button>
      <button type="button" onClick={() => rate(i, -1)} disabled={!!m.fb} aria-label="Réponse pas utile" aria-pressed={m.fb === -1}
        className={`w-11 h-11 grid place-items-center ${m.fb === -1 ? "text-[#DC2626]" : "hover:text-[#1A1A1A]"} disabled:cursor-default`}><ThumbsDown className="w-4 h-4" /></button>
      {m.fb && <span className="text-sm">{m.fb === 1 ? "Merci !" : "Noté, on corrige."}</span>}
    </div>
  ) : null;

const CHIPS: { label: string; send?: string; photo?: true; icon: typeof Package }[] = [
  { label: "Ma commande", send: "Où en est ma commande ?", icon: Package },
  { label: "L'atelier", send: "Je veux poser une question à l'atelier", icon: Wrench },
  { label: "Photo", photo: true, icon: Camera },
];

const PhotoRow = ({ p }: { p: SkotPanelProps }) =>
  p.photo ? (
    <div className="px-3 pt-2 flex items-center gap-2 text-sm text-gray-700">
      <img src={p.photo.preview} alt="Photo à envoyer" className="w-12 h-12 object-cover" />
      Photo prête à partir
      <button type="button" onClick={p.clearPhoto} className="ml-auto underline min-h-[44px]">Retirer</button>
    </div>
  ) : null;

/* Barre de recherche à angle coupé (contour carbone par deux clip-path imbriqués). */
const SearchBar = ({ onSearch, className = "", round = false }: { onSearch: () => void; className?: string; round?: boolean }) =>
  round ? (
    <button type="button" onClick={onSearch} className={`flex items-center gap-2.5 min-h-[46px] px-4 bg-white rounded-full shadow-[0_1px_0_rgba(0,0,0,.06),0_4px_14px_rgba(0,0,0,.06)] text-left ${className}`}>
      <Search className="w-5 h-5 shrink-0" style={{ color: GREEN }} strokeWidth={2.6} />
      <span className="flex-1 min-w-0 truncate text-[15px] text-[#6B6B6B]" style={{ fontFamily: JAK }}>Chercher une pièce…</span>
    </button>
  ) : (
    <button type="button" onClick={onSearch} className={`p-[2px] text-left ${className}`} style={{ background: CARBON, clipPath: cutTR(12) }}>
      <span className="flex items-center gap-2.5 min-h-[44px] px-3 bg-white" style={{ clipPath: cutTR(11) }}>
        <Search className="w-5 h-5 shrink-0" style={{ color: GREEN }} strokeWidth={2.6} />
        <span className="flex-1 min-w-0 truncate text-[15px] text-[#6B6B6B]" style={{ fontFamily: JAK }}>Chercher une pièce…</span>
        <span className="text-xs font-extrabold uppercase italic" style={{ color: GREEN }}>Recherche</span>
      </span>
    </button>
  );

const Composer = ({ p, round = false }: { p: SkotPanelProps; round?: boolean }) => (
  <form onSubmit={p.onSubmit} className="flex items-center gap-2 p-3">
    <button type="button" onClick={p.pickPhoto} aria-label="Envoyer une photo"
      className={`w-11 h-11 grid place-items-center bg-white text-[#1A1A1A] shrink-0 ${round ? "rounded-full shadow-[0_2px_10px_rgba(0,0,0,.08)]" : "border-[1.5px] border-[#1A1A1A]"}`}>
      <Camera className="w-5 h-5" />
    </button>
    <label htmlFor="skot-input" className="sr-only">Ta question</label>
    <input id="skot-input" value={p.input} onChange={(e) => p.setInput(e.target.value)} maxLength={1500} placeholder="Écris ta question…"
      className={`flex-1 min-w-0 min-h-[44px] px-4 text-base bg-white focus:outline-none focus:ring-2 focus:ring-[#4A7C59] ${round ? "rounded-full shadow-[0_2px_10px_rgba(0,0,0,.08)]" : "border-[1.5px] border-[#1A1A1A]"}`}
      style={{ fontFamily: JAK }} />
    <button type="submit" disabled={p.busy || (!p.input.trim() && !p.photo)} aria-label="Envoyer"
      className={`w-11 h-11 grid place-items-center text-white disabled:opacity-50 shrink-0 ${round ? "rounded-full" : ""}`}
      style={{ background: GREEN, clipPath: round ? undefined : cutTR(8) }}>
      {p.busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
    </button>
  </form>
);

const Chips = ({ p, round = false, className = "" }: { p: SkotPanelProps; round?: boolean; className?: string }) => (
  <div className={`px-3 pt-2 flex gap-2 overflow-x-auto ${className}`} style={{ scrollbarWidth: "none" }}>
    {CHIPS.map((c) => (
      <button key={c.label} type="button" disabled={p.busy} onClick={() => (c.photo ? p.pickPhoto() : p.send(c.send!))}
        className={`shrink-0 inline-flex items-center gap-1.5 min-h-[44px] px-3 text-[14px] font-semibold disabled:opacity-50 ${round ? "rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,.07)]" : "border-[1.5px] border-[#1A1A1A] bg-white"}`}
        style={{ fontFamily: JAK, color: CARBON, clipPath: round ? undefined : cutTR(8) }}>
        <c.icon className="w-4 h-4" style={{ color: GREEN }} /> {c.label}
      </button>
    ))}
  </div>
);

/* Bulle carbone/blanche à angle coupé, avec petite queue vers la gauche. */
const Bubble = ({ children, tone = "white" }: { children: ReactNode; tone?: "white" | "carbon" | "green" }) => {
  const bg = tone === "white" ? "#fff" : tone === "green" ? GREEN : CARBON;
  const fg = tone === "white" ? CARBON : "#fff";
  return (
    <span className="block p-[1.5px]" style={{ background: CARBON, clipPath: cutTR(10) }}>
      <span className="block px-3.5 py-2.5 text-[14.5px] leading-relaxed whitespace-pre-wrap" style={{ background: bg, color: fg, fontFamily: JAK, clipPath: cutTR(9.5) }}>{children}</span>
    </span>
  );
};

const UserMsg = ({ m, tone = "carbon", round = false }: { m: PanelMsg; tone?: "carbon" | "green"; round?: boolean }) => (
  <div className="flex justify-end skf-in">
    <div className={`max-w-[85%] text-white text-[14.5px] leading-relaxed px-3.5 py-2.5 whitespace-pre-wrap ${round ? "rounded-[18px] rounded-br-md" : ""}`}
      style={{ background: tone === "green" ? GREEN : CARBON, fontFamily: JAK, clipPath: round ? undefined : cutTR(9) }}>
      {m.image && <img src={m.image} alt="Photo envoyée" className="max-h-40 mb-2" />}
      {m.text}
    </div>
  </div>
);

const Shell = ({ children, width = 400, bg = CREAM }: { children: ReactNode; width?: number; bg?: string }) => (
  <div role="dialog" aria-label="SKOT, l'assistant de l'atelier"
    className="fixed z-[60] inset-0 md:inset-auto md:right-0 md:top-16 md:bottom-0 md:w-[var(--skw)] flex flex-col md:shadow-[-14px_0_36px_rgba(0,0,0,0.16)]"
    style={{ background: bg, paddingBottom: "env(safe-area-inset-bottom)", ["--skw" as string]: `${width}px` }}>
    {children}
  </div>
);

const CloseBtn = ({ onClose, light = false }: { onClose: () => void; light?: boolean }) => (
  <button type="button" onClick={onClose} aria-label="Fermer" className={`w-11 h-11 grid place-items-center shrink-0 ${light ? "text-white/80 hover:text-white" : "text-[#1A1A1A]/70 hover:text-[#1A1A1A]"}`}>
    <X className="w-6 h-6" />
  </button>
);

/* ───────────── 3 · « Il te parle » — la scène animée (retenue par Nolan le 25/10/2026) ─────────────
   SKOT en entier en haut ; sa pose et sa phrase suivent la conversation :
   salut à l'ouverture · écoute · photo quand une photo est jointe · loupe/réfléchit pendant la recherche
   (colis pour une commande, clé pour l'atelier) · trouvé quand une pièce sort · oups si rien · rire au 👍 ou quand on le touche ·
   il s'endort après 60 s sans rien, sursaute quand on revient. Tenue de saison (lib/skotSaison) au repos. */
type Pose = Mood | "salut" | "loupe" | "trouve" | "oups" | "rire" | "dort" | "photo" | "cle" | "colis" | "surpris" | "roule" | SkotSaison;
type Anim = "bob" | "jump" | "shake" | "breathe" | "scan" | "roll";
type Scene = { pose: Pose; title: string; sub: string; anim: Anim };

const BASE: Pose[] = ["ecoute", "clin", "reflechit", "content"];
const poseSrc = (p: Pose) => (BASE.includes(p) ? `/skot/skot-${p}.webp` : `/skot/p-${p}.webp`);
const ALL_POSES: Pose[] = ["ecoute", "clin", "reflechit", "content", "salut", "loupe", "trouve", "oups", "rire", "dort", "photo", "cle", "colis", "surpris"];
const SEARCHING = ["Je fouille l'atelier…", "Je mesure la jante…", "Je croise les compatibilités…", "Je vérifie le stock…"];
// 25/10 : test réel « Zorglub X9000 » → « Je ne trouve ni… » n'était pas reconnu (SKOT disait « Voilà ! »).
const NOT_FOUND = /(pas trouv|ne trouve|aucun|introuvable|désolé|crevaison|je n['’]ai pas|je ne peux (donc )?pas|pas (encore )?(dans|en) (le )?catalogue)/i;
const IDLE_SLEEP_MS = 60_000;

const ScenePanel = (p: SkotPanelProps) => {
  const [saison] = useState(() => skotSaison());
  const rest: Pose = saison ?? "ecoute";
  const idle = (): Scene => ({ pose: rest, title: "Je t'écoute.", sub: saison ? SAISON_TEXTE[saison][1] : "Ta trott, ta pièce, ta commande : vas-y.", anim: saison ? "bob" : "breathe" });
  const [scene, setScene] = useState<Scene>(() =>
    saison ? { pose: saison, title: SAISON_TEXTE[saison][0], sub: SAISON_TEXTE[saison][1], anim: "jump" } : { pose: "salut", title: "Salut !", sub: "Pose ta question, je vérifie tout dans le catalogue.", anim: "jump" },
  );
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const lastActivity = useRef(Date.now());
  const play = (steps: { s: Scene; ms?: number }[]) => {
    clearTimeout(timer.current);
    const run = (i: number) => {
      setScene(steps[i].s);
      if (i + 1 < steps.length) timer.current = setTimeout(() => run(i + 1), steps[i].ms ?? 2500);
    };
    run(0);
  };
  const toIdle = (ms: number) => { clearTimeout(timer.current); timer.current = setTimeout(() => setScene(idle()), ms); };
  const poke = () => { lastActivity.current = Date.now(); };

  // Toutes les poses chargées d'avance : pas de trou blanc au changement.
  useEffect(() => { [...ALL_POSES, ...(saison ? [saison] : [])].forEach((x) => { new Image().src = poseSrc(x); }); toIdle(2400); return () => clearTimeout(timer.current); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Il s'endort sans activité, sursaute quand on revient.
  useEffect(() => {
    const t = setInterval(() => {
      if (!p.busy && Date.now() - lastActivity.current > IDLE_SLEEP_MS) setScene((s) => (s.pose === "dort" ? s : { pose: "dort", title: "Zzz…", sub: "Écris-moi, je me réveille.", anim: "breathe" }));
    }, 5000);
    return () => clearInterval(t);
  }, [p.busy]);
  const wake = () => {
    poke();
    if (scene.pose === "dort") play([{ s: { pose: "surpris", title: "Ah ! Je suis là.", sub: "Je t'écoute, vas-y.", anim: "jump" }, ms: 1300 }, { s: idle() }]);
  };

  // Ce qu'il fait pendant que tu écris / joins une photo.
  useEffect(() => {
    if (p.busy) return;
    if (p.photo) { poke(); play([{ s: { pose: "photo", title: "Joli cliché !", sub: "Envoie, je regarde le flanc et les marquages.", anim: "shake" } }]); }
  }, [p.photo]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (p.input) wake(); }, [p.input]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pendant la recherche : la pose dépend de la question.
  const lastUser = [...p.msgs].reverse().find((m) => m.role === "user");
  useEffect(() => {
    if (!p.busy) return;
    poke();
    clearTimeout(timer.current);
    if (lastUser?.text.startsWith("Où en est ma commande")) { setScene({ pose: "colis", title: "Je retrouve ta commande…", sub: "Numéro, statut, livraison : je regarde.", anim: "roll" }); return; }
    if (lastUser?.text.includes("question à l'atelier")) { setScene({ pose: "cle", title: "Je préviens l'atelier…", sub: "Un vrai mécano va te répondre.", anim: "bob" }); return; }
    let i = 0;
    const tick = () => {
      const pose: Pose = lastUser?.image && i === 0 ? "photo" : i % 2 === 0 ? "loupe" : "reflechit";
      setScene({ pose, title: SEARCHING[i % SEARCHING.length], sub: "Je ne te montre que ce qui monte vraiment.", anim: pose === "loupe" ? "scan" : "bob" });
      i += 1;
      timer.current = setTimeout(tick, 1700);
    };
    tick();
    return () => clearTimeout(timer.current);
  }, [p.busy]); // eslint-disable-line react-hooks/exhaustive-deps

  // La réponse arrive : trouvé, oups ou content.
  const skotCount = p.msgs.filter((m) => m.role === "skot").length;
  const prevCount = useRef(skotCount);
  useEffect(() => {
    if (skotCount <= prevCount.current) return;
    prevCount.current = skotCount;
    const last = p.msgs[p.msgs.length - 1];
    const n = last?.cards?.length ?? 0;
    if (n > 0) play([{ s: { pose: "trouve", title: "Trouvé !", sub: n > 1 ? `${n} pièces qui montent sur ta trott.` : "Une pièce qui monte sur ta trott.", anim: "jump" }, ms: 2600 }, { s: { pose: "content", title: "Voilà !", sub: "Dis-moi si tu veux que je creuse.", anim: "bob" }, ms: 3500 }, { s: idle() }]);
    else if (NOT_FOUND.test(last?.text ?? "")) play([{ s: { pose: "oups", title: "Oups…", sub: "Pas trouvé cette fois. L'atelier peut chercher pour toi.", anim: "shake" }, ms: 4500 }, { s: idle() }]);
    else play([{ s: { pose: "content", title: "Voilà !", sub: "Dis-moi si tu veux que je creuse.", anim: "bob" }, ms: 3500 }, { s: idle() }]);
  }, [skotCount]); // eslint-disable-line react-hooks/exhaustive-deps

  const rate = (i: number, v: 1 | -1) => {
    p.rate(i, v);
    poke();
    play([{ s: v === 1 ? { pose: "rire", title: "Merci !", sub: "Ça me fait rouler de joie.", anim: "shake" } : { pose: "oups", title: "Je note…", sub: "L'atelier relit ma réponse et on corrige.", anim: "shake" }, ms: 2800 }, { s: idle() }]);
  };
  const tickle = () => {
    if (scene.pose === "dort") return wake();
    poke();
    play([{ s: { pose: "rire", title: "Hé, ça chatouille !", sub: "Pose-moi plutôt une question.", anim: "shake" }, ms: 2000 }, { s: idle() }]);
  };

  // Façons de chercher (avant la première question).
  const fresh = !p.msgs.some((m) => m.role === "user");
  const prefill = (t: string, s: Scene) => {
    p.setInput(t); poke(); play([{ s, ms: 4000 }, { s: idle() }]);
    setTimeout(() => { const el = document.getElementById("skot-input") as HTMLInputElement | null; el?.focus(); el?.setSelectionRange(t.length, t.length); }, 30);
  };
  const TILES: { label: string; sub: string; icon: typeof Bike; go: () => void; to?: string }[] = [
    { label: "Ma trottinette", sub: "Dis-moi le modèle", icon: Bike, go: () => prefill("Ma trottinette, c'est une ", { pose: "clin", title: "Laquelle ?", sub: "Marque et modèle, je connais tout le catalogue.", anim: "bob" }) },
    { label: "Une photo", sub: "Pneu, prise, pièce", icon: Camera, go: () => { poke(); p.pickPhoto(); } },
    { label: "Taille de pneu", sub: "Lue sur le flanc", icon: CircleDot, go: () => prefill("Sur le flanc de mon pneu, c'est écrit ", { pose: "loupe", title: "Montre-moi ça.", sub: "Ex. 10x2.5 ou 60/70-6.5 : je trouve ce qui monte.", anim: "scan" }) },
    { label: "Le catalogue", sub: "Par famille de pièces", icon: LayoutGrid, go: p.onClose, to: "/catalogue" },
    { label: "Ma commande", sub: "Où elle en est", icon: Package, go: () => p.send("Où en est ma commande ?") },
    { label: "L'atelier", sub: "Un vrai mécano", icon: Wrench, go: () => p.send("Je veux poser une question à l'atelier") },
  ];
  const tileCls = "flex items-center gap-2.5 min-h-[56px] px-3 text-left bg-white disabled:opacity-50";
  const tileInner = (t: (typeof TILES)[number]) => (
    <>
      <t.icon className="w-5 h-5 shrink-0" style={{ color: GREEN }} strokeWidth={2.4} />
      <span className="min-w-0">
        <span className="block text-[14px] font-extrabold leading-tight" style={{ fontFamily: JAK, color: CARBON }}>{t.label}</span>
        <span className="block text-[12.5px] leading-tight mt-0.5" style={{ fontFamily: JAK, color: "#6B6B6B" }}>{t.sub}</span>
      </span>
    </>
  );

  return (
    <Shell width={440}>
      <div className="relative flex items-end gap-1 pl-1 pr-3 h-[176px] md:h-[190px] shrink-0 overflow-hidden"
        style={{ paddingTop: "max(8px, env(safe-area-inset-top))", background: `radial-gradient(120% 90% at 18% 100%, #ffffff 0%, ${BEIGE} 55%, #EAE2D2 100%)`, borderBottom: `3px solid ${CARBON}` }}>
        <span aria-hidden className="absolute left-3 right-[55%] bottom-[6px] h-[10px] rounded-[50%]" style={{ background: "radial-gradient(closest-side, rgba(0,0,0,.18), transparent)" }} />
        <button type="button" onClick={tickle} aria-label="SKOT" className="relative block -mb-1 shrink-0 w-[160px] h-[160px] md:w-[180px] md:h-[180px]">
          <span key={scene.pose + scene.anim} className={`absolute inset-0 skf-a-${scene.anim}`}>
            <img key={scene.pose} src={poseSrc(scene.pose)} alt="" draggable={false} className="block w-full h-full select-none skf-pose" style={{ filter: "drop-shadow(0 10px 12px rgba(0,0,0,.18))" }} />
          </span>
        </button>
        <div className="flex-1 min-w-0 self-center pt-2 pr-9">
          <span className="block p-[2px]" style={{ background: CARBON, clipPath: cut2(10) }}>
            <span className="block bg-white px-3.5 py-2.5" style={{ clipPath: cut2(9) }}>
              <span key={scene.title} className="block italic uppercase leading-tight skf-in" style={{ fontFamily: UNB, fontWeight: 900, fontSize: 16, color: CARBON }}>{scene.title}</span>
              <span key={scene.sub} className="block text-[14px] leading-snug mt-1 skf-in line-clamp-3" style={{ fontFamily: JAK, color: "#555" }}>{scene.sub}</span>
            </span>
          </span>
          <p className="mt-2 uppercase italic text-[12px] font-extrabold tracking-wide" style={{ fontFamily: JAK, color: GREEN }}>SKOT · l'IA de l'atelier</p>
        </div>
        <span className="absolute right-1 top-[max(4px,env(safe-area-inset-top))]"><CloseBtn onClose={p.onClose} /></span>
      </div>
      <SearchBar onSearch={p.onSearch} className="mx-3 mt-3" />
      <div ref={p.listRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-3" aria-live="polite" onPointerDown={wake}>
        {p.msgs.map((m, i) =>
          m.role === "user" ? <UserMsg key={i} m={m} tone="green" /> : (
            <div key={i} className="max-w-[92%] space-y-2 skf-in">
              <Bubble>{m.text}</Bubble>
              {m.cards?.map((c) => <div key={c.slug}>{p.renderCard(c)}</div>)}
              <Rating m={m} i={i} rate={rate} />
            </div>
          ),
        )}
        {fresh && (
          <div className="skf-in">
            <p className="uppercase italic text-[12px] font-extrabold tracking-wide mb-2" style={{ fontFamily: JAK, color: GREEN }}>Comment tu cherches ?</p>
            <div className="grid grid-cols-2 gap-2">
              {TILES.map((t) => {
                const wrap = (child: ReactNode) => (
                  <span key={t.label} className="block p-[1.5px]" style={{ background: CARBON, clipPath: cutTR(10) }}>{child}</span>
                );
                return t.to
                  ? wrap(<Link to={t.to} onClick={t.go} className={tileCls} style={{ clipPath: cutTR(9.5) }}>{tileInner(t)}</Link>)
                  : wrap(<button type="button" disabled={p.busy} onClick={t.go} className={`w-full ${tileCls}`} style={{ clipPath: cutTR(9.5) }}>{tileInner(t)}</button>);
              })}
            </div>
          </div>
        )}
        {p.busy && <Bubble><Dots label="Je cherche…" /></Bubble>}
      </div>
      {!fresh && <Chips p={p} />}
      <PhotoRow p={p} />
      <Composer p={p} />
    </Shell>
  );
};

const SkotPanel = (p: SkotPanelProps) => {
  if (!cssInjected && typeof document !== "undefined") {
    const el = document.createElement("style");
    el.textContent = CSS;
    document.head.appendChild(el);
    cssInjected = true;
  }
  const skotCount = p.msgs.filter((m) => m.role === "skot").length;
  const mood = useMood(p.busy, skotCount);
  useEffect(() => {
    (["ecoute", "clin", "reflechit", "content"] as Mood[]).forEach((m) => { new Image().src = head(m); if (p.variant !== 1 && p.variant !== 4) new Image().src = body(m); });
  }, [p.variant]);
  const topPad = { paddingTop: "max(8px, env(safe-area-inset-top))" };

  /* 1 · Repassé — la fenêtre d'aujourd'hui, même disposition, mais en crème avec la tête de la mascotte dans un phare chromé. */
  if (p.variant === 1)
    return (
      <Shell>
        <div className="flex items-center gap-3 px-3 py-2.5" style={{ ...topPad, background: BEIGE, borderBottom: `3px solid ${GREEN}` }}>
          <Head mood={mood} size={54} chrome />
          <div className="flex-1 min-w-0">
            <p className="italic uppercase leading-none" style={{ fontFamily: UNB, fontWeight: 900, fontSize: 20, color: CARBON }}>SKOT <span style={{ color: GREEN }}>· L'atelier</span></p>
            <p className="text-[14px] mt-1" style={{ fontFamily: JAK, color: "#555" }}>{p.busy ? "Je fouille l'atelier…" : "Je vérifie tout dans le catalogue"}</p>
          </div>
          <CloseBtn onClose={p.onClose} />
        </div>
        <SearchBar onSearch={p.onSearch} className="mx-3 mt-3" />
        <div ref={p.listRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-3" aria-live="polite">
          {p.msgs.map((m, i) =>
            m.role === "user" ? <UserMsg key={i} m={m} /> : (
              <div key={i} className="flex gap-2 items-start skf-in">
                <Head mood={i === p.msgs.length - 1 ? mood : "ecoute"} size={34} />
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="text-[14.5px] leading-relaxed whitespace-pre-wrap border-l-[3px] pl-2.5" style={{ borderColor: GREEN, color: CARBON, fontFamily: JAK }}>{m.text}</p>
                  {m.cards?.map((c) => <div key={c.slug}>{p.renderCard(c)}</div>)}
                  <Rating m={m} i={i} rate={p.rate} />
                </div>
              </div>
            ),
          )}
          {p.busy && <div className="flex gap-2 items-center"><Head mood="reflechit" size={34} /><Dots /></div>}
        </div>
        <Chips p={p} />
        <PhotoRow p={p} />
        <Composer p={p} />
      </Shell>
    );

  /* 2 · Plaque émaillée — en-tête comme une plaque de garage émaillée verte, SKOT en entier qui déborde dessus. */
  if (p.variant === 2)
    return (
      <Shell width={420}>
        <div className="relative px-3 pb-3" style={{ ...topPad, background: BEIGE }}>
          <div className="p-[2px]" style={{ background: CARBON, clipPath: cut2(14) }}>
            <div className="relative p-[6px]" style={{ background: GREEN, clipPath: cut2(13) }}>
              <div className="relative px-4 py-3 pr-[118px] min-h-[104px]" style={{ border: `2px solid ${BEIGE}`, clipPath: cut2(10) }}>
                <p className="uppercase tracking-[0.18em] text-[11px] font-bold" style={{ fontFamily: JAK, color: "#CFE3D4" }}>L'atelier · conseil pièces</p>
                <p className="italic uppercase leading-none mt-1" style={{ fontFamily: UNB, fontWeight: 900, fontSize: 34, color: BEIGE, textShadow: `2px 2px 0 ${GREEN_D}` }}>SKOT</p>
                <p className="text-[14px] mt-1.5 leading-snug" style={{ fontFamily: JAK, color: "#F1EADB" }}>La patinette qui connaît toutes les trotts.</p>
              </div>
            </div>
          </div>
          <span className="absolute right-1 top-[max(4px,env(safe-area-inset-top))] z-10"><CloseBtn onClose={p.onClose} /></span>
          <span className="absolute right-4 -bottom-7 z-10 skf-bob"><Body mood={mood} size={138} flip /></span>
        </div>
        <SearchBar onSearch={p.onSearch} className="mx-3 mr-[132px]" />
        <div ref={p.listRef} className="flex-1 overflow-y-auto px-3 pt-5 pb-4 space-y-3" aria-live="polite" style={{ background: CREAM }}>
          {p.msgs.map((m, i) =>
            m.role === "user" ? <UserMsg key={i} m={m} /> : (
              <div key={i} className="flex gap-2 items-end skf-in">
                <Head mood={i === p.msgs.length - 1 ? mood : "ecoute"} size={32} />
                <div className="min-w-0 max-w-[88%] space-y-2">
                  <Bubble>{m.text}</Bubble>
                  {m.cards?.map((c) => <div key={c.slug}>{p.renderCard(c)}</div>)}
                  <Rating m={m} i={i} rate={p.rate} />
                </div>
              </div>
            ),
          )}
          {p.busy && <div className="flex gap-2 items-end"><Head mood="reflechit" size={32} /><Bubble><Dots /></Bubble></div>}
        </div>
        <div style={{ background: BEIGE, borderTop: `2px solid ${CARBON}` }}>
          <Chips p={p} />
          <PhotoRow p={p} />
          <Composer p={p} />
        </div>
      </Shell>
    );

  /* 3 · Il te parle — retenue le 25/10 : scène animée (poses, saisons, façons de chercher) → ScenePanel. */
  if (p.variant === 3) return <ScenePanel {...p} />;

  /* 4 · Phare — le côté site moderne : en-tête carbone, tête dans un phare chromé avec voyant « en ligne », bulles arrondies. */
  if (p.variant === 4)
    return (
      <Shell bg="#F3EFE7">
        <div className="relative flex items-center gap-3 px-3 py-3" style={{ ...topPad, background: CARBON }}>
          <span className="relative">
            <Head mood={mood} size={58} chrome bg="#EDE7DA" />
            <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full skf-pulse" style={{ background: "#5FBF7A", border: `2px solid ${CARBON}` }} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="leading-none" style={{ fontFamily: UNB, fontWeight: 800, fontSize: 21, color: "#fff" }}>SKOT</p>
            <p className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[13px] font-semibold" style={{ fontFamily: JAK, background: "rgba(95,191,122,.14)", color: "#9FD8AE" }}>
              {p.busy ? "Je fouille l'atelier…" : "En ligne · vérifie le catalogue"}
            </p>
          </div>
          <CloseBtn onClose={p.onClose} light />
          {p.busy && <span className="absolute left-0 right-0 bottom-0 h-[3px] overflow-hidden"><span className="block w-2/5 h-full skf-bar" style={{ background: GREEN }} /></span>}
        </div>
        <SearchBar onSearch={p.onSearch} className="mx-3 mt-3" round />
        <div ref={p.listRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-3" aria-live="polite">
          {p.msgs.map((m, i) =>
            m.role === "user" ? <UserMsg key={i} m={m} tone="green" round /> : (
              <div key={i} className="flex gap-2 items-end skf-in">
                <Head mood={i === p.msgs.length - 1 ? mood : "ecoute"} size={32} bg="#fff" />
                <div className="min-w-0 max-w-[86%] space-y-2">
                  <div className="bg-white rounded-[18px] rounded-bl-md px-3.5 py-2.5 text-[14.5px] leading-relaxed whitespace-pre-wrap shadow-[0_2px_12px_rgba(0,0,0,.06)]" style={{ fontFamily: JAK, color: CARBON }}>{m.text}</div>
                  {m.cards?.map((c) => <div key={c.slug}>{p.renderCard(c)}</div>)}
                  <Rating m={m} i={i} rate={p.rate} />
                </div>
              </div>
            ),
          )}
          {p.busy && <div className="flex gap-2 items-end"><Head mood="reflechit" size={32} bg="#fff" /><div className="bg-white rounded-[18px] rounded-bl-md px-3.5 py-3 shadow-[0_2px_12px_rgba(0,0,0,.06)]"><Dots /></div></div>}
        </div>
        <Chips p={p} round />
        <PhotoRow p={p} />
        <Composer p={p} round />
      </Shell>
    );

  /* 5 · Au comptoir — en-tête discret ; SKOT en entier est accoudé au comptoir, juste au-dessus de la zone où tu écris. */
  return (
    <Shell>
      <div className="flex items-center gap-2 pl-4 pr-2 py-2" style={{ ...topPad, background: CREAM, borderBottom: `1px solid ${CARBON}1A` }}>
        <p className="flex-1 italic uppercase leading-none" style={{ fontFamily: UNB, fontWeight: 900, fontSize: 18, color: CARBON }}>SKOT <span style={{ color: GREEN }}>· L'atelier</span></p>
        <button type="button" onClick={p.onSearch} aria-label="Chercher une pièce" className="w-11 h-11 grid place-items-center" style={{ color: GREEN }}><Search className="w-5 h-5" strokeWidth={2.6} /></button>
        <CloseBtn onClose={p.onClose} />
      </div>
      <div ref={p.listRef} className="flex-1 overflow-y-auto px-3 pt-4 pb-8 space-y-3" aria-live="polite">
        {p.msgs.map((m, i) =>
          m.role === "user" ? <UserMsg key={i} m={m} /> : (
            <div key={i} className="max-w-[92%] space-y-2 skf-in">
              <p className="uppercase italic text-[12px] font-extrabold tracking-wide" style={{ fontFamily: JAK, color: GREEN }}>SKOT</p>
              <Bubble>{m.text}</Bubble>
              {m.cards?.map((c) => <div key={c.slug}>{p.renderCard(c)}</div>)}
              <Rating m={m} i={i} rate={p.rate} />
            </div>
          ),
        )}
      </div>
      <div className="relative" style={{ background: BEIGE, borderTop: `3px solid ${GREEN}` }}>
        <span className="absolute left-0 -top-6 pointer-events-none skf-bob"><Body mood={mood} size={118} /></span>
        <div className="pl-[122px] pr-3 pt-2 min-h-[94px] flex items-center">
          {p.busy ? <Dots /> : <span className="text-[14px] leading-snug" style={{ fontFamily: JAK, color: "#555" }}>{STATUS[mood][1]}</span>}
        </div>
        <Chips p={p} />
        <PhotoRow p={p} />
        <Composer p={p} />
      </div>
    </Shell>
  );
};

export default SkotPanel;
