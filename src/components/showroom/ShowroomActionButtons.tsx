import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Heart, Home, Wrench, FileText, ExternalLink, Check } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  useIsInGarage,
  useAddToGarage,
  useRemoveFromGarage,
} from "@/hooks/useGarage";

interface ShowroomActionButtonsProps {
  slug: string;
  name: string;
  affiliateLink: string | null;
}

const BTN_BASE =
  "inline-flex items-center justify-center gap-2 min-h-[48px] px-5 rounded-xl text-sm font-semibold uppercase tracking-wider transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed";
const FONT = "'Plus Jakarta Sans', sans-serif";

const ShowroomActionButtons = ({ slug, name, affiliateLink }: ShowroomActionButtonsProps) => {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const { user } = useAuth();
  const { inGarage, isOwned, garageItem } = useIsInGarage(slug);
  const addToGarage = useAddToGarage();
  const removeFromGarage = useRemoveFromGarage();

  const loginRedirect = () => navigate(`/login?returnTo=/showroom/${slug}`);
  const isFavorite = inGarage && !isOwned;
  const busy = addToGarage.isPending || removeFromGarage.isPending;

  // ❤️ Aimer — favorite (is_owned:false). Disabled when scooter is owned.
  const handleLike = () => {
    if (!user) return loginRedirect();
    if (isFavorite && garageItem) {
      removeFromGarage.mutate(garageItem.id);
      return;
    }
    if (!inGarage) {
      addToGarage.mutate({ scooterSlug: slug, isOwned: false, scooterName: name });
    }
  };

  // 🏠 + Garage — owned (is_owned:true). "Ajouté" if already present in any form.
  const handleAddGarage = () => {
    if (!user) return loginRedirect();
    if (inGarage) {
      toast.info(`${name} est déjà dans ton garage`);
      return;
    }
    addToGarage.mutate({ scooterSlug: slug, isOwned: true, scooterName: name });
  };

  // 🛒 Pièces — smooth scroll to the compatible parts section.
  const handleScrollToParts = () => {
    const el = document.getElementById("showroom-parts");
    el?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  };

  return (
    <div className="w-full max-w-2xl mx-auto lg:mx-0">
      <div className="grid grid-cols-2 gap-2.5 lg:flex lg:flex-wrap lg:gap-3">
        {/* Aimer */}
        <motion.button
          type="button"
          onClick={handleLike}
          disabled={busy || isOwned}
          aria-label={isFavorite ? `Retirer ${name} des favoris` : `Aimer ${name}`}
          aria-pressed={isFavorite}
          whileHover={reduceMotion ? undefined : { scale: 1.05 }}
          whileTap={reduceMotion ? undefined : { scale: 0.95 }}
          className={BTN_BASE}
          style={
            isFavorite
              ? { backgroundColor: "#FEF2F2", border: "1px solid #FCA5A5", color: "#DC2626", fontFamily: FONT }
              : { backgroundColor: "#1A1A1A", color: "#FFFFFF", fontFamily: FONT }
          }
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={isFavorite ? "on" : "off"}
              initial={reduceMotion ? false : { scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={reduceMotion ? undefined : { scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="inline-flex"
            >
              <Heart className="w-4 h-4" strokeWidth={2.5} fill={isFavorite ? "currentColor" : "none"} />
            </motion.span>
          </AnimatePresence>
          {isFavorite ? "Aimé" : "Aimer"}
        </motion.button>

        {/* + Garage */}
        <motion.button
          type="button"
          onClick={handleAddGarage}
          disabled={busy}
          aria-label={inGarage ? `${name} déjà dans le garage` : `Ajouter ${name} au garage`}
          whileHover={reduceMotion || inGarage ? undefined : { scale: 1.05 }}
          whileTap={reduceMotion || inGarage ? undefined : { scale: 0.95 }}
          className={BTN_BASE}
          style={
            inGarage
              ? { backgroundColor: "rgba(74,124,89,0.12)", border: "1px solid rgba(74,124,89,0.3)", color: "#4A7C59", fontFamily: FONT }
              : { backgroundColor: "#1A1A1A", color: "#FFFFFF", fontFamily: FONT }
          }
        >
          {inGarage ? <Check className="w-4 h-4" strokeWidth={2.5} /> : <Home className="w-4 h-4" strokeWidth={2.5} />}
          {inGarage ? "Ajouté" : "Garage"}
        </motion.button>

        {/* Pièces */}
        <motion.button
          type="button"
          onClick={handleScrollToParts}
          aria-label="Voir les pièces compatibles"
          whileHover={reduceMotion ? undefined : { scale: 1.05 }}
          whileTap={reduceMotion ? undefined : { scale: 0.95 }}
          className={`${BTN_BASE} col-span-2 lg:col-span-1`}
          style={{ backgroundColor: "#1A1A1A", color: "#FFFFFF", fontFamily: FONT }}
        >
          <Wrench className="w-4 h-4" strokeWidth={2.5} />
          Pièces
        </motion.button>

        {/* Fiche complète (secondaire) */}
        <motion.button
          type="button"
          onClick={() => navigate(`/scooter/${slug}`)}
          aria-label={`Voir la fiche complète de ${name}`}
          whileHover={reduceMotion ? undefined : { scale: 1.05 }}
          whileTap={reduceMotion ? undefined : { scale: 0.95 }}
          className={`${BTN_BASE} ${affiliateLink ? "" : "col-span-2 lg:col-span-1"}`}
          style={{ backgroundColor: "#FFFFFF", border: "1px solid #1A1A1A", color: "#1A1A1A", fontFamily: FONT }}
        >
          <FileText className="w-4 h-4" strokeWidth={2.5} />
          Fiche
        </motion.button>

        {/* Acheter chez partenaire (vert sauge) */}
        {affiliateLink && (
          <motion.a
            href={affiliateLink}
            target="_blank"
            rel="noopener noreferrer sponsored"
            aria-label={`Acheter ${name} chez notre partenaire (lien externe)`}
            whileHover={reduceMotion ? undefined : { scale: 1.05 }}
            whileTap={reduceMotion ? undefined : { scale: 0.95 }}
            className={`${BTN_BASE} col-span-2 lg:col-span-1`}
            style={{ backgroundColor: "#4A7C59", color: "#FFFFFF", fontFamily: FONT }}
          >
            <ExternalLink className="w-4 h-4" strokeWidth={2.5} />
            Acheter
          </motion.a>
        )}
      </div>

      {affiliateLink && (
        <p
          className="mt-3 text-xs italic text-center lg:text-left"
          style={{ color: "#6B7280", fontFamily: FONT }}
        >
          Lien d'affiliation, partenaire sélectionné
        </p>
      )}
    </div>
  );
};

export default ShowroomActionButtons;
