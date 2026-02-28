import { useRef, useState, useCallback, useEffect } from 'react';
import { X, Camera as CameraIcon, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CameraModalProps {
  open: boolean;
  missionLabel: string;
  missionType: string;
  onCapture: (blob: Blob, base64: string) => void;
  onClose: () => void;
}

/**
 * Fullscreen camera modal for mobile devices.
 * Isolates the camera stream from layout issues, improving iOS/Safari compatibility.
 */
const CameraModal = ({ open, missionLabel, missionType, onCapture, onClose }: CameraModalProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState<'initializing' | 'ready' | 'error'>('initializing');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    setStatus('initializing');
    setErrorMsg(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) { setErrorMsg('Élément vidéo introuvable'); setStatus('error'); return; }

      video.srcObject = stream;
      video.onloadedmetadata = () => {
        video.play()
          .then(() => setStatus('ready'))
          .catch(e => { setErrorMsg('Lecture bloquée: ' + e.message); setStatus('error'); });
      };
    } catch (err: any) {
      const msg =
        err.name === 'NotAllowedError' ? 'Permission caméra refusée.' :
        err.name === 'NotFoundError' ? 'Aucune caméra détectée.' :
        'Erreur caméra: ' + err.message;
      setErrorMsg(msg);
      setStatus('error');
    }
  }, [stopCamera]);

  useEffect(() => {
    if (open) startCamera();
    return () => stopCamera();
  }, [open, startCamera, stopCamera]);

  const takePhoto = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    setCapturing(true);
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    const base64 = dataUrl.split(',')[1];
    const blob = await (await fetch(dataUrl)).blob();
    stopCamera();
    onCapture(blob, base64);
  }, [onCapture, stopCamera]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCapturing(true);

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      fetch(dataUrl).then(r => r.blob()).then(blob => {
        stopCamera();
        onCapture(blob, base64);
      });
    };
    reader.readAsDataURL(file);
  }, [onCapture, stopCamera]);

  if (!open) return null;

  const instruction = missionType === 'circle'
    ? 'Alignez les gravures dans le cercle'
    : "Cadrez l'étiquette dans le rectangle";

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
      <canvas ref={canvasRef} className="hidden" />
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur-sm z-10">
        <div>
          <p className="text-[hsl(144,20%,65%)] text-xs font-medium tracking-widest uppercase">Mission</p>
          <p className="text-white font-display text-lg">{missionLabel}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => { stopCamera(); onClose(); }} className="text-white/60 hover:text-white hover:bg-white/10">
          <X className="w-6 h-6" />
        </Button>
      </div>

      {/* Camera feed */}
      <div className="flex-1 relative" style={{ minHeight: '300px' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ display: 'block', position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />

        {status === 'initializing' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10">
            <Loader2 className="w-8 h-8 text-[hsl(144,20%,65%)] animate-spin" />
            <p className="text-white/60 text-sm mt-3">Initialisation caméra...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10 px-6 gap-3">
            <CameraIcon className="w-10 h-10 text-red-400" />
            <p className="text-red-400 text-sm text-center">{errorMsg}</p>
            <Button variant="ghost" size="sm" onClick={startCamera} className="text-[hsl(144,20%,65%)] hover:bg-white/10">
              Réessayer
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="border-[hsl(144,20%,65%)]/40 text-[hsl(144,20%,65%)] hover:bg-[hsl(144,20%,65%)]/10 gap-2 mt-2"
            >
              <Upload className="w-4 h-4" /> Importer une photo
            </Button>
          </div>
        )}

        {/* Ghost Frame overlay */}
        {status === 'ready' && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
            <svg width="100%" height="100%" viewBox="0 0 400 400" className="max-w-[80%] max-h-[80%]">
              {missionType === 'circle' ? (
                <>
                  <circle cx="200" cy="200" r="140" fill="none" stroke="hsl(144,20%,65%)" strokeWidth="2" strokeDasharray="8 4" opacity="0.8" />
                  <line x1="200" y1="50" x2="200" y2="70" stroke="hsl(144,20%,65%)" strokeWidth="1" opacity="0.5" />
                  <line x1="200" y1="330" x2="200" y2="350" stroke="hsl(144,20%,65%)" strokeWidth="1" opacity="0.5" />
                  <line x1="50" y1="200" x2="70" y2="200" stroke="hsl(144,20%,65%)" strokeWidth="1" opacity="0.5" />
                  <line x1="330" y1="200" x2="350" y2="200" stroke="hsl(144,20%,65%)" strokeWidth="1" opacity="0.5" />
                </>
              ) : (
                <>
                  <rect x="50" y="100" width="300" height="200" rx="8" fill="none" stroke="hsl(144,20%,65%)" strokeWidth="2" strokeDasharray="10 5" opacity="0.8" />
                  <path d="M50 130 L50 100 L80 100" fill="none" stroke="hsl(144,20%,65%)" strokeWidth="3" opacity="0.9" />
                  <path d="M350 130 L350 100 L320 100" fill="none" stroke="hsl(144,20%,65%)" strokeWidth="3" opacity="0.9" />
                  <path d="M50 270 L50 300 L80 300" fill="none" stroke="hsl(144,20%,65%)" strokeWidth="3" opacity="0.9" />
                  <path d="M350 270 L350 300 L320 300" fill="none" stroke="hsl(144,20%,65%)" strokeWidth="3" opacity="0.9" />
                </>
              )}
            </svg>
          </div>
        )}

        {/* Instruction */}
        {status === 'ready' && (
          <div className="absolute bottom-24 left-0 right-0 text-center z-20">
            <p className="text-[hsl(144,20%,65%)] text-sm font-medium drop-shadow-lg px-4">{instruction}</p>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="p-4 flex items-center justify-center gap-6 bg-black/80 backdrop-blur-sm">
        {/* File upload button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={capturing}
          className="w-12 h-12 rounded-xl border border-[hsl(144,20%,65%)]/40 bg-white/5 flex items-center justify-center text-[hsl(144,20%,65%)] hover:bg-[hsl(144,20%,65%)]/10 transition-colors disabled:opacity-50"
          title="Importer une photo"
        >
          <Upload className="w-5 h-5" />
        </button>

        {/* Shutter button */}
        <button
          onClick={takePhoto}
          disabled={capturing || status !== 'ready'}
          className="w-16 h-16 rounded-full border-4 border-[hsl(144,20%,65%)] bg-transparent hover:bg-[hsl(144,20%,65%)]/20 transition-all flex items-center justify-center disabled:opacity-50"
        >
          {capturing ? (
            <Loader2 className="w-7 h-7 text-[hsl(144,20%,65%)] animate-spin" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-[hsl(144,20%,65%)]" />
          )}
        </button>

        {/* Spacer for symmetry */}
        <div className="w-12 h-12" />
      </div>
    </div>
  );
};

export default CameraModal;
