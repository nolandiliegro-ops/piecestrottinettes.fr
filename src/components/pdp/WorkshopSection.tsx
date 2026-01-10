import { motion } from "framer-motion";
import { Wrench, Play } from "lucide-react";

interface WorkshopSectionProps {
  youtubeVideoId: string | null;
  productName: string;
}

const WorkshopSection = ({ youtubeVideoId, productName }: WorkshopSectionProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="h-full bg-white/40 backdrop-blur-md border border-white/20 rounded-2xl p-5 md:p-6 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/20">
        <Wrench className="w-5 h-5 text-mineral" />
        <h2 className="font-display text-lg uppercase tracking-wide text-carbon">
          Studio Workshop
        </h2>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center">
        {youtubeVideoId ? (
          <div className="w-full aspect-video rounded-xl overflow-hidden bg-carbon/5">
            <iframe
              src={`https://www.youtube.com/embed/${youtubeVideoId}`}
              title={`Tutoriel installation ${productName}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="flex flex-col items-center justify-center text-center p-6"
          >
            <div className="relative mb-5">
              <div className="w-16 h-16 rounded-full bg-mineral/10 flex items-center justify-center">
                <Wrench className="w-8 h-8 text-mineral/50" />
              </div>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center"
              >
                <Play className="w-3 h-3 text-amber-600" />
              </motion.div>
            </div>
            
            <p className="font-display text-xl text-carbon/70 uppercase tracking-wide mb-2">
              Tutoriel en cours de certification
            </p>
            <p className="text-sm text-carbon/50 max-w-[200px]">
              par nos experts techniques
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default WorkshopSection;
