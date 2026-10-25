/**
 * Garage v3 — « Commandes » refaites (25/10/2026) : une carte par commande, l'avancement en frise,
 * les articles en photo, le suivi du colis, « Racheter » (remet les articles au panier) et
 * « Une question ? » (ouvre SKOT sur la commande). Les échanges avec la boutique restent lisibles dessous.
 */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { Check, ChevronDown, ExternalLink, MessageCircle, RotateCcw, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { SHOP_OPEN, openPrelaunch } from "@/config/launch";
import { carrierLabel, trackingLink } from "@/lib/tracking";
import { useOrderConversations } from "@/hooks/useOrderMessages";
import GarageMessages from "../GarageMessages";
import { ScreenTitle, Box, BoxTitle, FONT, UNB, CARBON, GREEN, LINE, MUTED, cut } from "./ui";

interface Order {
  id: string;
  order_number: string;
  status: string;
  created_at: string;
  total_ttc: number;
  delivery_method: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  carrier: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  delivery_estimate: string | null;
  retrait_prevu: string | null;
}
interface Item { id: string; part_id: string | null; part_name: string; part_image_url: string | null; quantity: number; unit_price: number; line_total: number }

const STEPS = [
  { key: "paid", label: "Payée" },
  { key: "processing", label: "Préparée" },
  { key: "shipped", label: "Expédiée" },
  { key: "delivered", label: "Livrée" },
];
const STATUS_LABEL: Record<string, string> = {
  awaiting_payment: "Paiement en attente",
  pending: "En attente",
  paid: "Payée",
  processing: "En préparation",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};
const eur = (n: number) => `${Number(n).toFixed(2).replace(".", ",")} €`;

const Frise = ({ status }: { status: string }) => {
  if (status === "cancelled") return <p className="text-sm font-bold" style={{ color: "#DC2626" }}>Commande annulée</p>;
  if (status === "awaiting_payment" || status === "pending") return <p className="text-sm font-bold" style={{ color: "#B45309" }}>Paiement pas encore reçu</p>;
  const idx = STEPS.findIndex((s) => s.key === status);
  return (
    <ol className="grid grid-cols-4 gap-1" aria-label={`Étape : ${STATUS_LABEL[status] ?? status}`}>
      {STEPS.map((s, i) => {
        const done = i <= idx;
        return (
          <li key={s.key} className="grid gap-1.5">
            <span className="h-1.5" style={{ background: done ? GREEN : LINE }} />
            <span className="flex items-center gap-1 text-sm font-bold" style={{ color: done ? CARBON : MUTED }}>
              {done && <Check className="w-3.5 h-3.5 shrink-0" style={{ color: GREEN }} />}{s.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
};

const OrderCard = ({ order }: { order: Order }) => {
  const navigate = useNavigate();
  const { addItem, setIsOpen } = useCart();
  const [open, setOpen] = useState(false);
  const { data: items = [] } = useQuery({
    queryKey: ["v3-order-items", order.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("order_items").select("id, part_id, part_name, part_image_url, quantity, unit_price, line_total").eq("order_id", order.id);
      if (error) throw error;
      return (data ?? []) as Item[];
    },
  });
  const link = trackingLink(order);
  const carrier = carrierLabel(order.carrier);

  const racheter = async () => {
    if (!SHOP_OPEN) { openPrelaunch(); return; }
    const ids = items.map((i) => i.part_id).filter(Boolean) as string[];
    if (!ids.length) return;
    const { data: parts } = await supabase.from("parts").select("id, name, price, image_url, stock_quantity, published").in("id", ids);
    let n = 0;
    for (const it of items) {
      const p = parts?.find((x) => x.id === it.part_id);
      if (!p || !p.published || p.price == null || p.stock_quantity === 0) continue;
      addItem({ id: p.id, name: p.name, price: Number(p.price), image_url: p.image_url, stock_quantity: p.stock_quantity ?? 0 });
      n++;
    }
    if (n) toast.success(`${n} article${n > 1 ? "s" : ""} remis au panier`, { action: { label: "Voir le panier", onClick: () => setIsOpen(true) } });
    else toast.info("Ces articles ne sont plus disponibles");
  };

  return (
    <Box pad="p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-[17px] uppercase" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: CARBON }}>N° {order.order_number}</p>
        <p className="text-sm" style={{ color: MUTED }}>{format(new Date(order.created_at), "d MMMM yyyy", { locale: fr })} · <b style={{ color: CARBON }}>{eur(order.total_ttc)}</b></p>
      </div>
      <div className="mt-3"><Frise status={order.status} /></div>

      {/* Articles en photo */}
      <div className="mt-3 flex gap-2 overflow-x-auto [scrollbar-width:none]">
        {items.map((it) => (
          <span key={it.id} className="relative w-16 h-16 shrink-0 inline-flex items-center justify-center bg-white" style={{ clipPath: cut(6), boxShadow: `inset 0 0 0 1px ${LINE}` }} title={it.part_name}>
            {it.part_image_url ? <img src={it.part_image_url} alt="" loading="lazy" className="max-w-[86%] max-h-[86%] object-contain" /> : <Package className="w-6 h-6" style={{ color: MUTED }} />}
            {it.quantity > 1 && <span className="absolute right-0 bottom-0 px-1 text-sm font-black text-white" style={{ background: CARBON }}>×{it.quantity}</span>}
          </span>
        ))}
      </div>

      {(order.tracking_number || order.retrait_prevu) && (
        <p className="mt-3 text-[15px]" style={{ color: CARBON }}>
          {order.retrait_prevu ? <>Retrait prévu : <b>{order.retrait_prevu}</b></> : <>Suivi {carrier ? `${carrier} ` : ""}: <b>{order.tracking_number}</b></>}
          {link && <a href={link} target="_blank" rel="noopener noreferrer" className="ml-2 inline-flex items-center gap-1 font-bold underline" style={{ color: GREEN }}>Suivre le colis <ExternalLink className="w-4 h-4" /></a>}
        </p>
      )}

      <div className="mt-3 grid grid-cols-2 sm:flex gap-2">
        <button type="button" onClick={racheter} disabled={!items.length} className="min-h-[44px] px-4 inline-flex items-center justify-center gap-2 text-sm font-extrabold text-white disabled:opacity-50" style={{ background: "#FF6600", clipPath: cut(8) }}>
          <RotateCcw className="w-4 h-4" /> Racheter
        </button>
        <button type="button" onClick={() => navigate(`/garage/skot?commande=${encodeURIComponent(order.order_number)}`)} className="min-h-[44px] px-4 inline-flex items-center justify-center gap-2 text-sm font-extrabold" style={{ background: "#FFFFFF", color: CARBON, clipPath: cut(8), boxShadow: `inset 0 0 0 1px ${LINE}` }}>
          <MessageCircle className="w-4 h-4" /> Une question ?
        </button>
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="col-span-2 sm:ml-auto min-h-[44px] px-2 inline-flex items-center justify-center gap-1 text-sm font-bold" style={{ color: CARBON }}>
          Détail <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {open && (
        <ul className="mt-2 grid" style={{ borderTop: `1px solid ${LINE}` }}>
          {items.map((it) => (
            <li key={it.id} className="flex items-center gap-3 py-2" style={{ borderBottom: `1px solid ${LINE}` }}>
              <span className="min-w-0 flex-1 text-[15px]" style={{ color: CARBON }}>{it.quantity} × {it.part_name}</span>
              <span className="text-[15px] font-bold tabular-nums">{eur(it.line_total)}</span>
            </li>
          ))}
          <li className="py-2 text-sm" style={{ color: MUTED }}>{order.delivery_method === "retrait" ? "Retrait en boutique" : "Livraison"} · statut : {STATUS_LABEL[order.status] ?? order.status}</li>
        </ul>
      )}
    </Box>
  );
};

const CommandesSection = () => {
  const { user } = useAuth();
  const { data: convs = [] } = useOrderConversations();
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["v3-orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      // Rattache les commandes passées en invité avec le même email vérifié (comme l'historique précédent).
      try { await supabase.rpc("link_guest_orders" as never); } catch { /* sans effet sur l'affichage */ }
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, status, created_at, total_ttc, delivery_method, tracking_number, tracking_url, carrier, shipped_at, delivered_at, delivery_estimate, retrait_prevu")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Order[];
    },
  });

  return (
    <div>
      <ScreenTitle kicker="Mes commandes" title="Commandes">Où en est chaque colis, et un clic pour racheter les mêmes pièces.</ScreenTitle>
      <div className="grid gap-3">
        {isLoading && <div className="h-40 animate-pulse" style={{ background: "rgba(250,250,248,0.2)" }} />}
        {!isLoading && orders.length === 0 && (
          <Box>
            <BoxTitle>Pas encore de commande</BoxTitle>
            <p className="mt-2 text-[15px]" style={{ color: "#374151" }}>Tes commandes apparaîtront ici, avec leur suivi.</p>
            <Link to="/garage/trotts" className="mt-3 inline-flex items-center min-h-[48px] px-4 text-[15px] font-extrabold text-white" style={{ background: CARBON, clipPath: cut(10), fontFamily: FONT }}>Voir les pièces pour ma trott</Link>
          </Box>
        )}
        {orders.map((o) => <OrderCard key={o.id} order={o} />)}
      </div>

      {convs.length > 0 && (
        <div className="mt-8">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.14em] text-white" style={{ fontFamily: FONT, textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}>Échanges avec la boutique</p>
          <Box pad="p-2 lg:p-3"><GarageMessages /></Box>
        </div>
      )}
    </div>
  );
};

export default CommandesSection;
