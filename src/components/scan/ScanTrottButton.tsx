import { useState, useRef } from "react";
import { Camera, Loader2, CheckCircle, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type ScanState = "idle" | "scanning" | "success" | "error";

interface ScanResult {
  found: boolean;
  name?: string;
  slug?: string;
  brand?: string;
  reason?: string;
  ai_brand?: string;
  ai_model?: string;
}

const ScanTrottButton = () => {
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      setPreviewUrl(dataUrl);
      setScanState("scanning");

      try {
        // Extract base64 without prefix
        const base64 = dataUrl.split(",")[1];

        const { data, error } = await supabase.functions.invoke("scan-trott", {
          body: { image_base64: base64 },
        });

        if (error) throw error;

        if (data?.found) {
          setScanResult(data);
          setScanState("success");
          
          // Store in localStorage for future visits
          localStorage.setItem("scan_model_slug", data.slug);
          
          // Auto redirect after 2s
          setTimeout(() => {
            closeScan();
            navigate(`/garage?scan_model=${data.slug}`);
          }, 2000);
        } else {
          setScanResult(data);
          setScanState("error");
          
          const reason = data?.reason;
          if (reason === "no_scooter") {
            toast.error("Ce n'est pas une trottinette électrique !");
          } else if (reason === "no_match") {
            toast.error(
              `Modèle "${data?.ai_brand} ${data?.ai_model}" non trouvé en base. Contactez-nous !`
            );
          } else {
            toast.error("Impossible d'identifier le modèle. Essayez un autre angle.");
          }
        }
      } catch (err) {
        console.error("Scan error:", err);
        setScanState("error");
        toast.error("Erreur lors du scan. Réessayez.");
      }
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const closeScan = () => {
    setScanState("idle");
    setPreviewUrl(null);
    setScanResult(null);
  };

  return (
    <>
      {/* Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-mineral text-white font-display text-xs uppercase tracking-wider shadow-lg hover:shadow-xl transition-shadow border border-mineral-light/20"
      >
        <Camera className="w-4 h-4" />
        Scanner ma Trott
      </motion.button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Fullscreen Scan Overlay */}
      <AnimatePresence>
        {scanState !== "idle" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center"
            onClick={scanState !== "scanning" ? closeScan : undefined}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-carbon/80 backdrop-blur-xl" />

            {/* Content */}
            <div
              className="relative z-10 flex flex-col items-center gap-6 px-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Image Preview with Scanner Effect */}
              <div className="relative w-64 h-64 rounded-2xl overflow-hidden border-2 border-mineral/30 shadow-2xl">
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Scan"
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Scanner Laser Animation */}
                {scanState === "scanning" && (
                  <motion.div
                    initial={{ top: "0%" }}
                    animate={{ top: ["0%", "90%", "0%"] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-sky-400 to-transparent shadow-[0_0_20px_8px_rgba(56,189,248,0.4)]"
                  />
                )}

                {/* Success Overlay */}
                {scanState === "success" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center"
                  >
                    <CheckCircle className="w-16 h-16 text-emerald-400 drop-shadow-lg" />
                  </motion.div>
                )}

                {/* Error Overlay */}
                {scanState === "error" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-red-500/20 flex items-center justify-center"
                  >
                    <XCircle className="w-16 h-16 text-red-400 drop-shadow-lg" />
                  </motion.div>
                )}
              </div>

              {/* Status Text */}
              <div className="text-center">
                {scanState === "scanning" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center gap-3"
                  >
                    <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
                    <p className="text-white font-display text-sm tracking-wide uppercase">
                      Analyse en cours...
                    </p>
                    <p className="text-white/50 text-xs">
                      Identification IA du modèle
                    </p>
                  </motion.div>
                )}

                {scanState === "success" && scanResult && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <p className="text-emerald-400 font-display text-lg font-bold uppercase tracking-wide">
                      {scanResult.brand} {scanResult.name}
                    </p>
                    <p className="text-white/60 text-xs">
                      Identifié ! Redirection vers votre Garage...
                    </p>
                  </motion.div>
                )}

                {scanState === "error" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-3"
                  >
                    <p className="text-red-400 font-display text-sm uppercase tracking-wide">
                      Modèle non reconnu
                    </p>
                    <p className="text-white/50 text-xs">
                      Essayez un autre angle ou une photo plus nette
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        closeScan();
                        fileInputRef.current?.click();
                      }}
                      className="mt-2 px-4 py-2 rounded-full bg-mineral text-white text-xs font-display uppercase tracking-wider"
                    >
                      Réessayer
                    </button>
                  </motion.div>
                )}
              </div>

              {/* Close hint */}
              {scanState !== "scanning" && (
                <p className="text-white/30 text-xs mt-4">
                  Touchez pour fermer
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ScanTrottButton;
