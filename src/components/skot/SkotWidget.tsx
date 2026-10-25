// Widget SKOT — la mascotte patinette (choix de Nolan, 25/10/2026) : fenêtre « Il te parle » (SkotPanel),
// lanceur « Surgit du bord » sur ordinateur (SkotDesktopLauncher), tête rangée dans la barre du bas sur téléphone (MobileNavProposals).
// Visible seulement si skotEnabled() (interrupteur SKOT_PUBLIC ou ?skot=1), jamais au panier, au paiement ni dans l'admin.
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useSpotlight } from "@/contexts/SpotlightContext";
import { readBarreBasVariant } from "@/components/navigation/MobileNavProposals";
import SkotDesktopLauncher from "./SkotDesktopLauncher";
import SkotGarageLauncher from "./SkotGarageLauncher";
import SkotPanel, { SKOT_GREETING_V2 } from "./SkotPanel";
import { askSkot, compressImage, sendSkotFeedback, skotEnabled, skotHiddenOn, skotPageContext, type SkotCard } from "@/lib/skot";
import { useCart } from "@/hooks/useCart";
import { SHOP_OPEN, openPrelaunch } from "@/config/launch";
import { formatPrice } from "@/lib/formatPrice";
import { toast } from "sonner";

const CHAMFER = "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)";
const CHAMFER_S = "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)";

type Msg = { role: "user" | "skot"; text: string; cards?: SkotCard[]; image?: string; id?: string | null; conv?: string; fb?: 1 | -1 };

/** Trottinette conseillée par SKOT : fiche + offre partenaire (lien sponsorisé, nouvel onglet). */
const ScooterCard = ({ card }: { card: SkotCard }) => (
  <div className="bg-white p-3 flex gap-3" style={{ clipPath: CHAMFER, borderBottom: "3px solid #1A1A1A" }}>
    {card.image_url && <img src={card.image_url} alt="" className="w-20 h-20 object-contain shrink-0" loading="lazy" />}
    <div className="min-w-0 flex-1 space-y-1">
      <Link to={`/scooter/${card.slug}`} className="block text-sm font-semibold text-[#1A1A1A] leading-snug hover:underline">{card.name}</Link>
      <p className="text-sm text-gray-600">
        {[card.range_km ? `${card.range_km} km annoncés` : null, card.weight_kg ? `${card.weight_kg} kg` : null, card.max_speed_kmh ? `${Math.min(card.max_speed_kmh, 25)} km/h sur route` : null].filter(Boolean).join(" · ")}
      </p>
      <div className="flex items-center justify-between gap-2">
        <span className="text-base font-extrabold text-[#1A1A1A]">{card.price ? formatPrice(card.price) : "Prix chez le vendeur"}</span>
        {card.offer_url ? (
          <a href={card.offer_url} target="_blank" rel="sponsored noopener noreferrer"
            className="inline-flex items-center min-h-[44px] px-3 text-sm font-bold text-white bg-[#FF6600] hover:bg-[#E65C00]" style={{ clipPath: CHAMFER_S }}>
            Voir l'offre
          </a>
        ) : (
          <Link to={`/scooter/${card.slug}`} className="inline-flex items-center min-h-[44px] px-3 text-sm font-bold border-[1.5px] border-[#1A1A1A] text-[#1A1A1A]" style={{ clipPath: CHAMFER_S }}>
            La fiche
          </Link>
        )}
      </div>
      {card.offer_url && <p className="text-sm text-gray-500">Lien partenaire{card.offer_host ? ` · ${card.offer_host}` : ""}</p>}
    </div>
  </div>
);

const PartCard = ({ card }: { card: SkotCard }) => {
  const { addItem, setIsOpen } = useCart();
  const add = () => {
    if (!SHOP_OPEN) { openPrelaunch(); return; }
    if (!card.in_stock) return;
    addItem({ id: card.id ?? card.slug, name: card.name, price: card.price ?? 0, image_url: card.image_url, stock_quantity: card.stock_quantity ?? 1 });
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
          <span className="text-base font-extrabold text-[#1A1A1A]">{formatPrice(card.price ?? 0)}</span>
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
  const [msgs, setMsgs] = useState<Msg[]>(() => [{ role: "skot", text: SKOT_GREETING_V2 }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [photo, setPhoto] = useState<{ media_type: string; data: string; preview: string } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // La barre du bas avec SKOT (?barrebas=5, défaut quand SKOT est public) ouvre SKOT par cet événement et remplace la bulle flottante.
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("skot:open", onOpen);
    return () => window.removeEventListener("skot:open", onOpen);
  }, []);
  const [inNav] = useState(() => readBarreBasVariant() === 5);
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
      {/* Ordinateur : la mascotte qui surgit du bord droit (25/10). */}
      {/* Garage, ordinateur (25/10) : SKOT à gauche, plus gros, animé ; pas sur l'écran SKOT du garage (la discussion y est déjà). */}
      {!open && (pathname.startsWith("/garage") ? (
        <>
          <div className="lg:hidden"><SkotDesktopLauncher onOpen={() => setOpen(true)} /></div>
          {!pathname.startsWith("/garage/skot") && <SkotGarageLauncher onOpen={() => setOpen(true)} />}
        </>
      ) : (
        <SkotDesktopLauncher onOpen={() => setOpen(true)} />
      ))}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Ouvrir SKOT, l'assistant de l'atelier"
          className={`fixed z-40 right-3 md:right-6 bottom-[calc(84px+env(safe-area-inset-bottom))] md:bottom-6 ${inNav ? "hidden" : "flex"} md:hidden items-center gap-2 pl-1.5 pr-4 min-h-[52px] bg-[#4A7C59] hover:bg-[#3A6449] text-white shadow-lg`}
          style={{ clipPath: CHAMFER }}
        >
          <span className="bg-white rounded-full grid place-items-center w-10 h-10 overflow-hidden"><img src="/skot/tete-ecoute.webp" alt="" className="w-full h-full object-cover" style={{ transform: "scale(1.15) translateY(6%)" }} /></span>
          <span className="font-display text-xl tracking-wide leading-none">SKOT ?</span>
        </button>
      )}

      {open && (
        <>
          <input ref={fileRef} id="skot-photo" type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => void onPhoto(e.target.files?.[0])} />
          <SkotPanel
            msgs={msgs} busy={busy} input={input} setInput={setInput} onSubmit={onSubmit}
            send={(t) => void send(t)} onClose={() => setOpen(false)} onSearch={() => { setOpen(false); openSpotlight(); }}
            pickPhoto={() => fileRef.current?.click()} photo={photo} clearPhoto={() => setPhoto(null)}
            rate={(i, v) => void rate(i, v)} listRef={listRef} renderCard={(c) => (c.type === "scooter" ? <ScooterCard card={c} /> : <PartCard card={c} />)}
          />
        </>
      )}

    </>
  );
};

export default SkotWidget;
