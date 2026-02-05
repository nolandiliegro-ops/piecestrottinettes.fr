import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScooterIdentityProps {
  brandName: string;
  modelName: string;
  nickname?: string | null;
  description?: string | null;
  isOwned?: boolean;
  className?: string;
  variant?: 'mobile' | 'desktop';
  editable?: boolean;
  garageItemId?: string;
  onNicknameChange?: (nickname: string) => void;
  onReadMoreClick?: () => void;
}

const ScooterIdentity = ({ 
  brandName, 
  modelName, 
  nickname, 
  description,
  isOwned, 
  className, 
  variant = 'mobile',
  editable = false,
  garageItemId,
  onNicknameChange,
  onReadMoreClick
}: ScooterIdentityProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(nickname || '');
  const [showSuccess, setShowSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync edit value when nickname changes
  useEffect(() => {
    setEditValue(nickname || '');
  }, [nickname]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const trimmedValue = editValue.trim();
    if (trimmedValue !== (nickname || '')) {
      onNicknameChange?.(trimmedValue);
      // Show success feedback
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1500);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(nickname || '');
      setIsEditing(false);
    }
  };

  const NicknameDisplay = () => {
    if (!editable) {
      // Non-editable: simple display
      return nickname ? (
        <p className="text-sm text-mineral/70 italic font-light">
          « {nickname} »
        </p>
      ) : null;
    }

    // Editable mode
    return (
      <div className="flex items-center justify-center gap-2">
        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div
              key="input"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="relative"
            >
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                placeholder="Donner un surnom..."
                className="bg-transparent border-b border-mineral/30 focus:border-mineral 
                          outline-none text-sm text-carbon/70 italic font-light 
                          text-center min-w-[120px] max-w-[200px] py-1 px-2
                          transition-colors duration-200"
              />
            </motion.div>
          ) : (
            <motion.button
              key="display"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              onClick={() => setIsEditing(true)}
              className="group flex items-center gap-1.5 text-sm text-mineral/70 italic font-light 
                        hover:text-mineral transition-colors cursor-pointer py-1"
            >
              {nickname ? (
                <>
                  <span>« {nickname} »</span>
                  <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </>
              ) : (
                <>
                  <span className="text-mineral/40 not-italic">Ajouter un surnom</span>
                  <Pencil className="w-3 h-3 opacity-50" />
                </>
              )}
            </motion.button>
          )}
        </AnimatePresence>

        {/* Success indicator */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.2 }}
              className="text-emerald-500"
            >
              <Check className="w-4 h-4" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  if (variant === 'desktop') {
    // Desktop: Horizontal inline layout with backdrop
    return (
      <div className={cn("flex flex-col items-center gap-1 ml-[70px]", className)}>
        {/* Brand Tag */}
        <span className="px-2 py-0.5 bg-mineral/10 backdrop-blur-sm rounded-full text-[9px] font-semibold 
                        text-mineral uppercase tracking-[0.15em] border-[0.5px] border-mineral/20">
          {brandName}
        </span>
        
        {/* Model + Nickname Badge */}
        <div className="font-display text-lg text-carbon bg-white/80 backdrop-blur-sm 
                      px-4 py-1.5 rounded-full border-[0.5px] border-mineral/20 flex items-center gap-2">
          <span className="font-bold">{modelName}</span>
          {editable ? (
            <NicknameDisplay />
          ) : nickname && (
            <span className="text-mineral/60 font-light text-sm italic">
              « {nickname} »
            </span>
          )}
        </div>
      </div>
    );
  }

  // Mobile: Vertical centered layout
  return (
    <div className={cn("text-center space-y-1.5", className)}>
      {/* BRAND - Micro-caps tag */}
      <div className="inline-flex items-center justify-center">
        <span className="px-3 py-1 bg-mineral/10 backdrop-blur-sm rounded-full 
                        text-[10px] font-semibold text-mineral uppercase tracking-[0.2em]
                        border-[0.5px] border-mineral/20">
          {brandName}
        </span>
      </div>
      
      {/* MODEL - Bold Studio Typography */}
      <h1 className="font-display text-2xl font-bold text-carbon tracking-tight">
        {modelName}
      </h1>
      
      {/* NICKNAME - Editable or Display */}
      <NicknameDisplay />

      {/* DESCRIPTION - Short preview with Read More */}
      {description && (
        <div className="mt-3 px-4">
          <p className="text-sm text-carbon/70 line-clamp-2 leading-relaxed">
            {description}
          </p>
          {onReadMoreClick && (
            <button
              onClick={onReadMoreClick}
              className="inline-flex items-center gap-1 mt-1.5 text-xs text-mineral hover:text-mineral/80 transition-colors"
            >
              <span>Lire la suite</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
      
      {/* Owned Status Badge */}
      {isOwned && (
        <div className="inline-flex items-center gap-1.5 text-[10px] text-emerald-600 mt-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium">Mon écurie</span>
        </div>
      )}
    </div>
  );
};

export default ScooterIdentity;
