import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type OAuthNamespace = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: any }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: any }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: any }>;
};

function oauth(): OAuthNamespace {
  return (supabase.auth as unknown as { oauth: OAuthNamespace }).oauth;
}

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Paramètre authorization_id manquant.");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/login?returnTo=" + encodeURIComponent(next);
        return;
      }
      try {
        const { data, error } = await oauth().getAuthorizationDetails(authorizationId);
        if (!active) return;
        if (error) {
          setError(error.message || "Impossible de charger cette demande d'autorisation.");
          return;
        }
        const immediate = data?.redirect_url ?? data?.redirect_to;
        if (immediate && !data?.client) {
          window.location.href = immediate;
          return;
        }
        setDetails(data);
      } catch (e: any) {
        setError(e?.message || "Erreur inattendue.");
      }
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    try {
      const { data, error } = approve
        ? await oauth().approveAuthorization(authorizationId)
        : await oauth().denyAuthorization(authorizationId);
      if (error) {
        setBusy(false);
        setError(error.message || "Échec de la décision.");
        return;
      }
      const target = data?.redirect_url ?? data?.redirect_to;
      if (!target) {
        setBusy(false);
        setError("Le serveur d'autorisation n'a pas renvoyé d'URL de redirection.");
        return;
      }
      window.location.href = target;
    } catch (e: any) {
      setBusy(false);
      setError(e?.message || "Erreur inattendue.");
    }
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#F5F0E8] px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-md p-8">
          <h1 className="text-2xl font-black tracking-tight mb-4 text-[#1A1A1A]">
            Autorisation impossible
          </h1>
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </main>
    );
  }

  if (!details) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#F5F0E8]">
        <Loader2 className="w-8 h-8 animate-spin text-[#4A7C59]" />
      </main>
    );
  }

  const clientName = details.client?.name ?? details.client?.client_name ?? "cette application";
  const redirectUri = details.client?.redirect_uris?.[0] ?? details.redirect_uri;

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F5F0E8] px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-md p-8">
        <h1 className="text-2xl font-black tracking-tight mb-2 text-[#1A1A1A]">
          Connecter {clientName}
        </h1>
        <p className="text-gray-600 text-sm mb-6">
          {clientName} pourra utiliser les outils Pièces Trottinettes en votre nom :
          recherche pièces, consultation de vos commandes et de votre garage.
        </p>

        {redirectUri && (
          <div className="text-xs text-gray-500 mb-6 break-all">
            Redirection : <span className="font-mono">{redirectUri}</span>
          </div>
        )}

        <p className="text-xs text-gray-500 mb-6">
          Cela n'accorde aucun accès aux données des autres utilisateurs. Les permissions
          de la base restent appliquées.
        </p>

        <div className="flex gap-3">
          <Button
            onClick={() => decide(true)}
            disabled={busy}
            className="flex-1 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-lg"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Autoriser"}
          </Button>
          <Button
            onClick={() => decide(false)}
            disabled={busy}
            variant="outline"
            className="flex-1 rounded-lg"
          >
            Refuser
          </Button>
        </div>
      </div>
    </main>
  );
}
