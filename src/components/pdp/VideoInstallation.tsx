import { motion } from "framer-motion";
import { Play } from "lucide-react";

interface VideoInstallationProps {
  youtubeVideoId: string;
  productName: string;
}

const VideoInstallation = ({ youtubeVideoId, productName }: VideoInstallationProps) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
      className="w-full max-w-4xl mx-auto"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[hsl(var(--mineral))]/10 flex items-center justify-center">
          <Play className="w-5 h-5 text-[hsl(var(--mineral))]" />
        </div>
        <h2 className="font-black text-[hsl(var(--carbon))] uppercase tracking-tight text-xl">
          Vidéo d'installation
        </h2>
      </div>

      <div className="rounded-2xl overflow-hidden shadow-md bg-white/40 backdrop-blur-sm border border-white/20">
        <div className="aspect-video">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeVideoId}`}
            title={`Tutoriel installation ${productName}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      </div>
    </motion.section>
  );
};

export default VideoInstallation;
