/**
 * Garage v3 (25/10/2026, refonte complète demandée par Nolan — lot claude/PT-lot-garage-v3.md).
 * Quatre écrans + réglages, chacun à son adresse :
 *   /garage            Ma carte (la carte Rider Story en grand, commentaires, modifier ma carte)
 *   /garage/trotts     Mes trotts (scène, vraie photo, entretien, pièces)
 *   /garage/commandes  Commandes (frise, articles, suivi, racheter, question → SKOT)
 *   /garage/skot       SKOT, la discussion du garage
 *   /garage/reglages   Profil, garage public, wallpaper, code RIDER, ambassadeur, mails
 * L'ancien garage reste joignable par ?g=0.
 */
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { IdCard, Bike, Package, MessageCircle, Settings } from "lucide-react";
import CarteSection from "./CarteSection";
import CommandesSection from "./CommandesSection";
import SkotSection from "./SkotSection";
import ReglagesSection from "./ReglagesSection";
import { UNB, FONT, CARBON, GREEN, PAPER, LINE, cut } from "./ui";

export type GarageSection = "carte" | "trotts" | "commandes" | "skot" | "reglages";

export const readGarageSection = (raw?: string): GarageSection =>
  raw === "trotts" || raw === "commandes" || raw === "skot" || raw === "reglages" ? raw : "carte";

const NAV: { id: GarageSection; label: string; to: string; icon: typeof IdCard }[] = [
  { id: "carte", label: "Ma carte", to: "/garage", icon: IdCard },
  { id: "trotts", label: "Mes trotts", to: "/garage/trotts", icon: Bike },
  { id: "commandes", label: "Commandes", to: "/garage/commandes", icon: Package },
  { id: "skot", label: "SKOT", to: "/garage/skot", icon: MessageCircle },
  { id: "reglages", label: "Réglages", to: "/garage/reglages", icon: Settings },
];

interface Props {
  section: GarageSection;
  trotts: ReactNode;
  unread: number;
  onEditProfile: () => void;
  onTheme: () => void;
}

const GarageV3 = ({ section, trotts, unread, onEditProfile, onTheme }: Props) => (
  <div className="px-4 lg:px-6 max-w-[1400px] mx-auto w-full pb-10">
    <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8 lg:items-start">
      {/* Navigation : barre d'onglets en haut sur téléphone, colonne à gauche sur ordinateur */}
      <nav aria-label="Mon garage" className="sticky z-20 -mx-4 px-4 lg:mx-0 lg:px-0 top-[calc(64px+env(safe-area-inset-top,0px))] lg:top-24 mb-5 lg:mb-0">
        <p className="hidden lg:block mb-3 text-[22px] uppercase leading-none text-white" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.02em", textShadow: "0 2px 14px rgba(0,0,0,0.45)" }}>Mon garage</p>
        <ul className="flex lg:flex-col gap-1.5 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {NAV.map(({ id, label, to, icon: Icon }) => {
            const on = id === section;
            return (
              <li key={id} className="shrink-0">
                <Link
                  to={to}
                  aria-current={on ? "page" : undefined}
                  className="flex items-center gap-2.5 min-h-[48px] px-4 lg:px-3.5 text-[15px] font-extrabold whitespace-nowrap"
                  style={{ fontFamily: FONT, background: on ? CARBON : PAPER, color: on ? "#FFFFFF" : CARBON, clipPath: cut(10), boxShadow: on ? undefined : `inset 0 0 0 1px ${LINE}` }}
                >
                  <Icon className="w-[18px] h-[18px] shrink-0" style={{ color: on ? "#8FBF9C" : GREEN }} />
                  {label}
                  {id === "commandes" && unread > 0 && (
                    <span className="ml-auto min-w-[24px] h-6 px-1.5 inline-flex items-center justify-center text-sm font-black text-white" style={{ background: "#DC2626" }}>{unread}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="min-w-0">
        {section === "carte" && <CarteSection onTheme={onTheme} onEditProfile={onEditProfile} />}
        {section === "trotts" && trotts}
        {section === "commandes" && <CommandesSection />}
        {section === "skot" && <SkotSection />}
        {section === "reglages" && <ReglagesSection onEditProfile={onEditProfile} onTheme={onTheme} />}
      </div>
    </div>
  </div>
);

export default GarageV3;
