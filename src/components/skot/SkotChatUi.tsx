// 28/10/2026 — Fenêtre de SKOT, tour « vraie discussion » (Nolan : « la barre de recherche fait la même taille que le texte,
// on ne comprend pas que c'est la conversation… les propositions sont trop carrées… que ça fasse vraiment une discussion…
// des likes, des commentaires, des petits emojis »).
// Défaut commun corrigé dans les 5 : recherche, message de SKOT, choix et saisie portaient le même cadre noir à angle coupé.
// Désormais : bulles de discussion (avatar + queue), recherche du site visiblement « autre chose », réactions emoji + commentaire
// sous chaque réponse de SKOT, emojis dans la saisie. ?skotui=1..5 (0 = fenêtre actuelle).
import { useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Camera, Loader2, Search, Send, Smile, X, ChevronRight, MessageCircle } from "lucide-react";
import type { SkotCard } from "@/lib/skot";
import type { PanelMsg, SkotPanelProps } from "./SkotPanel";

const GREEN = "#4A7C59";
const CARBON = "#1A1A1A";
const PAPER = "#F3EFE7";
const JAK = "'Plus Jakarta Sans', sans-serif";
const UNB = "'Unbounded', sans-serif";

// 28/10 : Nolan choisit « Messagerie » (2) ; ?skotui=0 remet l'ancienne fenêtre.
export const SKOTUI_DEFAUT = 2;
export const readSkotUi = (): number => {
  if (typeof window === "undefined") return SKOTUI_DEFAUT;
  try {
    const q = new URLSearchParams(window.location.search).get("skotui");
    if (q !== null && /^[0-5]$/.test(q)) { window.sessionStorage.setItem("pt-skotui", q); return Number(q); }
    const s = window.sessionStorage.getItem("pt-skotui");
    return s && /^[0-5]$/.test(s) ? Number(s) : SKOTUI_DEFAUT;
  } catch { return SKOTUI_DEFAUT; }
};

export type Tile = { label: string; sub: string; icon: typeof Camera; go: () => void; to?: string };

// Réactions : positives = 👍 côté atelier, 😕 = « pas utile » (signal pour la boucle d'amélioration).
export const REACTIONS = ["👍", "❤️", "😂", "🔥", "😕"] as const;
const QUICK_EMOJIS = ["😀", "😂", "👍", "🙏", "🔥", "❤️", "😅", "🤔", "🛴", "🔧"];

const Avatar = ({ size = 32 }: { size?: number }) => (
  <span className="shrink-0 rounded-full bg-white overflow-hidden grid place-items-center" style={{ width: size, height: size, boxShadow: "0 1px 4px rgba(0,0,0,.12)" }}>
    <img src="/skot/yeux-ecoute.webp" alt="" className="w-full h-full object-cover" style={{ transform: "scale(1.35)", objectPosition: "50% 40%" }} />
  </span>
);

/* Bulle de SKOT : arrondie, blanche, petite queue à gauche, sans cadre noir. */
const SkotBubble = ({ children, tail = true, plain = false }: { children: ReactNode; tail?: boolean; plain?: boolean }) =>
  plain ? (
    <div className="text-[15px] leading-relaxed whitespace-pre-wrap" style={{ fontFamily: JAK, color: CARBON }}>{children}</div>
  ) : (
    <div className={`relative bg-white px-3.5 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap ${tail ? "rounded-[18px] rounded-bl-[6px]" : "rounded-[18px]"}`}
      style={{ fontFamily: JAK, color: CARBON, boxShadow: "0 1px 2px rgba(0,0,0,.08), 0 2px 10px rgba(0,0,0,.05)" }}>
      {children}
    </div>
  );

const UserBubble = ({ m }: { m: PanelMsg }) => (
  <div className="flex justify-end skf-in">
    <div className="max-w-[82%] text-white text-[15px] leading-relaxed px-3.5 py-2.5 whitespace-pre-wrap rounded-[18px] rounded-br-[6px]" style={{ background: GREEN, fontFamily: JAK }}>
      {m.image && <img src={m.image} alt="Photo envoyée" className="max-h-40 mb-2 rounded-xl" />}
      {m.text}
    </div>
  </div>
);

/* Réactions emoji + commentaire sous une réponse de SKOT. */
const Reactions = ({ m, i, p, compact = false }: { m: PanelMsg; i: number; p: SkotPanelProps; compact?: boolean }) => {
  const [mine, setMine] = useState<string | null>(m.reaction ?? null);
  const [open, setOpen] = useState(false);
  const [txt, setTxt] = useState("");
  const [sent, setSent] = useState(false);
  if (!m.id) return null;
  const pick = (e: string) => { if (mine) return; setMine(e); p.react?.(i, e); };
  return (
    <div className="mt-1.5">
      <div className="flex items-center gap-1 flex-wrap">
        {(mine ? [mine] : REACTIONS).map((e) => (
          <button key={e} type="button" onClick={() => pick(e)} aria-label={`Réagir ${e}`} aria-pressed={mine === e}
            className={`h-9 min-w-[36px] px-2 rounded-full text-[17px] leading-none grid place-items-center transition ${mine === e ? "bg-[#4A7C59]/15 ring-1 ring-[#4A7C59]" : "bg-white/70 hover:bg-white"}`}
            style={{ boxShadow: mine === e ? undefined : "0 1px 2px rgba(0,0,0,.06)" }}>{e}</button>
        ))}
        {!compact && !sent && (
          <button type="button" onClick={() => setOpen((v) => !v)} className="h-9 px-3 rounded-full text-[13px] font-bold inline-flex items-center gap-1.5 text-[#555] hover:text-[#1A1A1A]" style={{ fontFamily: JAK }}>
            <MessageCircle className="w-4 h-4" />Commenter
          </button>
        )}
        {mine && <span className="text-[13px] text-[#6B6B6B] ml-1" style={{ fontFamily: JAK }}>{mine === "😕" ? "Noté, l'atelier relit." : "Merci !"}</span>}
        {sent && <span className="text-[13px] text-[#6B6B6B] ml-1" style={{ fontFamily: JAK }}>Commentaire envoyé à l'atelier.</span>}
      </div>
      {open && !sent && (
        <form className="mt-1.5 flex items-center gap-1.5" onSubmit={(e) => { e.preventDefault(); if (!txt.trim()) return; p.comment?.(i, txt.trim()); setSent(true); setOpen(false); }}>
          <input value={txt} onChange={(e) => setTxt(e.target.value)} maxLength={500} placeholder="Ton avis sur cette réponse…" autoFocus
            className="flex-1 min-w-0 h-10 px-3.5 rounded-full bg-white text-base outline-none focus:ring-2 focus:ring-[#4A7C59]" style={{ fontFamily: JAK }} />
          <button type="submit" className="h-10 px-4 rounded-full text-white text-[14px] font-bold" style={{ background: GREEN, fontFamily: JAK }}>Envoyer</button>
        </form>
      )}
    </div>
  );
};

/* Saisie : appareil photo, champ, emojis rapides, envoi. */
const ChatComposer = ({ p }: { p: SkotPanelProps }) => {
  const [emo, setEmo] = useState(false);
  return (
    <div className="bg-white/80 backdrop-blur border-t border-black/5">
      {emo && (
        <div className="flex gap-1 px-3 pt-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {QUICK_EMOJIS.map((e) => (
            <button key={e} type="button" onClick={() => p.setInput(p.input + e)} className="shrink-0 w-10 h-10 rounded-full text-[20px] grid place-items-center hover:bg-black/5">{e}</button>
          ))}
        </div>
      )}
      {p.photo && (
        <div className="px-3 pt-2 flex items-center gap-2 text-sm text-gray-700" style={{ fontFamily: JAK }}>
          <img src={p.photo.preview} alt="Photo à envoyer" className="w-12 h-12 object-cover rounded-lg" />Photo prête à partir
          <button type="button" onClick={p.clearPhoto} className="ml-auto underline min-h-[44px]">Retirer</button>
        </div>
      )}
      <form onSubmit={(e: FormEvent) => p.onSubmit(e)} className="flex items-center gap-1.5 p-2.5">
        <button type="button" onClick={p.pickPhoto} aria-label="Envoyer une photo" className="w-11 h-11 rounded-full grid place-items-center text-[#1A1A1A] hover:bg-black/5 shrink-0"><Camera className="w-[22px] h-[22px]" /></button>
        <div className="flex-1 min-w-0 flex items-center rounded-full bg-[#F1EEE8] pr-1">
          <label htmlFor="skot-input" className="sr-only">Ton message</label>
          <input id="skot-input" value={p.input} onChange={(e) => p.setInput(e.target.value)} maxLength={1500} placeholder="Écris à SKOT…"
            className="flex-1 min-w-0 h-11 pl-4 bg-transparent text-base outline-none" style={{ fontFamily: JAK }} />
          <button type="button" onClick={() => setEmo((v) => !v)} aria-label="Emojis" aria-pressed={emo} className={`w-9 h-9 rounded-full grid place-items-center shrink-0 ${emo ? "text-[#4A7C59]" : "text-[#6B6B6B]"}`}><Smile className="w-[22px] h-[22px]" /></button>
        </div>
        <button type="submit" disabled={p.busy || (!p.input.trim() && !p.photo)} aria-label="Envoyer" className="w-11 h-11 rounded-full grid place-items-center text-white disabled:opacity-40 shrink-0" style={{ background: GREEN }}>
          {p.busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 -ml-0.5" />}
        </button>
      </form>
    </div>
  );
};

const Typing = () => (
  <div className="flex items-end gap-2 skf-in">
    <Avatar size={28} />
    <div className="bg-white rounded-[18px] rounded-bl-[6px] px-4 py-3" style={{ boxShadow: "0 1px 2px rgba(0,0,0,.08)" }}>
      <span className="inline-flex gap-1" style={{ color: GREEN }}><i className="skf-dot" /><i className="skf-dot" /><i className="skf-dot" /></span>
    </div>
  </div>
);

const TileLink = ({ t, className, style, children, busy }: { t: Tile; className: string; style?: React.CSSProperties; children: ReactNode; busy: boolean }) =>
  t.to ? <Link to={t.to} onClick={t.go} className={className} style={style}>{children}</Link>
    : <button type="button" disabled={busy} onClick={t.go} className={className} style={style}>{children}</button>;

/* Les messages (commun aux 5) : SKOT à gauche avec avatar, toi à droite. */
const Thread = ({ p, plain = false, compactReact = false }: { p: SkotPanelProps; plain?: boolean; compactReact?: boolean }) => (
  <>
    {p.msgs.map((m, i) =>
      m.role === "user" ? <UserBubble key={i} m={m} /> : (
        <div key={i} className="flex items-end gap-2 skf-in">
          <Avatar size={28} />
          <div className="max-w-[86%] min-w-0 space-y-2">
            <SkotBubble plain={plain}>{m.text}</SkotBubble>
            {m.cards?.map((c: SkotCard) => <div key={c.slug}>{p.renderCard(c)}</div>)}
            <Reactions m={m} i={i} p={p} compact={compactReact} />
          </div>
        </div>
      ),
    )}
    {p.busy && <Typing />}
  </>
);

export interface ChatUiProps {
  ui: number;
  p: SkotPanelProps;
  header: ReactNode;
  tiles: Tile[];
  fresh: boolean;
  onWake: () => void;
}

const Shell = ({ children }: { children: ReactNode }) => (
  <div role="dialog" aria-label="SKOT, l'assistant de l'atelier"
    className="fixed z-[60] inset-0 md:inset-auto md:right-0 md:top-16 md:bottom-0 md:w-[440px] flex flex-col md:shadow-[-14px_0_36px_rgba(0,0,0,0.16)]"
    style={{ background: PAPER, paddingBottom: "env(safe-area-inset-bottom)" }}>
    {children}
  </div>
);

/* Recherche du site, visiblement différente d'un message : pastille grise, sans cadre, étiquette « Recherche du site ». */
const SitePill = ({ onSearch }: { onSearch: () => void }) => (
  <button type="button" onClick={onSearch} className="mx-3 mt-2.5 flex items-center gap-2 h-10 px-3.5 rounded-full bg-black/[0.05] text-left">
    <Search className="w-4 h-4 shrink-0 text-[#6B6B6B]" strokeWidth={2.4} />
    <span className="flex-1 min-w-0 truncate text-[14px] text-[#6B6B6B]" style={{ fontFamily: JAK }}>Chercher une pièce sur le site</span>
    <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#8A8A8A]" style={{ fontFamily: JAK }}>Recherche</span>
  </button>
);

export const LoupeBtn = ({ onSearch }: { onSearch: () => void }) => (
  <button type="button" onClick={onSearch} aria-label="Chercher une pièce sur le site" className="w-11 h-11 rounded-full grid place-items-center text-[#1A1A1A] bg-white/80 hover:bg-white shrink-0" style={{ boxShadow: "0 1px 4px rgba(0,0,0,.08)" }}>
    <Search className="w-5 h-5" strokeWidth={2.4} />
  </button>
);

// Le 1er message de SKOT découpé en 2 bulles courtes (une vraie discussion n'envoie pas un pavé).
const splitGreeting = (t: string): string[] => {
  const k = t.indexOf("Dis-moi");
  return k > 0 ? [t.slice(0, k).trim(), t.slice(k).trim()] : [t];
};

const SkotChatUi = ({ ui, p, header, tiles, fresh, onWake }: ChatUiProps) => {
  const list = (children: ReactNode, extra = "") => (
    <div ref={p.listRef} className={`flex-1 overflow-y-auto px-3 py-4 space-y-3 ${extra}`} aria-live="polite" onPointerDown={onWake}>{children}</div>
  );
  const greeting = p.msgs[0]?.role === "skot" && !p.msgs[0].id ? p.msgs[0].text : null;
  const rest: SkotPanelProps = greeting ? { ...p, msgs: p.msgs } : p;

  // 1 · Repassé : même disposition qu'aujourd'hui, dans la nouvelle peau (bulle + pastille de recherche + cartes douces).
  if (ui === 1) return (
    <Shell>
      {header}
      <SitePill onSearch={p.onSearch} />
      {list(<>
        <Thread p={rest} />
        {fresh && (
          <div className="skf-in pl-9">
            <p className="text-[13px] font-bold mb-2 text-[#6B6B6B]" style={{ fontFamily: JAK }}>Comment tu cherches ?</p>
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2">
              {tiles.map((t) => (
                <TileLink key={t.label} t={t} busy={p.busy} className="flex items-center gap-2.5 min-h-[56px] px-3 text-left bg-white rounded-2xl disabled:opacity-50" style={{ boxShadow: "0 1px 2px rgba(0,0,0,.06), 0 2px 8px rgba(0,0,0,.04)" }}>
                  <t.icon className="w-5 h-5 shrink-0" style={{ color: GREEN }} strokeWidth={2.4} />
                  <span className="min-w-0"><span className="block text-[14px] font-extrabold leading-tight" style={{ fontFamily: JAK, color: CARBON }}>{t.label}</span>
                    <span className="block text-[12.5px] leading-tight mt-0.5 text-[#6B6B6B]" style={{ fontFamily: JAK }}>{t.sub}</span></span>
                </TileLink>
              ))}
            </div>
          </div>
        )}
      </>)}
      <ChatComposer p={p} />
    </Shell>
  );

  // 2 · Messagerie (reco) : la recherche devient une loupe dans l'en-tête ; SKOT écrit en bulles courtes ; les choix sont des réponses rapides.
  if (ui === 2) {
    // La loupe vit dans la colonne de droite de l'en-tête (sous la croix) : elle ne mord plus sur la bulle de SKOT (Nolan, 28/10).
    return (
      <Shell>
        {header}
        {list(<>
          {greeting && fresh ? (
            <div className="space-y-1.5">
              {splitGreeting(greeting).map((g, k, all) => (
                <div key={k} className="flex items-end gap-2 skf-in">
                  {k === all.length - 1 ? <Avatar size={28} /> : <span className="w-7 shrink-0" />}
                  <div className="max-w-[86%]"><SkotBubble tail={k === all.length - 1}>{g}</SkotBubble></div>
                </div>
              ))}
            </div>
          ) : <Thread p={rest} />}
          {fresh && (
            <div className="pl-9 flex flex-wrap gap-2 skf-in">
              {tiles.map((t) => (
                <TileLink key={t.label} t={t} busy={p.busy} className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-full bg-white text-[14px] font-bold disabled:opacity-50" style={{ fontFamily: JAK, color: CARBON, border: `1.5px solid ${GREEN}` }}>
                  <t.icon className="w-4 h-4" style={{ color: GREEN }} strokeWidth={2.5} />{t.label}
                </TileLink>
              ))}
            </div>
          )}
        </>)}
        <ChatComposer p={p} />
      </Shell>
    );
  }

  // 3 · Littéral : la recherche reste en haut mais devient une pastille grise ; le texte n'est plus dans un cadre
  // (comme une discussion) ; les propositions descendent en bas, juste au-dessus de la saisie.
  if (ui === 3) return (
    <Shell>
      {header}
      <SitePill onSearch={p.onSearch} />
      {list(<Thread p={rest} plain />)}
      <div className="flex gap-2 px-3 pb-2 pt-1 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {tiles.map((t) => (
          <TileLink key={t.label} t={t} busy={p.busy} className="shrink-0 inline-flex items-center gap-1.5 h-10 px-3.5 rounded-full bg-white text-[14px] font-bold disabled:opacity-50" style={{ fontFamily: JAK, color: CARBON, boxShadow: "0 1px 3px rgba(0,0,0,.1)" }}>
            <t.icon className="w-4 h-4" style={{ color: GREEN }} strokeWidth={2.5} />{t.label}
          </TileLink>
        ))}
      </div>
      <ChatComposer p={p} />
    </Shell>
  );

  // 4 · Stories : les façons de chercher en ronds (comme les familles du site), loupe dans l'en-tête, réactions en pastilles.
  if (ui === 4) {
    return (
      <Shell>
        {header}
        {fresh && (
          <div className="flex gap-3 px-3 pt-3 pb-1 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {tiles.map((t) => (
              <TileLink key={t.label} t={t} busy={p.busy} className="shrink-0 w-[68px] flex flex-col items-center gap-1 disabled:opacity-50">
                <span className="w-[58px] h-[58px] rounded-full grid place-items-center bg-white" style={{ boxShadow: `0 0 0 2px ${GREEN}, 0 2px 8px rgba(0,0,0,.08)` }}>
                  <t.icon className="w-6 h-6" style={{ color: GREEN }} strokeWidth={2.3} />
                </span>
                <span className="text-[12px] font-bold leading-tight text-center" style={{ fontFamily: JAK, color: CARBON }}>{t.label}</span>
              </TileLink>
            ))}
          </div>
        )}
        {list(<Thread p={rest} compactReact />)}
        <ChatComposer p={p} />
      </Shell>
    );
  }

  // 5 · Plein écran : SKOT passe en petit dans l'en-tête (photo + « répond en quelques secondes ») ; toute la place va à la discussion.
  return (
    <Shell>
      <div className="flex items-center gap-2.5 px-3 h-[64px] shrink-0 bg-white/90 backdrop-blur border-b border-black/5" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <Avatar size={42} />
        <div className="flex-1 min-w-0">
          <p className="italic uppercase leading-none" style={{ fontFamily: UNB, fontWeight: 900, fontSize: 16, color: CARBON }}>Skot</p>
          <p className="text-[12.5px] mt-1 flex items-center gap-1.5 text-[#6B6B6B]" style={{ fontFamily: JAK }}><span className="w-2 h-2 rounded-full" style={{ background: "#22C55E" }} />En ligne · répond en 5 s</p>
        </div>
        <LoupeBtn onSearch={p.onSearch} />
        <button type="button" onClick={p.onClose} aria-label="Fermer" className="w-11 h-11 grid place-items-center text-[#1A1A1A]/70"><X className="w-6 h-6" /></button>
      </div>
      {list(<>
        <Thread p={rest} />
        {fresh && (
          <div className="pl-9 skf-in">
            <div className="bg-white rounded-2xl overflow-hidden divide-y divide-black/5" style={{ boxShadow: "0 1px 2px rgba(0,0,0,.06)" }}>
              {tiles.map((t) => (
                <TileLink key={t.label} t={t} busy={p.busy} className="w-full flex items-center gap-3 min-h-[52px] px-3.5 text-left disabled:opacity-50">
                  <t.icon className="w-5 h-5 shrink-0" style={{ color: GREEN }} strokeWidth={2.4} />
                  <span className="flex-1 min-w-0"><span className="block text-[14.5px] font-bold leading-tight" style={{ fontFamily: JAK, color: CARBON }}>{t.label}</span>
                    <span className="block text-[12.5px] text-[#6B6B6B] leading-tight" style={{ fontFamily: JAK }}>{t.sub}</span></span>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </TileLink>
              ))}
            </div>
          </div>
        )}
      </>)}
      <ChatComposer p={p} />
    </Shell>
  );
};

export default SkotChatUi;
