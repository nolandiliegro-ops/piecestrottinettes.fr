import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, Check, X, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PersonalDescriptionProps {
  garageItemId: string;
  initialDescription: string | null;
  onUpdate: (description: string) => Promise<void>;
  className?: string;
}

const MAX_CHARS = 500;

const PersonalDescription = ({ 
  garageItemId, 
  initialDescription, 
  onUpdate,
  className 
}: PersonalDescriptionProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(initialDescription || '');
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync with prop changes
  useEffect(() => {
    setDescription(initialDescription || '');
  }, [initialDescription]);

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // Move cursor to end
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
    }
  }, [isEditing]);

  const handleSave = async () => {
    const trimmed = description.trim();
    
    if (trimmed === (initialDescription || '')) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onUpdate(trimmed);
      setIsEditing(false);
    } catch (error) {
      // Error handling is done in the parent hook
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setDescription(initialDescription || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    }
    // Ctrl/Cmd + Enter to save
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSave();
    }
  };

  const charCount = description.length;
  const isOverLimit = charCount > MAX_CHARS;

  // Display mode
  if (!isEditing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "bg-white/60 backdrop-blur-sm border-[0.5px] border-mineral/20 rounded-xl p-4",
          className
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-mineral/60" />
            <span className="text-xs font-semibold text-carbon/60 uppercase tracking-wider">
              Ma Description
            </span>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="p-1.5 text-mineral/60 hover:text-mineral hover:bg-mineral/10 
                       rounded-lg transition-colors"
            aria-label="Modifier la description"
          >
            <Pencil className="w-4 h-4" />
          </button>
        </div>

        {description ? (
          <p className="text-sm text-carbon/80 leading-relaxed whitespace-pre-wrap">
            {description}
          </p>
        ) : (
          <p className="text-sm text-carbon/40 italic">
            Décrivez votre trottinette : modifications, usage, anecdotes...
          </p>
        )}
      </motion.div>
    );
  }

  // Edit mode
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "bg-white/80 backdrop-blur-sm border-[0.5px] border-mineral/30 rounded-xl p-4",
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Pencil className="w-4 h-4 text-mineral" />
          <span className="text-xs font-semibold text-carbon/80 uppercase tracking-wider">
            Modifier la Description
          </span>
        </div>
        <span className={cn(
          "text-xs font-medium transition-colors",
          isOverLimit ? "text-red-500" : "text-carbon/50"
        )}>
          {charCount}/{MAX_CHARS}
        </span>
      </div>

      <textarea
        ref={textareaRef}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Décrivez votre trottinette : modifications, usage, anecdotes..."
        className={cn(
          "w-full bg-white/90 rounded-lg p-3 text-sm text-carbon",
          "border-[0.5px] focus:border-mineral outline-none",
          "resize-none transition-colors",
          "placeholder:text-carbon/30",
          isOverLimit ? "border-red-300" : "border-mineral/20"
        )}
        rows={5}
        maxLength={MAX_CHARS + 50}
      />

      <div className="flex items-center justify-end gap-2 mt-3">
        <button
          onClick={handleCancel}
          disabled={isSaving}
          className="px-4 py-2 text-sm font-medium text-carbon/60 hover:text-carbon
                     bg-white/60 hover:bg-white/80 rounded-lg border-[0.5px] border-mineral/20
                     transition-all disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center gap-1.5"
        >
          <X className="w-4 h-4" />
          Annuler
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving || isOverLimit}
          className="px-4 py-2 text-sm font-medium text-white
                     bg-mineral hover:bg-mineral/90 rounded-lg
                     transition-all disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center gap-1.5"
        >
          {isSaving ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Check className="w-4 h-4" />
              </motion.div>
              Enregistrement...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Enregistrer
            </>
          )}
        </button>
      </div>

      <p className="text-[10px] text-carbon/40 mt-2 text-center">
        Astuce : Ctrl+Entrée pour sauvegarder, Échap pour annuler
      </p>
    </motion.div>
  );
};

export default PersonalDescription;
