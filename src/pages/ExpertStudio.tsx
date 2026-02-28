import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MissionEngine from '@/components/expert/MissionEngine';
import GhostFrameCamera from '@/components/expert/GhostFrameCamera';
import TechLogGallery from '@/components/expert/TechLogGallery';
import { toast } from 'sonner';

interface ScooterModel {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  technical_signature: Record<string, any> | null;
  brand: { name: string } | null;
}

const ExpertStudio = () => {
  const { id } = useParams<{ id: string }>();
  const [model, setModel] = useState<ScooterModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeMission, setActiveMission] = useState<{ key: string; label: string; type: string } | null>(null);
  const [captureRefreshKey, setCaptureRefreshKey] = useState(0);

  useEffect(() => {
    if (!id) return;
    fetchModel();
  }, [id]);

  const fetchModel = async () => {
    const { data, error } = await supabase
      .from('scooter_models')
      .select('id, name, slug, image_url, technical_signature, brand:brands(name)')
      .eq('id', id!)
      .single();
    if (error) {
      toast.error('Modèle introuvable');
      setLoading(false);
      return;
    }
    setModel(data as any);
    setLoading(false);
  };

  const handleSignatureUpdate = async (markers: Record<string, any>) => {
    if (!model) return;
    const currentSig = (model.technical_signature || {}) as Record<string, any>;
    const merged = { ...currentSig, ...markers };
    const { error } = await supabase
      .from('scooter_models')
      .update({ technical_signature: merged } as any)
      .eq('id', model.id);
    if (error) {
      toast.error('Erreur lors de la fusion');
      return;
    }
    setModel(prev => prev ? { ...prev, technical_signature: merged } : prev);
    toast.success('ADN technique fusionné ✓');
  };

  const handleCaptureComplete = () => {
    setCaptureRefreshKey(k => k + 1);
    setActiveMission(null);
  };

  // Compute signature completion
  const SIGNATURE_KEYS = ['brake_type', 'motor_watts', 'wheel_size', 'folding_mechanism', 'led_position'];
  const sig = (model?.technical_signature || {}) as Record<string, any>;
  const filledCount = SIGNATURE_KEYS.filter(k => sig[k] !== null && sig[k] !== undefined && sig[k] !== '').length;
  const completionPct = Math.round((filledCount / SIGNATURE_KEYS.length) * 100);

  if (loading) {
    return (
      <div className="h-screen bg-[hsl(30,14%,95%)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(144,20%,65%)]" />
      </div>
    );
  }

  if (!model) {
    return (
      <div className="h-screen bg-[hsl(30,14%,95%)] flex items-center justify-center">
        <p className="text-foreground/60">Modèle non trouvé</p>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-[hsl(30,14%,95%)] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-[hsl(144,20%,65%)]/20 bg-[hsl(0,0%,10%)]/95 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link to="/admin">
            <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-white/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <p className="text-[hsl(144,20%,65%)] text-xs font-medium tracking-widest uppercase">
              {model.brand?.name || 'Marque'}
            </p>
            <h1 className="text-white font-display text-xl tracking-wide">{model.name}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Completion badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[hsl(144,20%,65%)]/10 border border-[hsl(144,20%,65%)]/30">
            <div className="w-2 h-2 rounded-full" style={{
              background: completionPct === 100 ? 'hsl(144,20%,65%)' : completionPct > 50 ? 'hsl(38,92%,50%)' : 'hsl(0,84%,60%)'
            }} />
            <span className="text-white text-xs font-medium">{completionPct}% ADN</span>
          </div>
          <a href={`/scooter/${model.slug}`} target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="icon" className="text-[hsl(144,20%,65%)] hover:bg-[hsl(144,20%,65%)]/10">
              <ExternalLink className="w-5 h-5" />
            </Button>
          </a>
        </div>
      </header>

      {/* Bento Grid - 100vh minus header */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 p-3 overflow-hidden">
        {/* Top Left: Missions */}
        <div className={`rounded-2xl bg-[hsl(0,0%,10%)]/95 backdrop-blur-md border overflow-hidden transition-all duration-500 ${
          activeMission ? 'border-[hsl(144,20%,65%)] shadow-[0_0_15px_rgba(147,181,161,0.3)]' : 'border-[hsl(144,20%,65%)]/20'
        }`}>
          <MissionEngine
            signature={model.technical_signature as Record<string, any> || {}}
            activeMission={activeMission}
            onSelectMission={setActiveMission}
          />
        </div>

        {/* Top Right: Camera */}
        <div className="rounded-2xl bg-[hsl(0,0%,10%)]/95 backdrop-blur-md border border-[hsl(144,20%,65%)]/20 overflow-hidden">
          <GhostFrameCamera
            modelId={model.id}
            activeMission={activeMission}
            onCaptureComplete={handleCaptureComplete}
            onMergeMarkers={handleSignatureUpdate}
          />
        </div>

        {/* Bottom: Tech Log Gallery spanning full width on mobile, split on desktop */}
        <div className="md:col-span-2 rounded-2xl bg-[hsl(0,0%,10%)]/95 backdrop-blur-md border border-[hsl(144,20%,65%)]/20 overflow-hidden">
          <TechLogGallery modelId={model.id} refreshKey={captureRefreshKey} />
        </div>
      </div>
    </div>
  );
};

export default ExpertStudio;
