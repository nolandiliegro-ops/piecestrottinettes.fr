import { useState, useRef } from 'react';
import { Camera, Check, Loader2, ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CustomPhotoButtonProps {
  garageItemId: string;
  currentPhotoUrl?: string | null;
  onPhotoUpdated?: (url: string | null) => void;
  className?: string;
}

const CustomPhotoButton = ({ 
  garageItemId, 
  currentPhotoUrl, 
  onPhotoUpdated,
  className 
}: CustomPhotoButtonProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 5 Mo');
      return;
    }

    setIsUploading(true);
    
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Non authentifié');
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${user.id}/${garageItemId}-${Date.now()}.${fileExt}`;

      // Upload to scooter-photos bucket
      const { error: uploadError } = await supabase.storage
        .from('scooter-photos')
        .upload(fileName, file, { 
          upsert: true,
          contentType: file.type 
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('scooter-photos')
        .getPublicUrl(fileName);

      // Update user_garage record
      const { error: updateError } = await supabase
        .from('user_garage')
        .update({ custom_photo_url: publicUrl })
        .eq('id', garageItemId);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      // Invalidate cache and notify
      queryClient.invalidateQueries({ queryKey: ['user-garage'] });
      onPhotoUpdated?.(publicUrl);
      toast.success('Photo ajoutée avec succès !');
      
    } catch (error) {
      console.error('Upload process error:', error);
      toast.error('Erreur lors du téléchargement');
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className={cn(
          "flex items-center gap-2 px-3 py-2 bg-white/80 backdrop-blur-sm",
          "rounded-full border border-mineral/30 shadow-sm",
          "text-sm font-medium text-carbon",
          "hover:bg-white hover:border-mineral/50 transition-all",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
      >
        {isUploading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-mineral" />
            <span>Upload...</span>
          </>
        ) : currentPhotoUrl ? (
          <>
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Modifier</span>
          </>
        ) : (
          <>
            <Camera className="w-4 h-4 text-mineral" />
            <span>Ma photo</span>
          </>
        )}
      </button>
    </>
  );
};

export default CustomPhotoButton;
