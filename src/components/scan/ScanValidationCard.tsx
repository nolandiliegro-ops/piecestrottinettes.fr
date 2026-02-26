import { motion } from "framer-motion";
import { CheckCircle, Edit3, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import ScooterSearchSelect from "./ScooterSearchSelect";
import { useState } from "react";

interface ScanValidationCardProps {
  previewUrl: string;
  aiResult: {
    found: boolean;
    name?: string;
    slug?: string;
    brand?: string;
    confidence?: string;
    similarity?: number;
    ai_brand?: string;
    ai_model?: string;
    reason?: string;
    scooter_model_id?: string;
    sn?: string | null;
  };
  onConfirm: (modelId?: string) => void;
  onCorrect: (modelId: string, modelName: string) => void;
  onSignal: () => void;
  onRetry: () => void;
  loading?: boolean;
}

const confidenceBadge = (confidence?: string) => {
  switch (confidence) {
    case "high":
      return { label: "Confiance élevée", className: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" };
    case "medium":
      return { label: "Confiance moyenne", className: "bg-amber-500/20 text-amber-300 border-amber-500/30" };
    default:
      return { label: "Confiance faible", className: "bg-red-500/20 text-red-300 border-red-500/30" };
  }
};

const ScanValidationCard = ({
  previewUrl,
  aiResult,
  onConfirm,
  onCorrect,
  onSignal,
  onRetry,
  loading = false,
}: ScanValidationCardProps) => {
  const [showCorrection, setShowCorrection] = useState(false);
  const badge = confidenceBadge(aiResult.confidence);
  const isMatch = aiResult.found && aiResult.name;
  const isNoMatch = !aiResult.found && aiResult.reason === "no_match";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 22, mass: 0.8 }}
      className="relative w-full max-w-sm mx-auto"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Glassmorphism Card */}
      <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 shadow-2xl">
        {/* Preview Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.1 }}
          className="relative w-full aspect-square rounded-2xl overflow-hidden mb-5 border border-white/10 shadow-lg"
        >
          <img src={previewUrl} alt="Scan" className="w-full h-full object-cover" />
          
          {/* Confidence Badge Overlay */}
          {isMatch && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.3 }}
              className="absolute top-3 right-3"
            >
              <span className={cn("px-3 py-1 rounded-full text-[10px] font-display uppercase tracking-wider border", badge.className)}>
                {badge.label}
              </span>
            </motion.div>
          )}
        </motion.div>

        {/* Match Found */}
        {isMatch && !showCorrection && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 22, delay: 0.2 }}
            className="space-y-5"
          >
            {/* Model Name */}
            <div className="text-center">
              <p className="text-white/50 text-xs font-display uppercase tracking-widest mb-1">
                Identifié
              </p>
              <h2 className="text-white font-display text-xl font-bold uppercase tracking-wide">
                {aiResult.brand}
              </h2>
              <h3 className="text-white/80 font-display text-lg uppercase tracking-wide">
                {aiResult.name}
              </h3>
              {aiResult.sn && (
                <p className="text-white/40 text-xs mt-2 font-mono">
                  SN: {aiResult.sn}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onConfirm(aiResult.scooter_model_id)}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 font-display text-sm uppercase tracking-wider transition-all disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                C'est exact — Ajouter au Garage
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowCorrection(true)}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 text-white/70 font-display text-xs uppercase tracking-wider transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Ce n'est pas le bon modèle
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Correction Mode */}
        {isMatch && showCorrection && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            className="space-y-4"
          >
            <div className="text-center">
              <p className="text-white/50 text-xs font-display uppercase tracking-widest mb-1">
                Corriger le modèle
              </p>
              <p className="text-white/40 text-xs">
                L'IA pensait : {aiResult.brand} {aiResult.name}
              </p>
            </div>

            <ScooterSearchSelect
              onSelect={(modelId, modelName) => onCorrect(modelId, modelName)}
            />

            <button
              onClick={() => setShowCorrection(false)}
              className="w-full text-center text-white/30 text-xs hover:text-white/50 transition-colors"
            >
              ← Retour
            </button>
          </motion.div>
        )}

        {/* No Match */}
        {isNoMatch && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 22, delay: 0.2 }}
            className="space-y-5"
          >
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              </div>
              <p className="text-white/50 text-xs font-display uppercase tracking-widest mb-1">
                Modèle non référencé
              </p>
              <h2 className="text-white font-display text-lg font-bold uppercase tracking-wide">
                {aiResult.ai_brand} {aiResult.ai_model}
              </h2>
              <p className="text-white/40 text-xs mt-2">
                Ce modèle n'est pas encore dans notre catalogue
              </p>
            </div>

            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onSignal}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 font-display text-sm uppercase tracking-wider transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Signaler ce modèle
              </motion.button>

              {!showCorrection ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowCorrection(true)}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 text-white/70 font-display text-xs uppercase tracking-wider transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Choisir manuellement
                </motion.button>
              ) : (
                <ScooterSearchSelect
                  onSelect={(modelId, modelName) => onCorrect(modelId, modelName)}
                />
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default ScanValidationCard;
