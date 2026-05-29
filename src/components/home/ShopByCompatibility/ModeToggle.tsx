import { Bike, Grid3x3 } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  mode: "config" | "discovery";
  /** Brand accent color (HEX). When provided, active button uses this color. */
  accentColor?: string;
  hasScooter: boolean;
  /** Called when user clicks "POUR MA TROTTI" without a scooter. */
  onSelectMyTrotti: () => void;
  /** Called when user clicks "TOUT LE CATALOGUE" while in config mode. */
  onShowAll: () => void;
}

const DEFAULT_ACTIVE_COLOR = "#FF6600";

const hexToRgba = (hex: string, alpha: number): string => {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
};

const ModeToggle = ({
  mode,
  accentColor,
  hasScooter,
  onSelectMyTrotti,
  onShowAll,
}: Props) => {
  const activeColor = accentColor ?? DEFAULT_ACTIVE_COLOR;
  const isConfig = mode === "config";

  const handleMyTrottiClick = () => {
    if (!hasScooter) onSelectMyTrotti();
    // else : deja en mode config, no-op
  };

  const handleShowAllClick = () => {
    if (isConfig) onShowAll();
    // else : deja en mode discovery, no-op
  };

  return (
    <div
      className="flex flex-row gap-2 lg:gap-3 mb-6 lg:mb-8"
      role="group"
      aria-label="Mode d'affichage du catalogue"
    >
      <ToggleButton
        active={isConfig}
        activeColor={activeColor}
        onClick={handleMyTrottiClick}
        ariaLabel="Afficher les pièces compatibles avec ma trottinette"
        icon={<Bike size={16} strokeWidth={2.5} />}
        labelMobile="MA TROTTINETTE"
        labelDesktop="POUR MA TROTTINETTE"
      />
      <ToggleButton
        active={!isConfig}
        activeColor={activeColor}
        onClick={handleShowAllClick}
        ariaLabel="Afficher tout le catalogue"
        icon={<Grid3x3 size={16} strokeWidth={2.5} />}
        labelMobile="TOUT VOIR"
        labelDesktop="TOUT LE CATALOGUE"
      />
    </div>
  );
};

interface ToggleButtonProps {
  active: boolean;
  activeColor: string;
  onClick: () => void;
  ariaLabel: string;
  icon: React.ReactNode;
  labelMobile: string;
  labelDesktop: string;
}

const ToggleButton = ({
  active,
  activeColor,
  onClick,
  ariaLabel,
  icon,
  labelMobile,
  labelDesktop,
}: ToggleButtonProps) => {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={ariaLabel}
      whileHover={
        active
          ? { scale: 1.02 }
          : { scale: 1.02, backgroundColor: "rgba(255,255,255,0.10)" }
      }
      whileTap={{ scale: 0.98 }}
      animate={{
        backgroundColor: active ? activeColor : "rgba(255,255,255,0.06)",
        color: active ? "#FFFFFF" : "rgba(255,255,255,0.7)",
        borderColor: active ? "transparent" : "rgba(255,255,255,0.12)",
        boxShadow: active
          ? `0 4px 12px ${hexToRgba(activeColor, 0.25)}`
          : "0 0 0 0 transparent",
      }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-4 lg:px-5 min-h-[48px] rounded-xl border-[0.5px] font-bold text-sm"
      style={{
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        letterSpacing: "0.02em",
      }}
    >
      {icon}
      <span className="sm:hidden">{labelMobile}</span>
      <span className="hidden sm:inline">{labelDesktop}</span>
    </motion.button>
  );
};

export default ModeToggle;
