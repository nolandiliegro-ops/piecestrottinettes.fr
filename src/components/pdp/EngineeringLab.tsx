import { motion } from "framer-motion";
import { Cpu, Scale, Ruler, Gauge, Shield, Layers, Wind, Circle } from "lucide-react";
import DifficultyIndicator from "@/components/parts/DifficultyIndicator";
import { LucideIcon } from "lucide-react";

interface EngineeringLabProps {
  technicalMetadata: Record<string, unknown> | null;
  difficultyLevel: number | null;
}

// Mapping des clés techniques vers labels français et icônes
const specConfig: Record<string, { label: string; icon: LucideIcon }> = {
  poids: { label: "Poids", icon: Scale },
  taille: { label: "Dimensions", icon: Ruler },
  materiau: { label: "Matériau", icon: Layers },
  pression_recommandee: { label: "Pression", icon: Gauge },
  durabilite: { label: "Durabilité", icon: Shield },
  type: { label: "Type", icon: Circle },
  epaisseur: { label: "Épaisseur", icon: Layers },
  valve: { label: "Valve", icon: Wind },
  absorption_chocs: { label: "Absorption", icon: Wind },
  largeur_jante: { label: "Largeur jante", icon: Ruler },
  voltage: { label: "Voltage", icon: Cpu },
  capacite: { label: "Capacité", icon: Gauge },
  amperage: { label: "Ampérage", icon: Gauge },
  puissance: { label: "Puissance", icon: Cpu },
};

const EngineeringLab = ({ technicalMetadata, difficultyLevel }: EngineeringLabProps) => {
  // Extraire les specs présentes dans les metadata
  const specs = technicalMetadata
    ? Object.entries(technicalMetadata)
        .filter(([key, value]) => value !== null && value !== undefined && key in specConfig)
        .map(([key, value]) => ({
          key,
          value: String(value),
          ...specConfig[key],
        }))
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="h-full bg-white/40 backdrop-blur-md border border-white/20 rounded-2xl p-5 md:p-6 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/20">
        <Cpu className="w-5 h-5 text-mineral" />
        <h2 className="font-display text-lg uppercase tracking-wide text-carbon">
          Engineering Lab
        </h2>
      </div>

      {/* Specs Grid */}
      <div className="flex-1 grid grid-cols-2 gap-3 content-start">
        {specs.length > 0 ? (
          specs.map((spec, index) => {
            const IconComponent = spec.icon;
            return (
              <motion.div
                key={spec.key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                className="flex items-start gap-2 p-2 rounded-lg bg-white/30"
              >
                <IconComponent className="w-4 h-4 text-mineral mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-carbon/60 font-medium uppercase tracking-wide">
                    {spec.label}
                  </p>
                  <p className="text-sm text-carbon font-montserrat truncate">
                    {spec.value}
                  </p>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="col-span-2 flex items-center justify-center text-carbon/40 py-4">
            <p className="text-sm">Aucune spécification disponible</p>
          </div>
        )}
      </div>

      {/* Difficulty Level */}
      {difficultyLevel !== null && (
        <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between">
          <span className="text-xs text-carbon/60 font-medium uppercase tracking-wide">
            Difficulté installation
          </span>
          <DifficultyIndicator level={difficultyLevel} />
        </div>
      )}
    </motion.div>
  );
};

export default EngineeringLab;
