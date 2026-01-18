import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getBrandColors, BrandColorConfig } from '@/contexts/ScooterContext';

interface ScooterIdentityProps {
  brandName: string;
  modelName: string;
  nickname?: string | null;
  isOwned?: boolean;
  className?: string;
  variant?: 'mobile' | 'desktop';
  editable?: boolean;
  garageItemId?: string;
  onNicknameChange?: (nickname: string) => void;
  brandColors?: BrandColorConfig;
}

const ScooterIdentity = ({ 
  brandName, 
  modelName, 
  nickname, 
  isOwned, 
  className, 
  variant = 'mobile',
  editable = false,
  garageItemId,
  onNicknameChange,
  brandColors
}: ScooterIdentityProps) => {
  // Dynamic brand colors for nickname styling
  const colors = brandColors || getBrandColors(brandName);
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
      // Non-editable: dynamic brand color display with glow
      return nickname ? (
        <motion.p 
          key={brandName}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={cn("text-sm italic font-light", colors.textClass)}
          style={{ textShadow: `0 0 12px ${colors.glowColor}` }}
        >
          « {nickname} »
        </motion.p>
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
                className={cn(
                  "bg-transparent outline-none text-sm italic font-light",
                  "text-center min-w-[120px] max-w-[200px] py-1 px-2 transition-colors duration-200",
                  "border-b focus:border-opacity-100",
                  colors.textClass,
                  colors.borderClass
                )}
                style={{ textShadow: `0 0 8px ${colors.glowColor}` }}
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
              className={cn(
                "group flex items-center gap-1.5 text-sm italic font-light cursor-pointer py-1",
                "hover:opacity-80 transition-all",
                nickname ? colors.textClass : "text-mineral/40"
              )}
              style={{ textShadow: nickname ? `0 0 8px ${colors.glowColor}` : 'none' }}
            >
              {nickname ? (
                <>
                  <span>« {nickname} »</span>
                  <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </>
              ) : (
                <>
                  <span className="not-italic">Ajouter un surnom</span>
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
      <div className={cn("flex flex-col items-center gap-1", className)}>
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
            <motion.span 
              key={brandName}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className={cn("font-light text-sm italic", colors.textClass)}
              style={{ textShadow: `0 0 8px ${colors.glowColor}` }}
            >
              « {nickname} »
            </motion.span>
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
