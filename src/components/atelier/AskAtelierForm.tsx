import { useState } from "react";
import { Loader2, Send, CheckCircle2 } from "lucide-react";
import { askAtelier } from "@/lib/atelier";

const GREEN = "#4A7C59";
const CARBON = "#1A1A1A";

/* Formulaire « Pose ta question à l'atelier » (24/10/2026). La question part en base (ask_atelier) et
   n'est publiée qu'après la réponse de l'atelier. Anti-spam géré par la base. */
const AskAtelierForm = ({ scooterSlug, scooterName }: { scooterSlug?: string | null; scooterName?: string | null }) => {
  const [question, setQuestion] = useState("");
  const [trott, setTrott] = useState(scooterName ?? "");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (question.trim().length < 10) { setErr("Décris ton souci en une ou deux phrases (10 caractères minimum)."); return; }
    setState("sending");
    const fixedSlug = scooterName && trott.trim() === scooterName ? scooterSlug : null;
    const msg = await askAtelier({ question: question.trim(), scooterSlug: fixedSlug, scooterName: trott.trim() || null, email: email.trim() || null });
    if (msg) { setErr(msg); setState("idle"); return; }
    setState("sent");
  };

  if (state === "sent") {
    return (
      <div className="rounded-2xl bg-white p-5 shadow-md" role="status">
        <p className="flex items-center gap-2 text-base font-bold" style={{ color: GREEN }}>
          <CheckCircle2 className="w-5 h-5" aria-hidden /> Question reçue par l'atelier
        </p>
        <p className="mt-2 text-sm text-gray-600">
          On te répond sous 48 h. La réponse sera publiée ici dans « Les dernières réponses de l'atelier »{email.trim() ? " ; si besoin, on t'écrit aussi à l'adresse donnée" : ""}.
        </p>
        <button type="button" onClick={() => { setQuestion(""); setState("idle"); }} className="mt-3 min-h-[44px] text-sm font-bold underline underline-offset-4" style={{ color: CARBON }}>
          Poser une autre question
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl bg-white p-4 md:p-5 shadow-md space-y-3" noValidate>
      <label className="block">
        <span className="text-sm font-bold" style={{ color: CARBON }}>Ta trottinette</span>
        <input value={trott} onChange={(e) => setTrott(e.target.value)} maxLength={120} placeholder="Ex. Xiaomi 4 Pro, Ninebot G30…"
          className="mt-1 w-full min-h-[44px] px-3 rounded-lg border border-gray-300 bg-white text-base focus:outline-none focus:ring-2 focus:ring-green-600" />
      </label>
      <label className="block">
        <span className="text-sm font-bold" style={{ color: CARBON }}>Ta question</span>
        <textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={4} maxLength={1000} required
          placeholder="Ex. Mon frein arrière couine depuis que j'ai changé les plaquettes, c'est normal ?"
          className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-base focus:outline-none focus:ring-2 focus:ring-green-600" />
      </label>
      <label className="block">
        <span className="text-sm font-bold" style={{ color: CARBON }}>Ton email <span className="font-normal text-gray-500">(facultatif, si on doit te demander une précision — jamais affiché)</span></span>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={200} autoComplete="email"
          className="mt-1 w-full min-h-[44px] px-3 rounded-lg border border-gray-300 bg-white text-base focus:outline-none focus:ring-2 focus:ring-green-600" />
      </label>
      {err && <p className="text-sm font-semibold text-[#DC2626]" role="alert">{err}</p>}
      <button type="submit" disabled={state === "sending"}
        className="w-full sm:w-auto min-h-[48px] px-6 rounded-lg font-semibold text-white bg-green-700 hover:bg-green-800 disabled:opacity-60 inline-flex items-center justify-center gap-2">
        {state === "sending" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Envoyer à l'atelier
      </button>
      <p className="text-sm text-gray-500">Réponse sous 48 h par un réparateur. Les questions sur le débridage ne sont pas publiées : c'est interdit sur la voie publique.</p>
    </form>
  );
};

export default AskAtelierForm;
