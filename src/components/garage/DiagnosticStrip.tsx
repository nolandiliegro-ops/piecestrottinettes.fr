import { Zap, Gauge, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DiagnosticStripProps {
  voltage?: number | null;
  amperage?: number | null;
  power?: number | null;
  className?: string;
}

const DiagnosticStrip = ({ voltage, amperage, power, className }: DiagnosticStripProps) => {
  return (
    <div className={cn(
      "flex items-center justify-between bg-white/60 backdrop-blur-xl border-[0.5px] border-mineral/20 rounded-full px-4 py-2.5",
      className
    )}>
      {/* Voltage */}
      <div className="flex items-center gap-1.5">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-sm">
          <Zap className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="flex items-baseline gap-0.5">
          <span className="text-lg font-bold text-carbon">{voltage || '-'}</span>
          <span className="text-[10px] text-carbon/50 font-medium">V</span>
        </div>
      </div>
      
      <div className="w-px h-6 bg-mineral/20" />
      
      {/* Amperage */}
      <div className="flex items-center gap-1.5">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center shadow-sm">
          <Gauge className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="flex items-baseline gap-0.5">
          <span className="text-lg font-bold text-carbon">{amperage || '-'}</span>
          <span className="text-[10px] text-carbon/50 font-medium">A</span>
        </div>
      </div>
      
      <div className="w-px h-6 bg-mineral/20" />
      
      {/* Power */}
      <div className="flex items-center gap-1.5">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-sm">
          <Activity className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="flex items-baseline gap-0.5">
          <span className="text-lg font-bold text-carbon">{power || '-'}</span>
          <span className="text-[10px] text-carbon/50 font-medium">W</span>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticStrip;
