// Widget SKOT — direction « Établi » + avatar « Le pilote » (choix de Nolan, 24/10/2026).
// Visible seulement si skotEnabled() (interrupteur SKOT_PUBLIC ou ?skot=1), jamais au panier, au paiement ni dans l'admin.
// Téléphone : plein écran à l'ouverture. Ordinateur : panneau de 400 px à droite.
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { X, Send, Camera, Loader2, ShoppingCart, ThumbsUp, ThumbsDown, Search } from "lucide-react";
import { useSpotlight } from "@/contexts/SpotlightContext";
import { readBarreBasVariant } from "@/components/navigation/MobileNavProposals";
import SkotAvatar from "./SkotAvatar";
import SkotLauncher, { readSkotBtnVariant } from "./SkotLauncher";
import { askSkot, compressImage, sendSkotFeedback, skotEnabled, skotHiddenOn, skotPageContext, type SkotCard } from "@/lib/skot";
import { useCart } from "@/hooks/useCart";
import { SHOP_OPEN, openPrelaunch } from "@/config/launch";
import { formatPrice } from "@/lib/formatPrice";
import { toast } from "sonner";

const CHAMFER = "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)";
const CHAMFER_S = "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)";

type Msg = { role: "user" | "skot"; text: string; cards?: SkotCard[]; image?: string; id?: string | null; conv?: string; fb?: 1 | -1 };

const GREETING: Msg = {
  role: "skot",
  text: "Salut ! Moi c'est SKOT, le vieux fou du guidon de l'atelier (une IA, mais une IA qui a de la bouteille). Dis-moi ta trott et ce qu'il te faut : je te dis ce qui monte, preuve à l'appui. Tu peux aussi m'envoyer une photo du flanc de ton pneu ou de ta prise de charge.",
};

const PartCard = ({ card }: { card: SkotCard }) => {
  const { addItem, setIsOpen } = useCart();
  const add = () => {
    if (!SHOP_OPEN) { openPrelaunch(); return; }
    if (!card.in_stock) return;
    addItem({ id: card.id, name: card.name, price: card.price, image_url: card.image_url, stock_quantity: card.stock_quantity ?? 1 });
    toast.success(`${card.name} ajouté au panier`, { action: { label: "Voir le panier", onClick: () => setIsOpen(true) } });
  };
  return (
    <div className="bg-white p-3 flex gap-3" style={{ clipPath: CHAMFER, borderBottom: `3px solid ${card.compat === "unverified" ? "#B7791F" : "#4A7C59"}` }}>
      {card.image_url && <img src={card.image_url} alt="" className="w-16 h-16 object-contain shrink-0" loading="lazy" />}
      <div className="min-w-0 flex-1 space-y-1">
        <Link to={`/piece/${card.slug}`} className="block text-sm font-semibold text-[#1A1A1A] leading-snug hover:underline">{card.name}</Link>
        <p className="text-sm text-gray-600">
          {card.compat === "verified" && <span className="text-[#4A7C59] font-semibold">✓ Compatible · </span>}
          {card.compat === "unverified" && <span className="text-[#B7791F] font-semibold">◐ À confirmer · </span>}
          {card.in_stock ? `livraison ${card.delay}` : "rupture de stock"}
        </p>
        <div className="flex items-center justify-between gap-2">
          <span className="text-base font-extrabold text-[#1A1A1A]">{formatPrice(card.price)}</span>
          <button
            type="button"
            onClick={add}
            disabled={SHOP_OPEN && !card.in_stock}
            className="inline-flex items-center gap-1.5 min-h-[44px] px-3 text-sm font-bold text-white bg-[#FF6600] hover:bg-[#E65C00] disabled:opacity-50"
            style={{ clipPath: CHAMFER_S }}
          >
            <ShoppingCart className="w-4 h-4" /> {SHOP_OPEN ? "Ajouter" : "Bientôt"}
          </button>
        </div>
      </div>
    </div>
  );
};

const SkotWidget = () => {
  const { pathname } = useLocation();
  const [enabled] = useState(() => skotEnabled());
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [photo, setPhoto] = useState<{ media_type: string; data: string; preview: string } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // 24/10 : la barre du bas « SKOT au centre » (?barrebas=5) ouvre SKOT par cet événement et remplace la bulle flottante.
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("skot:open", onOpen);
    return () => window.removeEventListener("skot:open", onOpen);
  }, []);
  const [inNav] = useState(() => readBarreBasVariant() === 5);
  // 24/10 : ?skotbtn=1..4 = SKOT qui sort de la barre du bas (téléphone) ; l'ordinateur garde le bouton vert.
  const [btn] = useState(readSkotBtnVariant);
  const { openSpotlight } = useSpotlight();
  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }); }, [msgs, busy]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!enabled || skotHiddenOn(pathname)) return null;

  const send = async (text: string) => {
    const t = text.trim();
    if ((!t && !photo) || busy) return;
    const img = photo;
    setMsgs((m) => [...m, { role: "user", text: t || "(photo)", image: img?.preview }]);
    setInput("");
    setPhoto(null);
    setBusy(true);
    const r = await askSkot(t, skotPageContext(pathname), img ? { media_type: img.media_type, data: img.data } : undefined);
    setMsgs((m) => [...m, { role: "skot", text: r.reply, cards: r.cards, id: r.message_id, conv: r.conversation_id }]);
    setBusy(false);
  };

  const onSubmit = (e: FormEvent) => { e.preventDefault(); void send(input); };

  const rate = async (i: number, value: 1 | -1) => {
    const m = msgs[i];
    if (!m?.id || !m.conv || m.fb) return;
    setMsgs((all) => all.map((x, k) => (k === i ? { ...x, fb: value } : x)));
    const ok = await sendSkotFeedback(m.id, m.conv, value);
    if (!ok) setMsgs((all) => all.map((x, k) => (k === i ? { ...x, fb: undefined } : x)));
    else if (value === -1) toast("Merci, l'atelier va regarder cette réponse.");
  };

  const onPhoto = async (f: File | undefined) => {
    if (!f) return;
    try { setPhoto(await compressImage(f)); } catch { toast.error("Impossible de lire cette photo"); }
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <>
      {!open && btn && !inNav && <SkotLauncher variant={btn} onOpen={() => setOpen(true)} />}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Ouvrir SKOT, l'assistant de l'atelier"
          className={`fixed z-40 right-3 md:right-6 bottom-[calc(84px+env(safe-area-inset-bottom))] md:bottom-6 ${inNav || btn ? "hidden md:flex" : "flex"} items-center gap-2 pl-1.5 pr-4 min-h-[52px] bg-[#4A7C59] hover:bg-[#3A6449] text-white shadow-lg`}
          style={{ clipPath: CHAMFER }}
        >
          <span className="bg-white rounded-full grid place-items-center w-10 h-10"><SkotAvatar size={36} /></span>
          <span className="font-display text-xl tracking-wide leading-none">SKOT ?</span>
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-label="SKOT, l'assistant de l'atelier"
          className="fixed z-[60] inset-0 md:inset-auto md:right-0 md:top-16 md:bottom-0 md:w-[400px] flex flex-col bg-[#FAFAF8] md:shadow-[-10px_0_30px_rgba(0,0,0,0.15)]"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="bg-[#1A1A1A] text-white flex items-center gap-3 px-3 py-2" style={{ paddingTop: "max(8px, env(safe-area-inset-top))" }}>
            <span className="bg-white rounded-full grid place-items-center w-12 h-12 shrink-0"><SkotAvatar size={44} thinking={busy} /></span>
            <div className="flex-1 min-w-0">
              <p className="font-display text-2xl leading-none tracking-wide">SKOT <span className="text-[#9BC4A6]">· L'ATELIER</span></p>
              <p className="text-sm text-white/75">Assistant IA — il vérifie tout dans le catalogue</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Fermer" className="w-11 h-11 grid place-items-center text-white/80 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* 24/10 (Nolan) : SKOT a pris la place de la loupe dans la barre du bas → la recherche classique reste à un toucher, ici. */}
          <button
            type="button"
            onClick={() => { setOpen(false); openSpotlight(); }}
            className="mx-3 mt-3 p-[2px] bg-[#1A1A1A] text-left"
            style={{ clipPath: CHAMFER }}
          >
            <span className="flex items-center gap-2.5 min-h-[46px] px-3 bg-white" style={{ clipPath: "polygon(0 0, calc(100% - 11px) 0, 100% 11px, 100% 100%, 0 100%)" }}>
              <Search className="w-5 h-5 shrink-0 text-[#4A7C59]" strokeWidth={2.6} />
              <span className="flex-1 min-w-0 truncate text-[15px] text-[#6B6B6B]">Chercher une pièce…</span>
              <span className="text-xs font-extrabold uppercase italic text-[#4A7C59]">Recherche</span>
            </span>
          </button>

          <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-3" aria-live="polite">
            {msgs.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[85%] bg-[#1A1A1A] text-white text-sm px-3 py-2 whitespace-pre-wrap" style={{ clipPath: CHAMFER_S }}>
                    {m.image && <img src={m.image} alt="Photo envoyée" className="max-h-40 mb-2" />}
                    {m.text}
                  </div>
                </div>
              ) : (
                <div key={i} className="flex gap-2 items-start">
                  <span className="bg-white rounded-full grid place-items-center w-8 h-8 shrink-0 border border-black/5"><SkotAvatar size={28} /></span>
                  <div className="min-w-0 flex-1 space-y-2">
                    <p className="text-sm text-[#1A1A1A] whitespace-pre-wrap border-l-[3px] border-[#4A7C59] pl-2.5">{m.text}</p>
                    {m.cards?.map((c) => <PartCard key={c.slug} card={c} />)}
                    {m.id && (
                      <div className="flex items-center gap-1 text-gray-500">
                        <button type="button" onClick={() => void rate(i, 1)} disabled={!!m.fb} aria-label="Réponse utile" aria-pressed={m.fb === 1}
                          className={`w-11 h-11 grid place-items-center ${m.fb === 1 ? "text-[#4A7C59]" : "hover:text-[#1A1A1A]"} disabled:cursor-default`}>
                          <ThumbsUp className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => void rate(i, -1)} disabled={!!m.fb} aria-label="Réponse pas utile" aria-pressed={m.fb === -1}
                          className={`w-11 h-11 grid place-items-center ${m.fb === -1 ? "text-[#DC2626]" : "hover:text-[#1A1A1A]"} disabled:cursor-default`}>
                          <ThumbsDown className="w-4 h-4" />
                        </button>
                        {m.fb && <span className="text-sm">{m.fb === 1 ? "Merci !" : "Noté, on corrige."}</span>}
                      </div>
                    )}
                  </div>
                </div>
              ),
            )}
            {busy && (
              <div className="flex gap-2 items-center text-sm text-gray-600">
                <span className="bg-white rounded-full grid place-items-center w-8 h-8 border border-black/5"><SkotAvatar size={28} thinking /></span>
                SKOT fouille l'atelier…
              </div>
            )}
          </div>

          <div className="px-3 pt-2 flex gap-2 flex-wrap">
            {["Où en est ma commande ?", "Je veux poser une question à l'atelier"].map((c) => (
              <button key={c} type="button" disabled={busy} onClick={() => void send(c)}
                className="min-h-[44px] px-3 text-sm font-semibold border-[1.5px] border-[#1A1A1A] text-[#1A1A1A] disabled:opacity-50" style={{ clipPath: CHAMFER_S }}>
                {c.startsWith("Où") ? "Ma commande" : "Poser à l'atelier"}
              </button>
            ))}
          </div>

          {photo && (
            <div className="px-3 pt-2 flex items-center gap-2 text-sm text-gray-700">
              <img src={photo.preview} alt="Photo à envoyer" className="w-12 h-12 object-cover" />
              Photo prête à partir
              <button type="button" onClick={() => setPhoto(null)} className="ml-auto underline min-h-[44px]">Retirer</button>
            </div>
          )}

          <form onSubmit={onSubmit} className="flex items-center gap-2 p-3">
            <input ref={fileRef} id="skot-photo" type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => void onPhoto(e.target.files?.[0])} />
            <button type="button" onClick={() => fileRef.current?.click()} aria-label="Envoyer une photo" className="w-11 h-11 grid place-items-center border border-gray-300 bg-white text-[#1A1A1A] shrink-0">
              <Camera className="w-5 h-5" />
            </button>
            <label htmlFor="skot-input" className="sr-only">Ta question</label>
            <input
              id="skot-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={1500}
              placeholder="Écris ta question…"
              className="flex-1 min-w-0 min-h-[44px] px-3 text-base bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#4A7C59]"
            />
            <button type="submit" disabled={busy || (!input.trim() && !photo)} aria-label="Envoyer"
              className="w-11 h-11 grid place-items-center bg-[#4A7C59] hover:bg-[#3A6449] text-white disabled:opacity-50 shrink-0" style={{ clipPath: CHAMFER_S }}>
              {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default SkotWidget;
