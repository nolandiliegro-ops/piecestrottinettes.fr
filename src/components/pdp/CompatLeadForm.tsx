import { useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useScooterModels } from "@/hooks/useScooterData";
import { useSelectedScooter } from "@/contexts/ScooterContext";
import { scooterLabel, scooterLabelShort } from "@/lib/scooterLabel";

interface CompatLeadFormProps {
  partId: string;
  partName?: string;
}

interface Picked {
  id: string;
  name: string;
  slug: string;
  brand: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MODEL_MAX = 120; // part_leads_modele_libre_len

const FIELD =
  "w-full h-12 rounded-xl border border-carbon/15 bg-white px-3 text-base text-carbon " +
  "placeholder:text-carbon/35 outline-none focus:ring-2 focus:ring-carbon/30";

/**
 * LOT 2 PDP — capture de lead de compatibilité sur place (plus de détour par
 * /contact). Insert direct dans part_leads : la policy SELECT est admin-only,
 * donc jamais de .select() après l'insert, le succès = absence d'error.
 */
export default function CompatLeadForm({ partId, partName }: CompatLeadFormProps) {
  const { user } = useAuth();
  const { selectedScooter } = useSelectedScooter();
  const { data: models = [] } = useScooterModels();

  const [picked, setPicked] = useState<Picked | null>(
    selectedScooter
      ? {
          id: selectedScooter.id,
          name: selectedScooter.name,
          slug: selectedScooter.slug,
          brand: selectedScooter.brandName,
        }
      : null,
  );
  const [typed, setTyped] = useState(
    selectedScooter ? scooterLabel(selectedScooter.brandName, selectedScooter.name) : "",
  );
  const [email, setEmail] = useState(user?.email ?? "");
  const [focused, setFocused] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const q = typed.trim().toLowerCase();
  const suggestions =
    focused && q && !picked
      ? models
          .filter((m) => `${m.brand?.name ?? ""} ${m.name}`.toLowerCase().includes(q))
          .slice(0, 8)
      : [];

  const modelOk = Boolean(picked) || q.length > 0; // part_leads_modele_present
  const emailOk = EMAIL_RE.test(email.trim());
  const canSend = modelOk && emailOk && !sending;

  const modelLabel = picked ? scooterLabel(picked.brand, picked.name) : typed.trim();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    setSending(true);
    setError(null);

    const { error: err } = await supabase.from("part_leads").insert({
      part_id: partId,
      scooter_model_id: picked?.id ?? null,
      modele_libre: picked ? null : typed.trim(),
      email: email.trim(),
      user_id: user?.id ?? null,
    });

    // 23505 = même pièce/email/modèle déjà demandé : c'est un succès pour lui.
    if (err && err.code !== "23505") {
      console.error("part_leads insert failed:", err.code, err.message);
      setError(
        err.code === "23514"
          ? "Vérifie ton email et ta trottinette."
          : "Ça n'a pas marché. Réessaie ou écris-nous via la page contact.",
      );
      setSending(false);
      return;
    }

    setSending(false);
    setDone(true);

    // Notif atelier : fire-and-forget, jamais bloquante.
    void supabase.functions
      .invoke("send-contact-email", {
        body: {
          name: "Lead compatibilite",
          email: email.trim(),
          subject: `Compatibilite - ${partName ?? partId}`,
          message: `Trottinette : ${modelLabel}\nEmail : ${email.trim()}`,
          ...(user?.id ? { user_id: user.id } : {}),
        },
      })
      .catch(() => {});
  };

  if (done) {
    return (
      <div className="w-full mt-4 flex flex-col items-center text-center">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-carbon flex-shrink-0" />
          <p className="font-display text-xl uppercase tracking-wide text-carbon">C'est noté</p>
        </div>
        <p className="text-sm text-carbon/60 mt-1">Réponse sous 2 h</p>
        {picked?.slug && (
          <Link
            to={`/scooter/${picked.slug}`}
            className="mt-3 w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl bg-carbon px-4 text-white text-sm font-semibold hover:bg-black active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-carbon focus-visible:ring-offset-2"
          >
            <span className="truncate">
              Pièces vérifiées · {scooterLabelShort(picked.brand, picked.name)}
            </span>
            <ArrowRight className="w-4 h-4 flex-shrink-0" />
          </Link>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="w-full mt-4 space-y-2.5 text-left" noValidate>
      <div className="relative">
        <input
          type="text"
          value={typed}
          maxLength={MODEL_MAX}
          onChange={(e) => {
            setTyped(e.target.value);
            setPicked(null);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder="Ta trottinette (marque + modèle)"
          aria-label="Ta trottinette"
          autoComplete="off"
          className={FIELD}
        />
        {suggestions.length > 0 && (
          <ul className="absolute z-10 left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-xl border border-carbon/15 bg-white shadow-lg">
            {suggestions.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setPicked({ id: m.id, name: m.name, slug: m.slug, brand: m.brand?.name ?? "" });
                    setTyped(scooterLabel(m.brand?.name, m.name));
                    setFocused(false);
                  }}
                  className="w-full min-h-[44px] flex items-center gap-2 px-3 text-left text-sm text-carbon hover:bg-carbon/5"
                >
                  <span className="rounded-md bg-carbon/10 px-1.5 py-0.5 text-sm font-bold uppercase tracking-wide">
                    {m.brand?.name ?? "?"}
                  </span>
                  <span>{scooterLabelShort(m.brand?.name, m.name)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {q && !picked && suggestions.length === 0 && (
        <p className="text-sm text-carbon/60 leading-snug">
          Pas dans notre liste : on garde « {typed.trim()} » tel quel.
        </p>
      )}

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Ton email"
        aria-label="Ton email"
        autoComplete="email"
        maxLength={255}
        className={FIELD}
      />

      {error && (
        <p role="alert" className="text-sm font-semibold text-red-700 leading-snug">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSend}
        className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl bg-carbon text-white font-display text-base uppercase tracking-widest hover:bg-black disabled:opacity-40 disabled:hover:bg-carbon active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-carbon focus-visible:ring-offset-2"
      >
        {sending ? "Envoi…" : "Demander une vérification"}
        {!sending && <ArrowRight className="w-4 h-4" />}
      </button>
    </form>
  );
}
