// Comptoir Pro — facture d'une commande pro (25/10/2026). Contenu figé en base à l'émission (pro_invoices.contenu).
// Ouverte par le magasin (lien WhatsApp ou « Mes commandes ») ou par Nolan depuis l'admin. N'enregistre pas le lien du magasin.
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { proFacture, proErrorMessage, eurFR } from "@/lib/pro";

const JAK = "'Plus Jakarta Sans', system-ui, sans-serif";

const ProFacture = () => {
  const { token, numero } = useParams();
  const q = useQuery({ queryKey: ["pro-facture", token, numero], queryFn: () => proFacture(token!, numero!), enabled: !!token && !!numero, retry: false });

  if (q.isLoading) return <div className="min-h-screen grid place-items-center" style={{ fontFamily: JAK }}>Chargement de la facture…</div>;
  if (q.isError || !q.data) {
    return <div className="min-h-screen grid place-items-center px-5 text-center text-[16px]" style={{ fontFamily: JAK }}>{proErrorMessage(q.error).replace("Problème de connexion", "Facture introuvable ou problème de connexion")}</div>;
  }
  const f = q.data;
  const v = f.vendeur, c = f.client;

  return (
    <div className="min-h-screen bg-[#EDEAE3] print:bg-white py-6 print:py-0 px-3" style={{ fontFamily: JAK, color: "#1A1A1A" }}>
      <Helmet><title>Facture {f.numero} · piecestrottinettes.fr</title><meta name="robots" content="noindex,nofollow" /></Helmet>
      <style>{`@media print { @page { size: A4; margin: 14mm; } .no-print { display: none !important; } }`}</style>
      <div className="no-print max-w-[800px] mx-auto mb-3 flex justify-end">
        <button type="button" onClick={() => window.print()} className="h-12 px-5 text-white text-[15px] font-extrabold" style={{ background: "#4A7C59" }}>
          Imprimer ou enregistrer en PDF
        </button>
      </div>
      <article className="max-w-[800px] mx-auto bg-white p-6 sm:p-10 print:p-0 shadow-sm print:shadow-none grid gap-6 text-[14px] leading-relaxed">
        <header className="flex flex-wrap justify-between gap-6">
          <div className="grid gap-1 min-w-0">
            <img src="/brand/logo-pt-2026.svg" alt="piecestrottinettes.fr" className="w-[190px] h-auto mb-2" />
            <p className="font-bold">{v.nom}</p>
            <p>{v.statut} · {v.enseigne}</p>
            <p>{v.adresse}</p>
            <p>SIRET {v.siret}</p>
            <p>{v.email}</p>
          </div>
          <div className="text-right grid gap-1 content-start">
            <p className="text-[24px] font-black uppercase">Facture</p>
            <p className="font-bold">N° {f.numero}</p>
            <p>Date : {f.date}</p>
            <p>Commande : {f.commande}</p>
          </div>
        </header>
        <section className="grid gap-1 p-4" style={{ background: "#F5F0E8" }}>
          <p className="text-[13px] uppercase tracking-wide font-bold" style={{ color: "#5E625C" }}>Client</p>
          <p className="font-bold">{c.nom}</p>
          {c.contact && <p>{c.contact}</p>}
          {c.adresse && <p>{c.adresse}</p>}
          {c.siret && <p>SIRET {c.siret}</p>}
          {c.tva_intra && <p>TVA intracommunautaire {c.tva_intra}</p>}
          {(c.telephone || c.email) && <p>{[c.telephone, c.email].filter(Boolean).join(" · ")}</p>}
        </section>
        <div className="overflow-x-auto">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="text-left border-b-2 border-[#1A1A1A]"><th className="py-2 pr-2">Désignation</th><th className="py-2 pr-2 text-right">Qté</th><th className="py-2 pr-2 text-right">P.U.</th><th className="py-2 text-right">Total</th></tr>
            </thead>
            <tbody>
              {f.lignes.map((l, i) => (
                <tr key={i} className="border-b border-[#E2DED5] align-top">
                  <td className="py-2 pr-2 break-words">{l.designation}</td>
                  <td className="py-2 pr-2 text-right tabular-nums">{l.quantite}</td>
                  <td className="py-2 pr-2 text-right tabular-nums whitespace-nowrap">{eurFR(l.prix_unitaire)}</td>
                  <td className="py-2 text-right tabular-nums whitespace-nowrap">{eurFR(l.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <section className="grid justify-end gap-1 text-right">
          <p className="text-[18px] font-black">Total à payer : {eurFR(f.total)}</p>
          <p>{f.tva}</p>
          <p className="font-bold" style={{ color: "#3A6449" }}>Acquittée le {f.paiement.date} par {f.paiement.mode}</p>
        </section>
        <footer className="text-[13px] grid gap-1 border-t pt-4" style={{ color: "#5E625C", borderColor: "#E2DED5" }}>
          <p>{f.conditions}</p>
          <p>{v.nom} — {v.statut} — SIRET {v.siret} — {f.tva}</p>
        </footer>
      </article>
    </div>
  );
};

export default ProFacture;
