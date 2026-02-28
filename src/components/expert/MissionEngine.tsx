import { Zap, Shield, Circle, Maximize2, Lightbulb, CheckCircle2 } from 'lucide-react';

const SIGNATURE_FIELDS = [
  { key: 'motor_watts', label: 'Puissance Moteur', icon: Zap, ghostType: 'circle', instruction: 'Photographiez la gravure du moyeu moteur' },
  { key: 'brake_type', label: 'Type de Frein', icon: Shield, ghostType: 'rectangle', instruction: 'Photographiez le système de freinage' },
  { key: 'wheel_size', label: 'Taille des Roues', icon: Circle, ghostType: 'rectangle', instruction: 'Photographiez le flanc du pneu' },
  { key: 'folding_mechanism', label: 'Mécanisme de Pliage', icon: Maximize2, ghostType: 'rectangle', instruction: 'Photographiez le mécanisme de pliage' },
  { key: 'led_position', label: 'Position LEDs', icon: Lightbulb, ghostType: 'rectangle', instruction: 'Photographiez l\'éclairage LED' },
];

interface Mission {
  key: string;
  label: string;
  type: string;
}

interface MissionEngineProps {
  signature: Record<string, any>;
  activeMission: Mission | null;
  onSelectMission: (mission: Mission | null) => void;
}

const MissionEngine = ({ signature, activeMission, onSelectMission }: MissionEngineProps) => {
  const missions = SIGNATURE_FIELDS.filter(f => {
    const val = signature[f.key];
    return val === null || val === undefined || val === '';
  });

  const completed = SIGNATURE_FIELDS.filter(f => {
    const val = signature[f.key];
    return val !== null && val !== undefined && val !== '';
  });

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-white font-display text-lg tracking-wide">Missions Techniques</h2>
        <span className="text-[hsl(144,20%,65%)] text-xs font-medium">
          {completed.length}/{SIGNATURE_FIELDS.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 scrollbar-hide">
        {missions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <CheckCircle2 className="w-10 h-10 text-[hsl(144,20%,65%)] mb-2" />
            <p className="text-white/80 text-sm font-medium">ADN complet</p>
            <p className="text-white/40 text-xs">Toutes les missions sont terminées</p>
          </div>
        ) : (
          missions.map(mission => {
            const Icon = mission.icon;
            const isActive = activeMission?.key === mission.key;
            return (
              <button
                key={mission.key}
                onClick={() => onSelectMission(isActive ? null : { key: mission.key, label: mission.label, type: mission.ghostType })}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300 text-left group ${
                  isActive
                    ? 'bg-[hsl(144,20%,65%)]/15 border border-[hsl(144,20%,65%)] shadow-[0_0_12px_rgba(147,181,161,0.25)]'
                    : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[hsl(144,20%,65%)]/40'
                }`}
              >
                <div className={`p-2 rounded-lg transition-colors ${
                  isActive ? 'bg-[hsl(144,20%,65%)]/20' : 'bg-white/5 group-hover:bg-[hsl(144,20%,65%)]/10'
                }`}>
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[hsl(144,20%,65%)]' : 'text-white/60 group-hover:text-[hsl(144,20%,65%)]'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isActive ? 'text-[hsl(144,20%,65%)]' : 'text-white/90'}`}>
                    {mission.label}
                  </p>
                  <p className="text-xs text-white/40 truncate">{mission.instruction}</p>
                </div>
                {isActive && (
                  <div className="w-2 h-2 rounded-full bg-[hsl(144,20%,65%)] animate-pulse" />
                )}
              </button>
            );
          })
        )}

        {/* Completed section */}
        {completed.length > 0 && (
          <div className="pt-3 border-t border-white/10">
            <p className="text-white/30 text-xs uppercase tracking-wider mb-2">Complétées</p>
            {completed.map(field => {
              const Icon = field.icon;
              return (
                <div key={field.key} className="flex items-center gap-3 p-2 rounded-lg opacity-50">
                  <Icon className="w-3.5 h-3.5 text-[hsl(144,20%,65%)]" />
                  <span className="text-white/50 text-xs">{field.label}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[hsl(144,20%,65%)] ml-auto" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MissionEngine;
