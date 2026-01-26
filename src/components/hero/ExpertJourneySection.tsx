import { motion } from "framer-motion";
import { Scan, Wrench, Zap, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

const steps = [
  {
    number: "01",
    icon: Scan,
    title: "IDENTIFIEZ",
    description: "Scannez ou recherchez votre modèle"
  },
  {
    number: "02",
    icon: Wrench,
    title: "ACCÉDEZ",
    description: "Pièces 100% compatibles"
  },
  {
    number: "03",
    icon: Zap,
    title: "ROULEZ",
    description: "Livraison express"
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 }
  }
};

const ExpertJourneySection = () => {
  const navigate = useNavigate();

  const triggerHaptic = () => {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  return (
    <section className="lg:hidden px-4 pt-0 pb-6 -mt-12 relative z-10">
      {/* Accroche UX */}
      <motion.p
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center text-sm text-muted-foreground mb-4 font-medium"
      >
        Ne perdez plus de temps avec des pièces incompatibles.
      </motion.p>

      {/* Steps Container */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="bg-white/80 backdrop-blur-2xl rounded-3xl p-5 border-[0.5px] border-white/50 shadow-[0_-8px_30px_rgba(0,0,0,0.08),0_4px_20px_rgba(0,0,0,0.05)]"
      >
        {/* 3 Steps Grid */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {steps.map((step) => (
            <motion.div
              key={step.number}
              variants={itemVariants}
              className="flex flex-col items-center text-center"
            >
              {/* Step Number */}
              <span className="text-[10px] font-bold text-mineral/40 tracking-widest mb-1.5">
                {step.number}
              </span>
              
              {/* Icon Container */}
              <div className="w-10 h-10 rounded-xl bg-mineral/10 flex items-center justify-center mb-2">
                <step.icon className="w-5 h-5 text-carbon" />
              </div>
              
              {/* Title */}
              <h3 className="font-display text-xs text-carbon uppercase tracking-wide mb-1">
                {step.title}
              </h3>
              
              {/* Description */}
              <p className="text-[10px] text-muted-foreground leading-snug">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* CTA Primary - Scanner */}
        <motion.button
          onClick={() => {
            triggerHaptic();
            // Scanner functionality - for now just visual
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          animate={{ scale: [1, 1.01, 1] }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
          className="w-full py-4 bg-carbon text-white rounded-full font-display uppercase tracking-wide text-sm flex items-center justify-center gap-2 shadow-lg"
        >
          <Scan className="w-5 h-5" />
          Scanner ma Trottinette
        </motion.button>

        {/* CTA Secondary - Catalogue avec Scroll Smooth */}
        <motion.button
          onClick={() => {
            triggerHaptic();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setTimeout(() => navigate('/catalogue'), 300);
          }}
          whileTap={{ scale: 0.98 }}
          className="w-full mt-3 py-2 text-sm text-mineral hover:text-carbon transition-colors underline-offset-4 hover:underline"
        >
          Voir tout le catalogue sans filtrer →
        </motion.button>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        className="flex justify-center pt-5"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <ChevronDown className="w-6 h-6 text-mineral/40" />
      </motion.div>
    </section>
  );
};

export default ExpertJourneySection;
