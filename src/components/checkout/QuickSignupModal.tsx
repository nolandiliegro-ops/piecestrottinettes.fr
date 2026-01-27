import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, Eye, EyeOff, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface QuickSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  firstName: string;
  lastName: string;
  orderNumber: string;
}

const QuickSignupModal = ({
  isOpen,
  onClose,
  email,
  firstName,
  lastName,
  orderNumber,
}: QuickSignupModalProps) => {
  const { signUp } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayName = `${firstName} ${lastName}`.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Create the account
      const { error: signUpError } = await signUp(email, password, displayName);

      if (signUpError) {
        throw signUpError;
      }

      // 2. Wait a moment for the account to be created
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 3. Try to link the order to the new user
      // First get the user ID from a new session check
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (sessionData.session?.user?.id) {
        // Update the order to link it to the new user
        const { error: updateError } = await supabase
          .from('orders')
          .update({ user_id: sessionData.session.user.id })
          .eq('customer_email', email)
          .eq('order_number', orderNumber);

        if (updateError) {
          console.error('Error linking order to user:', updateError);
          // Don't throw - account was created successfully
        }
      }

      setIsSuccess(true);
      
      toast.success(
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-mineral/20 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-mineral" />
          </div>
          <div>
            <p className="font-display text-carbon tracking-wide">COMPTE CRÉÉ !</p>
            <p className="text-sm text-muted-foreground">Bienvenue {firstName} 🎉</p>
          </div>
        </div>,
        { duration: 5000 }
      );

      // Close modal after success animation
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err: any) {
      console.error('Signup error:', err);
      
      if (err.message?.includes('already registered')) {
        setError("Un compte existe déjà avec cet email. Connectez-vous pour voir votre commande.");
      } else {
        setError(err.message || "Une erreur est survenue. Veuillez réessayer.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden mx-4">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute right-4 top-4 w-8 h-8 rounded-full bg-greige/50 flex items-center justify-center text-muted-foreground hover:text-carbon hover:bg-greige transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Success State */}
              {isSuccess ? (
                <div className="p-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 15 }}
                    className="w-20 h-20 mx-auto mb-6 rounded-full bg-mineral/10 flex items-center justify-center"
                  >
                    <CheckCircle className="w-10 h-10 text-mineral" />
                  </motion.div>
                  <h2 className="font-display text-2xl text-carbon tracking-wide mb-2">
                    BIENVENUE !
                  </h2>
                  <p className="text-muted-foreground">
                    Votre compte a été créé et votre commande liée.
                  </p>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="bg-gradient-to-r from-mineral/10 to-mineral/5 p-6 pt-8">
                    <div className="w-14 h-14 rounded-full bg-mineral/20 flex items-center justify-center mb-4">
                      <Lock className="w-7 h-7 text-mineral" />
                    </div>
                    <h2 className="font-display text-2xl text-carbon tracking-wide mb-1">
                      CRÉER MON COMPTE
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      Définissez votre mot de passe pour activer votre compte
                    </p>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Email (readonly) */}
                    <div className="space-y-2">
                      <Label className="text-carbon">Email</Label>
                      <Input
                        type="email"
                        value={email}
                        disabled
                        className="bg-greige/50 border-greige text-muted-foreground cursor-not-allowed"
                      />
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                      <Label className="text-carbon">Mot de passe *</Label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Minimum 6 caractères"
                          className="pr-10 bg-white/60 border-white/30 focus:border-mineral focus:ring-mineral/20"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-carbon"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                      <Label className="text-carbon">Confirmer le mot de passe *</Label>
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirmez votre mot de passe"
                        className="bg-white/60 border-white/30 focus:border-mineral focus:ring-mineral/20"
                        required
                      />
                    </div>

                    {/* Error Message */}
                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-red-500 bg-red-50 rounded-lg p-3"
                      >
                        {error}
                      </motion.p>
                    )}

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 bg-carbon hover:bg-carbon/90 text-white font-display tracking-widest rounded-xl"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          CRÉATION EN COURS...
                        </>
                      ) : (
                        "CRÉER MON COMPTE"
                      )}
                    </Button>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default QuickSignupModal;
