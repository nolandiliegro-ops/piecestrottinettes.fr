import { cn } from "@/lib/utils";

interface DifficultyIndicatorProps {
  level: number | null;
  showLabel?: boolean;
  className?: string;
}

const difficultyLabels: Record<number, string> = {
  1: "Très facile",
  2: "Facile",
  3: "Moyen",
  4: "Difficile",
  5: "Expert",
};

const DifficultyIndicator = ({ 
  level, 
  showLabel = false, 
  className 
}: DifficultyIndicatorProps) => {
  const safeLevel = Math.min(Math.max(level || 1, 1), 5);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((dot) => (
          <div
            key={dot}
            className={cn(
              "w-1.5 h-1.5 rounded-full transition-colors",
              dot <= safeLevel
                ? "bg-mineral"
                : "bg-muted-foreground/20"
            )}
          />
        ))}
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground">
          {difficultyLabels[safeLevel]}
        </span>
      )}
    </div>
  );
};

export default DifficultyIndicator;
