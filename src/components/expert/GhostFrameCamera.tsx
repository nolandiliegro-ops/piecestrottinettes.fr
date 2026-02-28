import { useRef, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Camera as CameraIcon, Loader2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface GhostFrameCameraProps {
  modelId: string;
  activeMission: { key: string; label: string; type: string } | null;
  onCaptureComplete: () => void;
  onMergeMarkers: (markers: Record<string, any>) => void;
}

const GhostFrameCamera = ({ modelId, activeMission, onCaptureComplete, onMergeMarkers }: GhostFrameCameraProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [capturing, setCapturing] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [suggestedMarkers, setSuggestedMarkers] = useState<Record<string, any> | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Start camera stream when a mission is active
  useEffect(() => {
    if (!activeMission) {
      stopCamera();
      return;
    }
    startCamera();
    return () => stopCamera();
  }, [activeMission]);

  const startCamera = async () => {
    setCameraReady(false);
    setCameraError(null);

    try {
      // Request rear camera with mobile-friendly constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;

      // Wait for the video element to be available in the DOM
      const video = videoRef.current;
      if (!video) {
        console.warn('Video ref not available yet');
        return;
      }

      // Assign the stream to the video element
      video.srcObject = stream;

      // Handle the play promise (critical for mobile browsers)
      video.play()
        .then(() => {
          console.log('✅ Camera stream playing successfully');
          setCameraReady(true);
        })
        .catch((err) => {
          console.error('❌ Error starting video play:', err);
          // On some mobile browsers, autoplay may be blocked
          // We still mark as ready since the stream is assigned
          setCameraReady(true);
        });
    } catch (err: any) {
      console.error('❌ Camera access error:', err);
      const message = err.name === 'NotAllowedError'
        ? 'Permission caméra refusée'
        : err.name === 'NotFoundError'
        ? 'Aucune caméra détectée'
        : 'Erreur caméra: ' + err.message;
      setCameraError(message);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  };

  const getInstruction = () => {
    if (!activeMission) return 'Sélectionnez une mission pour activer la caméra';
    if (activeMission.type === 'circle') return 'Alignez les gravures techniques dans le cercle';
    return "Cadrez l'étiquette technique dans le rectangle";
  };

  const capturePhoto = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !activeMission) return;

    setCapturing(true);

    try {
      // Draw the current video frame to the canvas
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context unavailable');
      ctx.drawImage(video, 0, 0);

      // Get base64 and blob from canvas
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      const base64 = dataUrl.split(',')[1];
      const blob = await (await fetch(dataUrl)).blob();

      const fileName = `expert/${modelId}/${Date.now()}.jpg`;

      const { error: uploadErr } = await supabase.storage
        .from('scooter-photos')
        .upload(fileName, blob, { contentType: 'image/jpeg', upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage.from('scooter-photos').getPublicUrl(fileName);

      // Insert expert_captures
      await supabase.from('expert_captures').insert({
        model_id: modelId,
        component_type: activeMission.key,
        image_url: publicUrl,
      });

      setCapturing(false);
      setExtracting(true);

      // Call extract-markers edge function
      const { data: extractData, error: extractErr } = await supabase.functions.invoke('extract-markers', {
        body: { image_base64: base64, component_type: activeMission.key },
      });

      if (extractErr) {
        console.error('Extract error:', extractErr);
        toast.error('Extraction IA échouée');
        setExtracting(false);
        onCaptureComplete();
        return;
      }

      const markers = extractData?.markers || {};
      if (Object.keys(markers).length > 0) {
        setSuggestedMarkers(markers);
      } else {
        toast.info('Aucun marqueur détecté');
        onCaptureComplete();
      }
      setExtracting(false);
    } catch (err) {
      console.error('Capture error:', err);
      toast.error('Erreur de capture');
      setCapturing(false);
      setExtracting(false);
    }
  }, [activeMission, modelId, onCaptureComplete]);

  const handleMerge = () => {
    if (suggestedMarkers) {
      onMergeMarkers(suggestedMarkers);
      setSuggestedMarkers(null);
      onCaptureComplete();
    }
  };

  const handleReject = () => {
    setSuggestedMarkers(null);
    onCaptureComplete();
  };

  return (
    <div className="h-full flex flex-col relative">
      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Camera Feed */}
      <div className="flex-1 relative bg-black overflow-hidden">
        {activeMission ? (
          <>
            {/* Native video element with mobile-critical attributes */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Loading skeleton while camera initializes */}
            {!cameraReady && !cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
                <Skeleton className="w-full h-full absolute inset-0 bg-white/5" />
                <Loader2 className="w-8 h-8 text-[hsl(144,20%,65%)] animate-spin relative z-10" />
                <p className="text-white/50 text-sm relative z-10">Initialisation caméra...</p>
              </div>
            )}

            {/* Camera error state */}
            {cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
                <CameraIcon className="w-10 h-10 text-red-400" />
                <p className="text-red-400 text-sm text-center px-6">{cameraError}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={startCamera}
                  className="text-[hsl(144,20%,65%)] hover:bg-white/10"
                >
                  Réessayer
                </Button>
              </div>
            )}

            {/* SVG Ghost Frame Overlay */}
            {cameraReady && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
                <svg width="100%" height="100%" viewBox="0 0 400 400" className="max-w-[80%] max-h-[80%]">
                  {activeMission.type === 'circle' ? (
                    <>
                      <circle cx="200" cy="200" r="140" fill="none" stroke="hsl(144,20%,65%)"
                        strokeWidth="2" strokeDasharray="8 4" opacity="0.8" />
                      <circle cx="200" cy="200" r="142" fill="none" stroke="hsl(144,20%,65%)"
                        strokeWidth="0.5" opacity="0.3" />
                      <line x1="200" y1="50" x2="200" y2="70" stroke="hsl(144,20%,65%)" strokeWidth="1" opacity="0.5" />
                      <line x1="200" y1="330" x2="200" y2="350" stroke="hsl(144,20%,65%)" strokeWidth="1" opacity="0.5" />
                      <line x1="50" y1="200" x2="70" y2="200" stroke="hsl(144,20%,65%)" strokeWidth="1" opacity="0.5" />
                      <line x1="330" y1="200" x2="350" y2="200" stroke="hsl(144,20%,65%)" strokeWidth="1" opacity="0.5" />
                    </>
                  ) : (
                    <>
                      <rect x="50" y="100" width="300" height="200" rx="8" fill="none"
                        stroke="hsl(144,20%,65%)" strokeWidth="2" strokeDasharray="10 5" opacity="0.8" />
                      <path d="M50 130 L50 100 L80 100" fill="none" stroke="hsl(144,20%,65%)" strokeWidth="3" opacity="0.9" />
                      <path d="M350 130 L350 100 L320 100" fill="none" stroke="hsl(144,20%,65%)" strokeWidth="3" opacity="0.9" />
                      <path d="M50 270 L50 300 L80 300" fill="none" stroke="hsl(144,20%,65%)" strokeWidth="3" opacity="0.9" />
                      <path d="M350 270 L350 300 L320 300" fill="none" stroke="hsl(144,20%,65%)" strokeWidth="3" opacity="0.9" />
                    </>
                  )}
                </svg>
              </div>
            )}

            {/* Instruction text */}
            {cameraReady && (
              <div className="absolute bottom-16 left-0 right-0 text-center z-20">
                <p className="text-[hsl(144,20%,65%)] text-sm font-medium drop-shadow-lg px-4">
                  {getInstruction()}
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <CameraIcon className="w-12 h-12 text-white/20 mb-3" />
            <p className="text-white/50 text-sm">Sélectionnez une mission pour activer la caméra</p>
          </div>
        )}

        {/* Extracting DNA overlay */}
        {extracting && (
          <div className="absolute inset-0 bg-[hsl(0,0%,10%)]/80 backdrop-blur-md flex flex-col items-center justify-center z-30">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-[hsl(144,20%,65%)]/30 animate-ping absolute inset-0" />
              <Loader2 className="w-16 h-16 text-[hsl(144,20%,65%)] animate-spin" />
            </div>
            <p className="text-[hsl(144,20%,65%)] text-lg font-display tracking-wider mt-4">Extraction ADN...</p>
            <p className="text-white/40 text-xs mt-1">Analyse des marqueurs techniques</p>
          </div>
        )}

        {/* Suggested Markers overlay */}
        {suggestedMarkers && (
          <div className="absolute inset-0 bg-[hsl(0,0%,10%)]/90 backdrop-blur-md flex flex-col items-center justify-center z-30 p-6">
            <p className="text-white font-display text-lg mb-4">Marqueurs Détectés</p>
            <div className="space-y-2 w-full max-w-xs mb-6">
              {Object.entries(suggestedMarkers).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-[hsl(144,20%,65%)]/20">
                  <span className="text-white/60 text-xs">{key}</span>
                  <span className="text-[hsl(144,20%,65%)] text-sm font-medium">{String(value)}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <Button onClick={handleReject} variant="ghost" className="text-white/60 hover:text-white hover:bg-white/10 gap-2">
                <X className="w-4 h-4" /> Ignorer
              </Button>
              <Button onClick={handleMerge} className="bg-[hsl(144,20%,65%)] hover:bg-[hsl(144,20%,55%)] text-white gap-2">
                <Check className="w-4 h-4" /> Valider & Fusionner
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Capture Button */}
      {activeMission && cameraReady && !extracting && !suggestedMarkers && (
        <div className="p-3 flex justify-center bg-[hsl(0,0%,10%)]">
          <button
            onClick={capturePhoto}
            disabled={capturing}
            className="w-14 h-14 rounded-full border-4 border-[hsl(144,20%,65%)] bg-transparent hover:bg-[hsl(144,20%,65%)]/20 transition-all flex items-center justify-center disabled:opacity-50"
          >
            {capturing ? (
              <Loader2 className="w-6 h-6 text-[hsl(144,20%,65%)] animate-spin" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[hsl(144,20%,65%)]" />
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default GhostFrameCamera;
