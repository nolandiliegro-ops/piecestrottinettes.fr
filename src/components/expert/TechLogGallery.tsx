import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ImageIcon, Tag } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface Capture {
  id: string;
  component_type: string;
  image_url: string;
  technician_notes: string | null;
  ai_extracted_markers: Record<string, any>;
  created_at: string;
}

interface TechLogGalleryProps {
  modelId: string;
  refreshKey: number;
}

const COMPONENT_LABELS: Record<string, string> = {
  motor_watts: 'Moteur',
  brake_type: 'Frein',
  wheel_size: 'Roue',
  folding_mechanism: 'Pliage',
  led_position: 'LEDs',
};

const TechLogGallery = ({ modelId, refreshKey }: TechLogGalleryProps) => {
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCaptures = useCallback(async () => {
    const { data, error } = await supabase
      .from('expert_captures' as any)
      .select('*')
      .eq('model_id', modelId)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching captures:', error);
    } else {
      setCaptures((data as any) || []);
    }
    setLoading(false);
  }, [modelId]);

  useEffect(() => {
    fetchCaptures();
  }, [fetchCaptures, refreshKey]);

  const saveNotes = async (captureId: string, notes: string) => {
    const { error } = await supabase
      .from('expert_captures' as any)
      .update({ technician_notes: notes } as any)
      .eq('id', captureId);
    if (error) {
      toast.error('Erreur sauvegarde');
    }
  };

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-white font-display text-lg tracking-wide">Carnet de Bord Technique</h2>
        <span className="text-white/40 text-xs">{captures.length} capture{captures.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-[hsl(144,20%,65%)]/30 border-t-[hsl(144,20%,65%)] rounded-full animate-spin" />
        </div>
      ) : captures.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <ImageIcon className="w-10 h-10 text-white/15 mb-2" />
          <p className="text-white/40 text-sm">Aucune capture pour ce modèle</p>
          <p className="text-white/25 text-xs">Activez une mission et capturez</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {captures.map(capture => (
              <div key={capture.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden group hover:border-[hsl(144,20%,65%)]/30 transition-colors">
                {/* Thumbnail */}
                <div className="aspect-[4/3] bg-black/50 relative overflow-hidden">
                  <img
                    src={capture.image_url}
                    alt={capture.component_type}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-0.5 rounded-full bg-[hsl(144,20%,65%)]/20 border border-[hsl(144,20%,65%)]/30 text-[hsl(144,20%,65%)] text-[10px] font-medium uppercase tracking-wider">
                      {COMPONENT_LABELS[capture.component_type] || capture.component_type}
                    </span>
                  </div>
                </div>

                {/* AI Markers */}
                {capture.ai_extracted_markers && Object.keys(capture.ai_extracted_markers).length > 0 && (
                  <div className="px-3 py-2 border-t border-white/5 flex flex-wrap gap-1">
                    {Object.entries(capture.ai_extracted_markers).map(([k, v]) => (
                      <span key={k} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[hsl(144,20%,65%)]/10 text-[hsl(144,20%,65%)] text-[10px]">
                        <Tag className="w-2.5 h-2.5" />
                        {k}: {String(v)}
                      </span>
                    ))}
                  </div>
                )}

                {/* Technician Notes */}
                <div className="p-2.5">
                  <Textarea
                    defaultValue={capture.technician_notes || ''}
                    onBlur={(e) => saveNotes(capture.id, e.target.value)}
                    placeholder="Astuces du Chef Technicien..."
                    className="bg-transparent border-white/10 text-white/80 text-xs placeholder:text-white/20 min-h-[50px] resize-none focus:border-[hsl(144,20%,65%)]/40"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TechLogGallery;
