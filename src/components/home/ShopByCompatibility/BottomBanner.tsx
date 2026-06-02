import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

interface Props {
  mode: "config" | "discovery";
  scooterName: string | null;
  brandName: string | null;
  totalCount: number;
  catalogueHref: string;
  ctaLabel?: string | null;
}

const BottomBanner = ({ mode, scooterName, brandName, totalCount, catalogueHref, ctaLabel }: Props) => {
  const leftText =
    mode === "config" && scooterName
      ? `${totalCount} pièce${totalCount > 1 ? "s" : ""} compatible${totalCount > 1 ? "s" : ""} avec ta ${scooterName}.`
      : `${totalCount} référence${totalCount > 1 ? "s" : ""} dans le catalogue. Sélectionne ta trotti pour filtrer.`;

  const linkText =
    mode === "config" && brandName
      ? `Voir tout le catalogue ${brandName}`
      : "Voir tout le catalogue";

  return (
    <div
      className="mt-5 lg:mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl"
      style={{
        padding: "11px 14px",
        backgroundColor: "rgba(255,255,255,0.06)",
        border: "0.5px solid rgba(255,255,255,0.12)",
      }}
    >
      <p
        className="text-xs lg:text-[13px]"
        style={{
          color: "rgba(255,255,255,0.85)",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        {leftText}
      </p>
      <Link
        to={catalogueHref}
        className="inline-flex items-center gap-1 text-xs lg:text-[13px] font-semibold whitespace-nowrap min-h-[32px]"
        style={{
          color: "#FFA559",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        {ctaLabel || linkText}
        <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
      </Link>
    </div>
  );
};

export default BottomBanner;
