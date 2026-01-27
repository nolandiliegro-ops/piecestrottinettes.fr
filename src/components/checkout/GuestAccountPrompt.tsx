import { motion } from "framer-motion";
import { UserPlus, Sparkles, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GuestAccountPromptProps {
  onCreateAccount: () => void;
  email: string;
}

const GuestAccountPrompt = ({ onCreateAccount, email }: GuestAccountPromptProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.8, duration: 0.6 }}
      className="max-w-lg mx-auto mb-12"
    >
      <div className="relative overflow-hidden bg-white/60 backdrop-blur-xl rounded-2xl border border-mineral/20 p-6 md:p-8">
        {/* Decorative gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-mineral/5 via-transparent to-mineral/10 pointer-events-none" />
        
        {/* Content */}
        <div className="relative">
          {/* Header */}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-mineral/10 flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-mineral" />
            </div>
            <div>
              <h3 className="font-display text-lg text-carbon tracking-wide">
                CRÉEZ VOTRE COMPTE
              </h3>
              <p className="text-sm text-muted-foreground">
                En 1 clic, retrouvez vos commandes
              </p>
            </div>
          </div>
          
          {/* Benefits */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-mineral/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-mineral" />
              </div>
              <p className="text-sm text-muted-foreground">
                Suivez vos commandes en temps réel
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-mineral/10 flex items-center justify-center flex-shrink-0">
                <Gift className="w-4 h-4 text-mineral" />
              </div>
              <p className="text-sm text-muted-foreground">
                Gagnez des points de fidélité à chaque achat
              </p>
            </div>
          </div>
          
          {/* Email preview */}
          <div className="mb-6 p-3 bg-greige/50 rounded-xl border border-mineral/10">
            <p className="text-xs text-muted-foreground mb-1">Votre email</p>
            <p className="text-sm text-carbon font-medium truncate">{email}</p>
          </div>
          
          {/* CTA Button */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={onCreateAccount}
              className="w-full h-14 bg-mineral hover:bg-mineral/90 text-white font-display text-base tracking-widest rounded-xl"
            >
              <UserPlus className="w-5 h-5 mr-3" />
              CRÉER MON COMPTE
            </Button>
          </motion.div>
          
          <p className="text-xs text-muted-foreground text-center mt-4">
            Vous pourrez définir votre mot de passe et accéder à votre espace client.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default GuestAccountPrompt;
