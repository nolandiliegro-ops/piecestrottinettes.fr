/* Désinscription d'une alerte de prix (lien du mail send-price-alerts, 24/10/2026).
   Appelle public.unsubscribe_price_alert(token) : désactive l'alerte, renvoie le nom de la trottinette. */
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
import { laName } from "@/lib/article";

const UNB = "'Unbounded', sans-serif";

export default function PriceAlertStop() {
  const [params] = useSearchParams();
  const token = params.get("t") ?? "";
  const [state, setState] = useState<"wait" | "done" | "bad">("wait");
  const [name, setName] = useState("");

  useEffect(() => {
    if (!/^[0-9a-f-]{36}$/i.test(token)) { setState("bad"); return; }
    void (supabase as unknown as { rpc: (f: string, a: object) => Promise<{ data: string | null; error: unknown }> })
      .rpc("unsubscribe_price_alert", { p_token: token })
      .then(({ data, error }) => {
        if (error || !data) { setState("bad"); return; }
        setName(data); setState("done");
      });
  }, [token]);

  return (
    <main className="min-h-screen px-4 py-16" style={{ backgroundColor: "#F5F0E8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <SEO title="Alerte de prix" description="Gestion de ton alerte de prix." noindex />
      <div className="mx-auto max-w-xl bg-white p-6 lg:p-8 grid gap-4" style={{ clipPath: "polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 0 100%)" }}>
        <h1 className="text-2xl uppercase" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: "#1A1A1A" }}>Alerte de prix</h1>
        {state === "wait" && <p className="text-base text-gray-600">Un instant…</p>}
        {state === "done" && <p className="text-base text-[#374151]">C'est fait : tu ne recevras plus d'alerte de prix pour {laName(name)}.</p>}
        {state === "bad" && <p className="text-base text-[#374151]">Ce lien n'est pas valide ou a déjà servi. Si tu reçois encore des mails, réponds à l'un d'eux et on arrête tout.</p>}
        <Link to="/trottinettes" className="inline-flex items-center justify-center min-h-[48px] px-6 text-sm font-extrabold uppercase tracking-wider text-white bg-[#4A7C59] hover:bg-[#3A6449]">Voir les trottinettes</Link>
      </div>
    </main>
  );
}
