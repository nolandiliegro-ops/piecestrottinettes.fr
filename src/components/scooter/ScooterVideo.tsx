import { motion } from "framer-motion";
import { Play, Youtube } from "lucide-react";

interface ScooterVideoProps {
  youtubeVideoId: string | null;
  scooterName: string;
}

const ScooterVideo = ({ youtubeVideoId, scooterName }: ScooterVideoProps) => {
  if (!youtubeVideoId) return null;

  return (
    <section className="py-12 lg:py-16 bg-card">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto"
        >
          <div className="flex items-center gap-3 mb-6">
            <Youtube className="w-6 h-6 text-red-500" />
            <h2 className="font-display text-3xl lg:text-4xl text-foreground">
              VIDÉO DE PRÉSENTATION
            </h2>
          </div>

          {/* YouTube Embed Container */}
          <div className="relative rounded-2xl overflow-hidden bg-background border border-border shadow-2xl">
            <div className="aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${youtubeVideoId}?rel=0&modestbranding=1`}
                title={`Vidéo ${scooterName}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-center text-muted-foreground mt-4 flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" />
            Découvrez la {scooterName} en action
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
};

export default ScooterVideo;
