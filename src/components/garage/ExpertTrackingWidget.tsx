import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Euro, Trophy, Wrench, Calendar, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ExpertTrackingWidgetProps {
  garageItemId: string;
  scooterName: string;
  lastMaintenanceDate?: string | null;
  userId?: string;
  className?: string;
}

// Confetti Explosion Component
const ConfettiExplosion = () => {
  const colors = ['#93B5A1', '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#F5A623'];
  
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {[...Array(60)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            opacity: 1, 
            y: '50vh', 
            x: '50vw',
            scale: 0,
            rotate: 0
          }}
          animate={{ 
            opacity: [1, 1, 0],
            y: `${Math.random() * -80 - 20}vh`,
            x: `${50 + (Math.random() - 0.5) * 80}vw`,
            scale: [0, 1, 0.8],
            rotate: Math.random() * 720 - 360
          }}
          transition={{ 
            duration: 2 + Math.random() * 0.5, 
            ease: 'easeOut',
            delay: Math.random() * 0.2
          }}
          className="absolute w-3 h-3"
          style={{
            backgroundColor: colors[i % colors.length],
            borderRadius: Math.random() > 0.5 ? '50%' : '2px'
          }}
        />
      ))}
    </div>
  );
};

const ExpertTrackingWidget = ({ 
  garageItemId, 
  scooterName, 
  lastMaintenanceDate,
  userId,
  className 
}: ExpertTrackingWidgetProps) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();
  
  // Mocked data for MVP
  const totalInvested = 245;
  const machinePoints = 125;

  const handleMarkMaintenance = async () => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    
    try {
      const { error } = await supabase
        .from('user_garage')
        .update({ last_maintenance_date: new Date().toISOString() })
        .eq('id', garageItemId);

      if (error) throw error;

      // Trigger confetti
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      
      // Show success toast
      toast.success('🎉 Révision enregistrée !', {
        description: `${scooterName} marquée comme révisée`
      });
      
      // Invalidate cache to refetch
      queryClient.invalidateQueries({ queryKey: ['user-garage'] });
      
    } catch (error) {
      console.error('Error marking maintenance:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <>
      <div className={cn(
        "bg-white/60 border border-mineral/20 rounded-xl p-4 space-y-3",
        className
      )}>
        {/* Header */}
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-mineral" />
          <h3 className="font-display text-xs text-carbon uppercase tracking-wide">
            Suivi Expert
          </h3>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* Total Investi */}
          <div className="bg-greige/40 rounded-lg p-2.5 text-center">
            <Euro className="w-4 h-4 text-amber-600 mx-auto mb-0.5" />
            <p className="text-lg font-bold text-[#1A1A1A]">{totalInvested}€</p>
            <p className="text-[9px] text-carbon/50 uppercase tracking-wide">Total Investi</p>
          </div>

          {/* Points Machine */}
          <div className="bg-greige/40 rounded-lg p-2.5 text-center">
            <Trophy className="w-4 h-4 text-mineral mx-auto mb-0.5" />
            <p className="text-lg font-bold text-mineral">{machinePoints}</p>
            <p className="text-[9px] text-carbon/50 uppercase tracking-wide">Points Cockpit</p>
          </div>
        </div>

        {/* Last Maintenance Date */}
        <AnimatePresence mode="wait">
          {lastMaintenanceDate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center justify-center gap-2 py-2 bg-emerald-50/60 rounded-lg"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <div className="text-center">
                <p className="text-[10px] text-carbon/50">Dernière révision</p>
                <p className="text-xs font-semibold text-emerald-700">
                  {formatDate(lastMaintenanceDate)}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mark as Revised Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleMarkMaintenance}
          disabled={isUpdating}
          className={cn(
            "w-full py-2.5 px-4 rounded-xl font-semibold text-white text-sm",
            "bg-[#93B5A1] hover:bg-[#7ea38f] transition-all duration-200",
            "shadow-md hover:shadow-lg flex items-center justify-center gap-2",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {isUpdating ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Wrench className="w-4 h-4" />
            </motion.div>
          ) : (
            <>
              <Wrench className="w-4 h-4" />
              Marquer comme Révisée
            </>
          )}
        </motion.button>
      </div>

      {/* Confetti Effect */}
      <AnimatePresence>
        {showConfetti && <ConfettiExplosion />}
      </AnimatePresence>
    </>
  );
};

export default ExpertTrackingWidget;
