/* Lien maison vers une offre partenaire : /go/<id d'offre> (24/10/2026).
   Sert aux liens posés HORS du site (bio TikTok, blog, mails) : l'adresse marchande vit en base
   (scooter_offers.affiliate_url), on la change sans toucher aux liens déjà publiés. Le clic est compté
   dans affiliate_clicks (placement « go »), puis redirection immédiate vers le lien suivi du partenaire. */
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const hostOf = (raw: string) => { try { return new URL(raw).hostname.replace(/^www\./, ""); } catch { return null; } };

export default function GoOffer() {
  const { id = "" } = useParams();
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!/^[0-9a-f-]{36}$/i.test(id)) { setMissing(true); return; }
    const sb = supabase as unknown as { from: (t: string) => any };
    void sb.from("scooter_offers").select("affiliate_url, merchant_host").eq("id", id).eq("is_active", true).maybeSingle()
      .then(async ({ data }: { data: { affiliate_url: string; merchant_host: string } | null }) => {
        if (!data?.affiliate_url) { setMissing(true); return; }
        await Promise.race([
          sb.from("affiliate_clicks").insert({ page_path: `/go/${id}`.slice(0, 300), target_host: (hostOf(data.affiliate_url) ?? "inconnu").slice(0, 120),
            shop_host: data.merchant_host.replace(/^www\./, "").slice(0, 120), scooter_slug: null, placement: "go" }),
          new Promise((r) => setTimeout(r, 600)),
        ]).catch(() => undefined);
        window.location.replace(data.affiliate_url);
      });
  }, [id]);

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#F5F0E8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {missing
        ? <div className="text-center grid gap-4"><p className="text-base text-[#374151]">Cette offre n'est plus disponible.</p>
            <Link to="/trottinettes" className="inline-flex items-center justify-center min-h-[48px] px-6 text-sm font-extrabold uppercase tracking-wider text-white bg-[#4A7C59]">Voir les trottinettes</Link></div>
        : <p className="text-base text-gray-600">On t'emmène chez le vendeur…</p>}
    </main>
  );
}
