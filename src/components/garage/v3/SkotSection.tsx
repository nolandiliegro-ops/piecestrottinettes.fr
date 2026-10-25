/**
 * Garage v3 — « SKOT », la discussion du garage en pleine page (25/10/2026, choix de Nolan :
 * « la discussion, où ça parle toujours avec SKOT »). Même moteur que la bulle du site (askSkot, contexte garage).
 * Depuis une commande : /garage/skot?commande=PT-XXXX envoie directement la question sur cette commande.
 */
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Send, Camera, X, ShoppingCart, ThumbsUp, ThumbsDown } from "lucide-react";
import { askSkot, compressImage, sendSkotFeedback, type SkotCard } from "@/lib/skot";
import { useCart } from "@/hooks/useCart";
import { SHOP_OPEN, openPrelaunch } from "@/config/launch";
import { useAuth } from "@/hooks/useAuth";
import { ScreenTitle, FONT, UNB, CARBON, GREEN, PAPER, LINE, MUTED, cut } from "./ui";

type Msg = { role: "user" | "skot"; text: string; cards?: SkotCard[]; image?: string; id?: string | null; conv?: string; fb?: 1 | -1 };

// Nouvelle mascotte SKOT (25/10, même visuels que la fenêtre SKOT du site : public/skot/tete-*.webp, skot-*.webp).
const CHROME = "linear-gradient(145deg,#ffffff 0%,#d4d7d3 38%,#8f948e 52%,#e9ebe8 70%,#b9bdb8 100%)";
const Head = ({ busy, size }: { busy: boolean; size: number }) => (
  <span className="block rounded-full shrink-0" style={{ width: size, height: size, padding: 3, background: CHROME }}>
    <span className="block w-full h-full rounded-full overflow-hidden" style={{ background: "#F5F0E8" }}>
      <img src={`/skot/tete-${busy ? "reflechit" : "content"}.webp`} alt="" draggable={false} className="w-full h-full object-cover select-none" style={{ transform: "scale(1.12) translateY(5%)" }} />
    </span>
  </span>
);

const SUGGESTIONS = ["Où en est ma dernière commande ?", "Quels pneus pour ma trott ?", "Ma trott fait un bruit au freinage", "C'est quoi l'entretien à faire ?"];

const Card = ({ c }: { c: SkotCard }) => {
  const { addItem, setIsOpen } = useCart();
  const add = () => {
    if (!SHOP_OPEN) { openPrelaunch(); return; }
    if (!c.in_stock) return;
    addItem({ id: c.id, name: c.name, price: c.price, image_url: c.image_url, stock_quantity: c.stock_quantity ?? 1 });
    toast.success(`${c.name} ajouté au panier`, { action: { label: "Voir le panier", onClick: () => setIsOpen(true) } });
  };
  return (
    <div className="flex gap-3 p-3 bg-white" style={{ clipPath: cut(8), borderBottom: `3px solid ${c.compat === "unverified" ? "#B7791F" : GREEN}` }}>
      {c.image_url && <img src={c.image_url} alt="" loading="lazy" className="w-16 h-16 object-contain shrink-0" />}
      <div className="min-w-0 flex-1 grid gap-1">
        <Link to={`/piece/${c.slug}`} className="text-[15px] font-semibold leading-snug" style={{ color: CARBON }}>{c.name}</Link>
        <p className="text-sm" style={{ color: MUTED }}>{c.compat === "verified" ? "✓ Compatible · " : c.compat === "unverified" ? "◐ À confirmer · " : ""}{c.in_stock ? `livraison ${c.delay}` : "rupture de stock"}</p>
        <div className="flex items-center justify-between gap-2">
          <b className="text-base">{c.price.toFixed(2).replace(".", ",")} €</b>
          <button type="button" onClick={add} disabled={SHOP_OPEN && !c.in_stock} className="min-h-[44px] px-3 inline-flex items-center gap-1.5 text-sm font-bold text-white disabled:opacity-50" style={{ background: "#FF6600", clipPath: cut(6) }}>
            <ShoppingCart className="w-4 h-4" /> {SHOP_OPEN ? "Ajouter" : "Bientôt"}
          </button>
        </div>
      </div>
    </div>
  );
};

const SkotSection = () => {
  const { profile } = useAuth();
  const [params, setParams] = useSearchParams();
  const first = profile?.display_name ? `, ${profile.display_name}` : "";
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "skot", text: `Salut${first} ! Je connais le catalogue et je peux suivre tes commandes. Pose ta question, ou envoie une photo de ta pièce.` }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [photo, setPhoto] = useState<{ media_type: string; data: string; preview: string } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const sentOrder = useRef(false);

  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }); }, [msgs, busy]);

  const send = async (text: string) => {
    const t = text.trim();
    if ((!t && !photo) || busy) return;
    const img = photo;
    setMsgs((m) => [...m, { role: "user", text: t || "(photo)", image: img?.preview }]);
    setInput("");
    setPhoto(null);
    setBusy(true);
    const r = await askSkot(t, { type: "garage" }, img ? { media_type: img.media_type, data: img.data } : undefined);
    setMsgs((m) => [...m, { role: "skot", text: r.reply, cards: r.cards, id: r.message_id, conv: r.conversation_id }]);
    setBusy(false);
  };

  // Ouvert depuis une commande : la question part toute seule.
  useEffect(() => {
    const num = params.get("commande");
    if (!num || sentOrder.current) return;
    sentOrder.current = true;
    params.delete("commande");
    setParams(params, { replace: true });
    void send(`Où en est ma commande N° ${num} ?`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rate = async (i: number, v: 1 | -1) => {
    const m = msgs[i];
    if (!m?.id || !m.conv || m.fb) return;
    setMsgs((all) => all.map((x, k) => (k === i ? { ...x, fb: v } : x)));
    const ok = await sendSkotFeedback(m.id, m.conv, v);
    if (!ok) setMsgs((all) => all.map((x, k) => (k === i ? { ...x, fb: undefined } : x)));
  };

  const onSubmit = (e: FormEvent) => { e.preventDefault(); void send(input); };

  return (
    <div>
      <ScreenTitle kicker="La discussion du garage" title="SKOT">Il répond sur tes pièces, ta trott et tes commandes. S'il faut un humain, il passe la main à l'atelier.</ScreenTitle>

      <section className="flex flex-col h-[min(72vh,720px)] min-h-[460px]" style={{ background: PAPER, clipPath: cut(14), fontFamily: FONT }} aria-label="Discussion avec SKOT">
        <div className="flex items-center gap-3 px-4 py-3" style={{ background: CARBON }}>
          <Head busy={busy} size={48} />
          <div className="min-w-0">
            <p className="text-[17px] uppercase leading-none text-white" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic" }}>SKOT <span style={{ color: "#8FBF9C" }}>· l'atelier</span></p>
            <p className="text-sm text-white/75">{busy ? "Il cherche dans le catalogue…" : "Assistant de l'atelier, il vérifie tout dans le catalogue"}</p>
          </div>
        </div>

        <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-4 grid content-start gap-3">
          {msgs.map((m, i) => (
            <div key={i} className={`grid gap-2 max-w-[88%] ${m.role === "user" ? "justify-self-end" : "justify-self-start grid-cols-[36px_minmax(0,1fr)] items-start"}`}>
              {m.role === "skot" && <span className="row-span-6"><Head busy={false} size={36} /></span>}
              {m.image && <img src={m.image} alt="Ta photo" className="max-w-[220px] justify-self-end" style={{ clipPath: cut(8) }} />}
              <p className="px-3.5 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap" style={m.role === "user" ? { background: CARBON, color: "#FFFFFF", clipPath: cut(8) } : { background: "#FFFFFF", color: CARBON, clipPath: cut(8), boxShadow: `inset 0 0 0 1px ${LINE}` }}>
                {m.text}
              </p>
              {m.cards?.map((c) => <Card key={c.id} c={c} />)}
              {m.role === "skot" && m.id && m.conv && (
                <div className="flex gap-1">
                  <button type="button" onClick={() => void rate(i, 1)} disabled={!!m.fb} aria-label="Bonne réponse" className="w-11 h-11 inline-flex items-center justify-center" style={{ color: m.fb === 1 ? GREEN : MUTED }}><ThumbsUp className="w-4 h-4" /></button>
                  <button type="button" onClick={() => void rate(i, -1)} disabled={!!m.fb} aria-label="Réponse à revoir" className="w-11 h-11 inline-flex items-center justify-center" style={{ color: m.fb === -1 ? "#DC2626" : MUTED }}><ThumbsDown className="w-4 h-4" /></button>
                </div>
              )}
            </div>
          ))}
          {msgs.length === 1 && (
            <img src="/skot/skot-ecoute.webp" alt="SKOT, la mascotte de l'atelier" draggable={false} className="justify-self-center w-40 h-40 lg:w-52 lg:h-52 object-contain select-none" style={{ filter: "drop-shadow(0 10px 12px rgba(0,0,0,.18))" }} />
          )}
          {msgs.length === 1 && (
            <div className="flex flex-wrap gap-2 pt-1 justify-center">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" onClick={() => void send(s)} className="min-h-[44px] px-3.5 text-sm font-bold" style={{ background: "#FFFFFF", color: CARBON, clipPath: cut(8), boxShadow: `inset 0 0 0 1px ${LINE}` }}>{s}</button>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={onSubmit} className="flex items-center gap-2 p-3" style={{ borderTop: `1px solid ${LINE}` }}>
          <input ref={fileRef} id="v3-skot-photo" type="file" accept="image/*" capture="environment" className="hidden"
            onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; try { setPhoto(await compressImage(f)); } catch { toast.error("Impossible de lire cette photo"); } if (fileRef.current) fileRef.current.value = ""; }} />
          {photo ? (
            <button type="button" onClick={() => setPhoto(null)} aria-label="Retirer la photo" className="relative w-11 h-11 shrink-0">
              <img src={photo.preview} alt="" className="w-11 h-11 object-cover" /><X className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full" />
            </button>
          ) : (
            <button type="button" onClick={() => fileRef.current?.click()} aria-label="Envoyer une photo" className="w-11 h-11 shrink-0 inline-flex items-center justify-center" style={{ color: CARBON }}><Camera className="w-5 h-5" /></button>
          )}
          <label htmlFor="v3-skot-input" className="sr-only">Ta question pour SKOT</label>
          <input id="v3-skot-input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ta question…" className="flex-1 min-w-0 min-h-[44px] px-3 text-[15px] border focus:outline-none focus:ring-2 focus:ring-green-600" style={{ borderColor: LINE, background: "#FFFFFF" }} />
          <button type="submit" disabled={busy || (!input.trim() && !photo)} aria-label="Envoyer" className="w-11 h-11 shrink-0 inline-flex items-center justify-center text-white disabled:opacity-50" style={{ background: CARBON, clipPath: cut(8) }}><Send className="w-5 h-5" /></button>
        </form>
      </section>
    </div>
  );
};

export default SkotSection;
