/**
 * Statut commercial d'une trottinette (24/10/2026, décision de Nolan) : en vente neuve / plus vendue neuve.
 * Source : scooter_models.commercial_status (en_vente · fin_de_serie · arretee · a_verifier), posé avec preuve
 * (status_source). Une arrêtée RESTE en ligne : on dit qu'elle n'est plus vendue neuve et on renvoie vers ses pièces.
 * « a_verifier » n'affiche jamais rien (on ne dit pas une chose non prouvée).
 * 5 propositions derrière ?etiquette=1..5 ; sans paramètre : rien d'affiché (en attendant le choix de Nolan).
 */
const UNB = "'Unbounded', sans-serif";
const FONT = "'Plus Jakarta Sans', sans-serif";
const CARBON = "#1A1A1A";
const GREEN = "#4A7C59";
const LINE = "#E2DCD0";
const cut = (px: number) => `polygon(0 0, calc(100% - ${px}px) 0, 100% ${px}px, 100% 100%, 0 100%)`;

export type CommercialStatus = "en_vente" | "fin_de_serie" | "arretee" | "a_verifier";
export interface WithCommercialStatus {
  commercial_status?: string | null;
  sold_until_year?: number | null;
}
export type EtiquetteLook = 1 | 2 | 3 | 4 | 5;

export const readEtiquette = (p: URLSearchParams): EtiquetteLook | null => {
  const n = Number(p.get("etiquette"));
  return n >= 1 && n <= 5 ? (n as EtiquetteLook) : null;
};

/** Plus vendue neuve = arrêtée ou fin de série (filtre « Plus vendue neuve » de la gamme). */
export const isStopped = (s: WithCommercialStatus) => s.commercial_status === "arretee";
export const isEndOfLine = (s: WithCommercialStatus) => s.commercial_status === "fin_de_serie";
export const isOnSale = (s: WithCommercialStatus) => s.commercial_status === "en_vente";

/** Libellé court ; l'année seulement si elle est sourcée en base. */
export const stoppedLabel = (s: WithCommercialStatus) =>
  s.sold_until_year ? `Plus vendue neuve depuis ${s.sold_until_year}` : "Plus vendue neuve";

// ─── Sur la carte de la gamme (/trottinettes, carte « Fiche technique ») ────────────────────────────────
export const StatusOnCard = ({ s, look }: { s: WithCommercialStatus; look: EtiquetteLook }) => {
  const stopped = isStopped(s);
  const eol = isEndOfLine(s);
  const sale = isOnSale(s);

  // 1 — ÉTIQUETTE : la lecture littérale. Pastille carbone « Plus vendue neuve » sur les arrêtées, rien sur les autres.
  if (look === 1) {
    if (!stopped && !eol) return null;
    return (
      <span className="self-start inline-flex items-center min-h-[26px] px-2 text-sm font-bold whitespace-nowrap text-white"
        style={{ fontFamily: FONT, background: eol ? "#6B5B2E" : CARBON, clipPath: cut(6) }}>
        {eol ? "Fin de série" : "Plus vendue neuve"}
      </span>
    );
  }
  // 3 — FEU VERT : on dit aussi ce qui s'achète. Point vert « En vente neuve », point gris « Plus vendue ».
  if (look === 3) {
    if (!stopped && !sale && !eol) return null;
    const c = sale ? GREEN : eol ? "#B7791F" : "#9CA3AF";
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-bold" style={{ fontFamily: FONT, color: sale ? GREEN : "#6B7280" }}>
        <span aria-hidden className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c }} />
        {sale ? "En vente neuve" : eol ? "Fin de série" : "Plus vendue neuve"}
      </span>
    );
  }
  // 4 — PIÈCES D'ABORD : bandeau beige qui dit ce qu'on y trouve encore (ses pièces), pas seulement ce qui manque.
  if (look === 4) {
    if (!stopped && !eol) return null;
    return (
      <span className="block -mx-3 px-3 py-1.5 text-sm font-bold" style={{ fontFamily: FONT, color: CARBON, background: "#F2EBDD", borderTop: `1px solid ${LINE}`, borderBottom: `1px solid ${LINE}` }}>
        {eol ? "Fin de série" : "Plus vendue"} · <span style={{ color: GREEN }}>on a ses pièces</span>
      </span>
    );
  }
  // 5 — DISCRET : une mention grise, rien de plus (la carte reste identique pour 400 modèles).
  if (look === 5) {
    if (!stopped && !eol) return null;
    return <span className="text-sm" style={{ fontFamily: FONT, color: "#6B7280" }}>{eol ? "Fin de série" : "Plus vendue neuve"}</span>;
  }
  return null; // 2 — TAMPON : porté par la photo (voir StampOnPhoto)
};

/** 2 — TAMPON : tampon incliné posé sur la photo de la carte (arrêtées seulement). */
export const StampOnPhoto = ({ s }: { s: WithCommercialStatus }) => {
  if (!isStopped(s) && !isEndOfLine(s)) return null;
  return (
    <span aria-label={isEndOfLine(s) ? "Fin de série" : "Plus vendue neuve"}
      className="absolute z-20 right-1 top-10 md:top-14 -rotate-[8deg] px-2 py-1 text-sm uppercase leading-none pointer-events-none"
      style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: CARBON, background: "rgba(255,255,255,0.92)", boxShadow: `inset 0 0 0 2px ${CARBON}` }}>
      {isEndOfLine(s) ? "Fin de série" : "Plus vendue"}
    </span>
  );
};

// ─── Sur la fiche (/scooter/:slug), entre le titre et les specs ─────────────────────────────────────────
export const StatusOnFiche = ({ s, look, name }: { s: WithCommercialStatus; look: EtiquetteLook; name: string }) => {
  const stopped = isStopped(s);
  const eol = isEndOfLine(s);
  const sale = isOnSale(s);
  if (!stopped && !eol && !(look === 3 && sale)) return null;
  const label = eol ? "Fin de série" : stoppedLabel(s);
  const parts = (
    <a href="#showroom-parts" className="inline-flex items-center justify-center min-h-[44px] px-5 text-sm font-bold text-white bg-green-700 hover:bg-green-800" style={{ fontFamily: FONT, clipPath: cut(10) }}>
      Voir ses pièces compatibles
    </a>
  );

  if (look === 1) {
    return (
      <div className="mt-3 grid gap-2">
        <span className="self-start w-fit inline-flex items-center min-h-[30px] px-3 text-sm font-bold uppercase tracking-wide text-white" style={{ fontFamily: FONT, background: CARBON, clipPath: cut(8) }}>{label}</span>
        <p className="text-base text-[#374151]" style={{ fontFamily: FONT }}>Le fabricant ne vend plus {name} neuve. On garde toutes ses pièces.</p>
      </div>
    );
  }
  if (look === 2) {
    return (
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className="-rotate-[4deg] px-3 py-1.5 text-base uppercase leading-none" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: CARBON, boxShadow: `inset 0 0 0 2px ${CARBON}`, background: "#FFFFFF" }}>{label}</span>
        <span className="text-sm text-[#374151]" style={{ fontFamily: FONT }}>Ses pièces restent disponibles.</span>
      </div>
    );
  }
  if (look === 3) {
    const c = sale ? GREEN : eol ? "#B7791F" : "#9CA3AF";
    return (
      <p className="mt-3 inline-flex items-center gap-2 text-base font-bold" style={{ fontFamily: FONT, color: sale ? GREEN : "#374151" }}>
        <span aria-hidden className="w-3 h-3 rounded-full" style={{ background: c }} />
        {sale ? "En vente neuve aujourd'hui" : `${label} · ses pièces restent disponibles`}
      </p>
    );
  }
  if (look === 4) {
    return (
      <div className="mt-4 p-4 grid gap-3" style={{ background: "#F2EBDD", clipPath: cut(14), boxShadow: `inset 0 0 0 1px ${LINE}` }}>
        <div>
          <p className="text-base uppercase" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: CARBON }}>{label}</p>
          <p className="mt-1 text-sm text-[#374151]" style={{ fontFamily: FONT }}>Tu en as une ? On a les pièces pour la garder en forme.</p>
        </div>
        {parts}
      </div>
    );
  }
  return <p className="mt-2 text-sm" style={{ fontFamily: FONT, color: "#6B7280" }}>{label}</p>;
};

export default StatusOnFiche;
