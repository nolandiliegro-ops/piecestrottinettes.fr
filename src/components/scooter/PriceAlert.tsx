/* Alerte de prix des trottinettes (24/10/2026, robot de prix — claude/robot-prix-plan.md).
   Inscription par la fonction public.subscribe_price_alert (security definer : email validé, fiche publiée,
   anti-spam en base ; aucun email n'est lisible côté public). Mail envoyé la nuit par send-price-alerts quand le
   prix baisse d'au moins 5 € et 1 %, ou quand un premier prix est relevé (fiches sans vendeur). Désinscription
   par le lien du mail (/alerte-prix/stop). */
import { FormEvent, useId, useState } from "react";
import { Bell, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { laName } from "@/lib/article";
import { useBuyCtx } from "@/components/scooter/BuyProposals";

const UNB = "'Unbounded', sans-serif";
const FONT = "'Plus Jakarta Sans', sans-serif";
const CARBON = "#1A1A1A";
const GREEN = "#4A7C59";
const LINE = "#E7E1D6";
const CHAMFER_L = "polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 0 100%)";

const MESSAGES: Record<string, string> = {
  email_invalide: "Cette adresse mail n'est pas valide.",
  fiche_inconnue: "Cette trottinette n'est plus suivie.",
  trop: "Tu suis déjà beaucoup de trottinettes avec cette adresse.",
  occupe: "Trop d'inscriptions en ce moment, réessaie dans une heure.",
};

export const PriceAlertForm = ({ label = "Préviens-moi si le prix baisse" }: { label?: string }) => {
  const { scooterId } = useBuyCtx();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(user?.email ?? "");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const ids = { email: useId(), consent: useId() };

  if (!scooterId) return null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (state === "sending") return;
    if (!consent) { setError("Coche la case pour recevoir l'alerte."); return; }
    setState("sending"); setError(null);
    // Fonction hors des types générés : cast local.
    const { data, error: err } = await (supabase as unknown as { rpc: (f: string, a: object) => Promise<{ data: string | null; error: unknown }> })
      .rpc("subscribe_price_alert", { p_scooter_id: scooterId, p_email: email });
    if (err || data !== "ok") {
      setState("idle");
      setError(MESSAGES[data ?? ""] ?? "L'inscription n'est pas passée, réessaie.");
      return;
    }
    setState("done");
  };

  if (state === "done") return (
    <p className="inline-flex items-center gap-2 min-h-[44px] px-4 text-sm font-bold" style={{ color: GREEN, boxShadow: `inset 0 0 0 1.5px ${GREEN}`, fontFamily: FONT }} aria-live="polite">
      <Check className="w-4 h-4" /> C'est noté : on t'écrit dès que le prix bouge.
    </p>
  );

  if (!open) return (
    <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 min-h-[44px] px-4 text-sm font-bold bg-white"
      style={{ color: CARBON, boxShadow: `inset 0 0 0 1.5px ${CARBON}`, fontFamily: FONT }}>
      <Bell className="w-4 h-4" /> {label}
    </button>
  );

  return (
    <form onSubmit={submit} className="w-full max-w-xl grid gap-2" style={{ fontFamily: FONT }}>
      <label htmlFor={ids.email} className="text-sm font-bold" style={{ color: CARBON }}>Ton adresse mail</label>
      <div className="flex gap-2">
        <input id={ids.email} type="email" inputMode="email" autoComplete="email" required maxLength={120} autoFocus
          value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ton@email.fr" disabled={state === "sending"}
          className="min-h-[48px] flex-1 min-w-0 px-3 text-base bg-white focus:outline-none focus:ring-2 focus:ring-[#4A7C59]"
          style={{ boxShadow: `inset 0 0 0 1.5px ${LINE}`, color: CARBON }} />
        <button type="submit" disabled={state === "sending"} className="min-h-[48px] px-5 shrink-0 inline-flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-white disabled:opacity-60"
          style={{ background: CARBON }}>
          {state === "sending" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />} Valider
        </button>
      </div>
      <label htmlFor={ids.consent} className="flex items-start gap-2 text-sm text-gray-600 min-h-[44px] cursor-pointer">
        <input id={ids.consent} type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 w-5 h-5 shrink-0 accent-[#4A7C59]" />
        <span>J'accepte de recevoir un mail quand le prix de cette trottinette baisse. Un lien dans chaque mail permet d'arrêter.</span>
      </label>
      {error && <p className="text-sm font-bold" style={{ color: "#DC2626" }} role="alert">{error}</p>}
    </form>
  );
};

/** Fiche sans vendeur partenaire : pas de cul-de-sac, on propose d'être prévenu au premier prix relevé. */
export const NoOfferBlock = ({ name }: { name: string }) => (
  <div id="ou-acheter" className="mt-10 scroll-mt-24" style={{ fontFamily: FONT }}>
    <h2 className="text-xl lg:text-2xl uppercase" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: CARBON }}>Où acheter {laName(name)}</h2>
    <div className="mt-3 p-5 lg:p-7 bg-white grid gap-4" style={{ clipPath: CHAMFER_L, boxShadow: `inset 0 0 0 1px ${LINE}` }}>
      <p className="text-base text-[#374151] leading-relaxed max-w-2xl">
        On n'a pas encore de vendeur qu'on recommande pour cette trottinette. Laisse ton mail : on te prévient dès qu'on relève un prix chez une boutique sérieuse.
      </p>
      <PriceAlertForm label="Préviens-moi dès qu'un prix est relevé" />
    </div>
  </div>
);
