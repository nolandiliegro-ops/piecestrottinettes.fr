import { FormEvent, MouseEvent, useState } from "react";
import { Bell, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface StockAlertInlineProps {
  part: { id: string };
}

type Status = "idle" | "sending" | "done" | "error";

// Validation email volontairement permissive (le vrai contrôle reste côté serveur).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Capture email "alerte retour stock" pour une carte en rupture (SB4d).
 * State 100% LOCAL : chaque carte monte sa propre instance, donc le statut
 * "Inscrit" ne fuite jamais d'une carte à l'autre.
 * La carte étant dans un <Link>, chaque handler stoppe la propagation/navigation.
 */
export default function StockAlertInline({ part }: StockAlertInlineProps) {
  const { user } = useAuth();
  const [status, setStatus] = useState<Status>("idle");
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(user?.email ?? "");

  const stop = (e: MouseEvent | FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleOpen = (e: MouseEvent) => {
    stop(e);
    setOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    stop(e);
    if (status === "sending") return;

    const cleanEmail = email.trim().toLowerCase();
    if (!EMAIL_RE.test(cleanEmail)) {
      toast.error("Email invalide");
      return;
    }

    setStatus("sending");
    // INSERT simple (pas .upsert) : l'anon a INSERT (WITH CHECK true) mais pas SELECT,
    // or ON CONFLICT/upsert exige plus de droits → 401. Pas de .select() non plus.
    const { error } = await supabase.from("stock_alerts").insert({
      part_id: part.id,
      email: cleanEmail,
      user_id: user?.id ?? null,
    });

    // 23505 = violation de l'index unique (part_id,email) : déjà inscrit ⇒ succès.
    if (error && error.code !== "23505") {
      setStatus("error");
      toast.error("Erreur, réessaie");
      return;
    }

    setStatus("done");
    toast.success("On te prévient dès le retour 🔔");
  };

  // État final : confirmation discrète, non cliquable.
  if (status === "done") {
    return (
      <div
        className="relative z-10 mt-3 min-h-[44px] w-full flex items-center justify-center gap-2 rounded-xl bg-[#4A7C59]/10 text-[#4A7C59] border border-[#4A7C59]/30 font-bold text-sm"
        aria-live="polite"
      >
        <Check className="w-4 h-4" />
        <span>Inscrit 🔔</span>
      </div>
    );
  }

  // Bouton initial.
  if (!open) {
    return (
      <button
        type="button"
        onClick={handleOpen}
        className="relative z-10 mt-3 min-h-[44px] w-full flex items-center justify-center gap-2 rounded-xl bg-[#4A7C59]/10 hover:bg-[#4A7C59]/15 text-[#4A7C59] border border-[#4A7C59]/30 font-bold text-sm transition-all duration-200 active:scale-[0.97]"
      >
        <Bell className="w-4 h-4" />
        <span>Me prévenir du retour</span>
      </button>
    );
  }

  // Mode formulaire : champ email + bouton valider.
  const sending = status === "sending";
  return (
    <form onSubmit={handleSubmit} className="relative z-10 mt-3 flex items-center gap-2">
      <input
        type="email"
        inputMode="email"
        autoComplete="email"
        maxLength={120}
        required
        value={email}
        onClick={stop}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="ton@email.fr"
        disabled={sending}
        autoFocus
        className="min-h-[44px] flex-1 min-w-0 rounded-xl border border-[#4A7C59]/30 bg-white px-3 text-sm text-[#1A1A1A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4A7C59] disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={sending}
        aria-label="Valider mon alerte retour stock"
        className="min-h-[44px] min-w-[44px] shrink-0 flex items-center justify-center rounded-xl bg-[#4A7C59] hover:bg-[#3A6449] text-white font-bold text-sm transition-all duration-200 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {sending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Check className="w-4 h-4" />
        )}
      </button>
    </form>
  );
}
