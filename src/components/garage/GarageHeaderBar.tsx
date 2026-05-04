import { motion } from 'framer-motion';
import { Package, ShoppingBag, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'garage' | 'orders' | 'messages';

interface GarageHeaderBarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  totalUnread: number;
}

/**
 * Extracted header bar (tabs only, post V1.1).
 * The Wallpaper button is now a FAB; XP/avatar live inside RiderProfileCard.
 */
const GarageHeaderBar = ({ activeTab, onTabChange, totalUnread }: GarageHeaderBarProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-center md:justify-start mb-4 shrink-0"
    >
      <div className="grid grid-cols-3 gap-1 w-full md:w-auto md:max-w-md bg-black/30 backdrop-blur-xl border border-white/10 rounded-full p-1">
        <button
          onClick={() => onTabChange('garage')}
          className={cn(
            'flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-xs md:text-sm transition-all min-h-[40px]',
            activeTab === 'garage'
              ? 'bg-white text-carbon shadow-sm'
              : 'text-white/70 hover:text-white'
          )}
        >
          <Package className="w-4 h-4 shrink-0" />
          <span className="font-medium">Garage</span>
        </button>

        <button
          onClick={() => onTabChange('orders')}
          className={cn(
            'flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-xs md:text-sm transition-all min-h-[40px]',
            activeTab === 'orders'
              ? 'bg-white text-carbon shadow-sm'
              : 'text-white/70 hover:text-white'
          )}
        >
          <ShoppingBag className="w-4 h-4 shrink-0" />
          <span className="font-medium">Commandes</span>
        </button>

        <button
          onClick={() => onTabChange('messages')}
          className={cn(
            'relative flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-xs md:text-sm transition-all min-h-[40px]',
            activeTab === 'messages'
              ? 'bg-white text-carbon shadow-sm'
              : 'text-white/70 hover:text-white'
          )}
        >
          <MessageSquare className="w-4 h-4 shrink-0" />
          <span className="font-medium">Messages</span>
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center animate-pulse border-2 border-background">
              {totalUnread > 9 ? '9+' : totalUnread}
            </span>
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default GarageHeaderBar;
