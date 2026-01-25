import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import logoImage from '@/assets/logo-pt.png';

const emailSchema = z.object({
  email: z.string().trim().email({ message: "Email invalide" }),
});

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  
  const { resetPassword } = useAuth();
  const { toast } = useToast();

  const getCooldownKey = (rawEmail: string) => `pw_reset_last_sent_at:${rawEmail.trim().toLowerCase()}`;

  const getRemainingSeconds = (rawEmail: string) => {
    const key = getCooldownKey(rawEmail);
    const last = Number(localStorage.getItem(key) || '0');
    const now = Date.now();
    const diffMs = now - last;
    const remainingMs = 60_000 - diffMs;
    return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
  };

  useEffect(() => {
    // Keep the countdown accurate if the user changes email
    const tick = () => setCooldownRemaining(getRemainingSeconds(email));
    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate email
    const result = emailSchema.safeParse({ email });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    // Anti-spam / anti-invalid-links: 60s cooldown per email
    const remaining = getRemainingSeconds(email);
    if (remaining > 0) {
      setCooldownRemaining(remaining);
      toast({
        title: 'Patientez un instant',
        description: `Vous pourrez redemander un lien dans ${remaining}s.`,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { error: resetError } = await resetPassword(email);
      
      if (resetError) {
        console.error('[ForgotPassword] ❌ Erreur:', resetError.message);
        toast({
          title: "Erreur",
          description: resetError.message === "User not found" 
            ? "Aucun compte associé à cet email"
            : resetError.message,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Succès
      localStorage.setItem(getCooldownKey(email), String(Date.now()));
      setCooldownRemaining(60);
      setEmailSent(true);
      toast({
        title: "Email envoyé !",
        description: "Vérifiez votre boîte de réception pour réinitialiser votre mot de passe.",
      });
    } catch (err) {
      console.error('[ForgotPassword] ❌ Exception:', err);
      toast({
        title: "Erreur réseau",
        description: "Impossible de contacter le serveur. Réessayez.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-greige flex flex-col">
      {/* Back link */}
      <div className="p-6">
        <Link 
          to="/login" 
          className="inline-flex items-center gap-2 text-carbon/60 hover:text-carbon transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Retour à la connexion</span>
        </Link>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <img 
              src={logoImage}
              alt="piècestrottinettes.FR"
              className="h-14 w-auto mx-auto mb-6"
            />
            <h1 className="font-display text-4xl text-carbon tracking-wide">
              MOT DE PASSE OUBLIÉ
            </h1>
            <p className="text-carbon/60 mt-2">
              Entrez votre email pour recevoir un lien de réinitialisation
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white/40 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-lg">
            {emailSent ? (
              // Success state
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <h2 className="font-display text-2xl text-carbon mb-2">
                  EMAIL ENVOYÉ !
                </h2>
                <p className="text-carbon/60 mb-6">
                  Vérifiez votre boîte de réception à l'adresse <strong>{email}</strong>.
                  Cliquez sur le lien pour créer un nouveau mot de passe.
                </p>
                <p className="text-sm text-carbon/50 mb-6">
                  Vous ne voyez pas l'email ? Vérifiez vos spams.
                </p>
                <Link to="/login">
                  <Button 
                    variant="outline" 
                    className="w-full h-12"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Retour à la connexion
                  </Button>
                </Link>
              </div>
            ) : (
              // Form state
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-carbon font-medium">
                    Adresse email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    className="bg-white/60 border-white/30 focus:border-garage focus:ring-garage/30"
                    disabled={isLoading}
                    autoComplete="email"
                  />
                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-garage hover:bg-garage/90 text-garage-foreground font-display text-lg tracking-wide h-12"
                  disabled={isLoading || cooldownRemaining > 0}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : cooldownRemaining > 0 ? (
                    <span className="font-display tracking-wide">RÉESSAYER DANS {cooldownRemaining}s</span>
                  ) : (
                    <>
                      <Mail className="w-5 h-5 mr-2" />
                      ENVOYER LE LIEN
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <p className="text-carbon/60">
                    Vous vous souvenez ?{' '}
                    <Link 
                      to="/login" 
                      className="text-garage font-semibold hover:text-garage/80 transition-colors"
                    >
                      Connexion
                    </Link>
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
