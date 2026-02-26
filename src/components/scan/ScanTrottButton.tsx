import { useState, useRef, useCallback } from "react";
import { Camera, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ScanValidationCard from "./ScanValidationCard";

type ScanState = "idle" | "scanning" | "validating" | "no_match" | "error";

interface ScanResult {
  found: boolean;
  name?: string;
  slug?: string;
  brand?: string;
  confidence?: string;
  similarity?: number;
  reason?: string;
  ai_brand?: string;
  ai_model?: string;
  scooter_model_id?: string;
  sn?: string | null;
}

/** Resize image to max 1200px via Canvas, JPEG 80% */
const resizeImage = (dataUrl: string, maxSize = 1200): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.src = dataUrl;
  });
};

const ScanTrottButton = () => {
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const rawDataUrl = ev.target?.result as string;
      
      // Resize to 1200px max for Gemini detail recognition
      const resizedDataUrl = await resizeImage(rawDataUrl, 1200);
      setPreviewUrl(resizedDataUrl);
      setScanState("scanning");

      try {
        const base64 = resizedDataUrl.split(",")[1];
        const { data, error } = await supabase.functions.invoke("scan-trott", {
          body: { image_base64: base64 },
        });

        if (error) throw error;

        setScanResult(data);

        if (data?.found) {
          setScanState("validating");
        } else if (data?.reason === "no_match") {
          setScanState("no_match");
        } else if (data?.reason === "no_scooter") {
          setScanState("error");
          toast.error("Ce n'est pas une trottinette électrique !");
        } else {
          setScanState("error");
          toast.error("Impossible d'identifier le modèle. Essayez un autre angle.");
        }
      } catch (err) {
        console.error("Scan error:", err);
        setScanState("error");
        toast.error("Erreur lors du scan. Réessayez.");
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const uploadScanPhoto = useCallback(async (base64Data: string): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const timestamp = Date.now();
      const path = `scans/${user.id}/${timestamp}.jpg`;
      const blob = await fetch(base64Data).then(r => r.blob());

      const { error } = await supabase.storage
        .from("scooter-photos")
        .upload(path, blob, { contentType: "image/jpeg", upsert: false });

      if (error) {
        console.error("Upload error:", error);
        return null;
      }

      const { data: urlData } = supabase.storage.from("scooter-photos").getPublicUrl(path);
      return urlData.publicUrl;
    } catch {
      return null;
    }
  }, []);

  const saveScanValidation = useCallback(async (
    imageUrl: string | null,
    isValidated: boolean,
    correctedModelId?: string,
    correctedText?: string,
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !scanResult) return;

      await supabase.from("scan_validations" as any).insert({
        user_id: user.id,
        image_url: imageUrl,
        ai_brand: scanResult.ai_brand || scanResult.brand || "",
        ai_model: scanResult.ai_model || scanResult.name || "",
        ai_confidence: scanResult.confidence || "medium",
        matched_model_id: scanResult.scooter_model_id || null,
        is_validated: isValidated,
        corrected_model_id: correctedModelId || null,
        corrected_text: correctedText || null,
        validated_at: new Date().toISOString(),
      } as any);
    } catch (err) {
      console.error("Save validation error:", err);
    }
  }, [scanResult]);

  const handleConfirm = useCallback(async () => {
    if (!scanResult || !previewUrl) return;
    setActionLoading(true);

    const imageUrl = await uploadScanPhoto(previewUrl);
    await saveScanValidation(imageUrl, true);

    localStorage.setItem("scan_model_slug", scanResult.slug || "");
    closeScan();
    navigate(`/garage?scan_model=${scanResult.slug}`);
    setActionLoading(false);
  }, [scanResult, previewUrl, navigate, uploadScanPhoto, saveScanValidation]);

  const handleCorrect = useCallback(async (modelId: string, modelName: string) => {
    if (!previewUrl) return;
    setActionLoading(true);

    const imageUrl = await uploadScanPhoto(previewUrl);
    await saveScanValidation(imageUrl, false, modelId);

    // Find the slug for the corrected model
    const { data } = await supabase
      .from("scooter_models")
      .select("slug")
      .eq("id", modelId)
      .single();

    closeScan();
    if (data?.slug) {
      navigate(`/garage?scan_model=${data.slug}`);
    }
    toast.success(`Correction enregistrée : ${modelName}`);
    setActionLoading(false);
  }, [previewUrl, navigate, uploadScanPhoto, saveScanValidation]);

  const handleSignal = useCallback(async () => {
    if (!previewUrl || !scanResult) return;
    setActionLoading(true);

    const imageUrl = await uploadScanPhoto(previewUrl);
    await saveScanValidation(imageUrl, false, undefined, `${scanResult.ai_brand} ${scanResult.ai_model}`);

    toast.success("Modèle signalé ! L'équipe va l'ajouter prochainement.");
    closeScan();
    setActionLoading(false);
  }, [previewUrl, scanResult, uploadScanPhoto, saveScanValidation]);

  const closeScan = () => {
    setScanState("idle");
    setPreviewUrl(null);
    setScanResult(null);
    setActionLoading(false);
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
              {/* Scanning State */}
              {scanState === "scanning" && previewUrl && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-6"
                >
                  <div className="relative w-64 h-64 rounded-2xl overflow-hidden border-2 border-mineral/30 shadow-2xl">
                    <img src={previewUrl} alt="Scan" className="w-full h-full object-cover" />
                    <motion.div
                      initial={{ top: "0%" }}
                      animate={{ top: ["0%", "90%", "0%"] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-sky-400 to-transparent shadow-[0_0_20px_8px_rgba(56,189,248,0.4)]"
                    />
                  </div>
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
                    <p className="text-white font-display text-sm tracking-wide uppercase">
                      Analyse en cours...
                    </p>
                    <p className="text-white/50 text-xs">Identification IA du modèle</p>
                  </div>
                </motion.div>
              )}

              {/* Validation State (HITL) */}
              {(scanState === "validating" || scanState === "no_match") && scanResult && previewUrl && (
                <ScanValidationCard
                  previewUrl={previewUrl}
                  aiResult={scanResult}
                  onConfirm={handleConfirm}
                  onCorrect={handleCorrect}
                  onSignal={handleSignal}
                  onRetry={() => {
                    closeScan();
                    fileInputRef.current?.click();
                  }}
                  loading={actionLoading}
                />
              )}

              {/* Error State */}
              {scanState === "error" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  className="flex flex-col items-center gap-4"
                >
                  <p className="text-red-400 font-display text-sm uppercase tracking-wide">
                    Modèle non reconnu
                  </p>
                  <p className="text-white/50 text-xs text-center">
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

              {/* Close hint */}
              {scanState !== "scanning" && (
                <p className="text-white/30 text-xs mt-4">Touchez pour fermer</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ScanTrottButton;
