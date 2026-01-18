import { cn } from '@/lib/utils';

interface ScooterIdentityProps {
  brandName: string;
  modelName: string;
  nickname?: string | null;
  isOwned?: boolean;
  className?: string;
  variant?: 'mobile' | 'desktop';
}

const ScooterIdentity = ({ 
  brandName, 
  modelName, 
  nickname, 
  isOwned, 
  className, 
  variant = 'mobile' 
}: ScooterIdentityProps) => {
  
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
        <h2 className="font-display text-lg text-carbon bg-white/80 backdrop-blur-sm 
                      px-4 py-1.5 rounded-full border-[0.5px] border-mineral/20 flex items-center gap-2">
          <span className="font-bold">{modelName}</span>
          {nickname && (
            <span className="text-mineral/60 font-light text-sm italic">
              « {nickname} »
            </span>
          )}
        </h2>
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
      
      {/* NICKNAME - Subtle distinct style with French quotes */}
      {nickname && (
        <p className="text-sm text-mineral/70 italic font-light">
          « {nickname} »
        </p>
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
