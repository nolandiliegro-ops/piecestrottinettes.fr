import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CenteredScooterStageProps {
  children: ReactNode;
  className?: string;
}

/**
 * Hero stage wrapper — centers the scooter as the dominant visual.
 * Reserves padding so floating glass cards (top-left, top-center, top-right,
 * bottom-*) don't overlap the scooter on desktop.
 */
const CenteredScooterStage = ({ children, className }: CenteredScooterStageProps) => {
  return (
    <div
      className={cn(
        'relative w-full h-full flex items-center justify-center',
        // Reserve safe space for floating cards on desktop
        'lg:pt-[180px] lg:pb-[180px] lg:px-[320px]',
        'pt-4 pb-4 px-4',
        className
      )}
    >
      <div className="w-full max-w-[900px] mx-auto">
        {children}
      </div>
    </div>
  );
};

export default CenteredScooterStage;
