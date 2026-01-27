import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  Key, 
  Bike, 
  Heart, 
  Package, 
  LogOut, 
  Trash2,
  ChevronRight,
  Edit2,
  Check,
  X,
  Gem,
  ArrowLeft
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useProfile } from "@/hooks/useProfile";
import { formatPrice } from "@/lib/formatPrice";
import { supabase } from "@/integrations/supabase/client";

const passwordSchema = z.object({
  newPassword: z.string().min(6, "Minimum 6 caractères"),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

const Profile = () => {
  const navigate = useNavigate();
  const { 
    profile, 
    isLoading, 
    user, 
    updateProfile, 
    garageStats, 
    orderStats,
    changePassword,
  } = useProfile();
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState("");
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Check if user signed up with OAuth (Google, etc.)
  const isOAuth = user?.app_metadata?.provider !== "email";
  
  // Format registration date
  const registrationDate = user?.created_at 
    ? new Date(user.created_at).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

  // Get user initials for avatar
  const getInitials = () => {
    if (profile?.display_name) {
      const parts = profile.display_name.split(" ");
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return profile.display_name.substring(0, 2).toUpperCase();
    }
    return user?.email?.substring(0, 2).toUpperCase() || "PT";
  };

  const handleSaveName = async () => {
    if (editName.trim()) {
      await updateProfile.mutateAsync({ display_name: editName.trim() });
      setIsEditingName(false);
    }
  };

  const handleCancelEdit = () => {
    setEditName(profile?.display_name || "");
    setIsEditingName(false);
  };

  const handlePasswordSubmit = async (data: PasswordFormData) => {
    await changePassword.mutateAsync(data.newPassword);
    passwordForm.reset();
    setShowPasswordForm(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-greige">
        <Header />
        <main className="pt-24 pb-16 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-40 bg-white/40 rounded-2xl" />
              <div className="h-32 bg-white/40 rounded-2xl" />
              <div className="h-32 bg-white/40 rounded-2xl" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-greige">
      <Header />
      
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Back Navigation */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8"
          >
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-carbon transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Retour à l'accueil</span>
            </Link>
          </motion.div>

          {/* Page Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-4 mb-10"
          >
            <div className="w-14 h-14 rounded-2xl bg-mineral/10 flex items-center justify-center">
              <User className="w-7 h-7 text-mineral" />
            </div>
            <div>
              <h1 className="font-display text-3xl md:text-4xl text-carbon tracking-wide">
                MON PROFIL
              </h1>
              <p className="text-muted-foreground">
                Gérez vos informations personnelles
              </p>
            </div>
          </motion.div>

          <div className="space-y-6">
            {/* Identity Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/20 p-6 md:p-8"
            >
              <div className="flex items-start gap-6">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-mineral to-mineral-dark flex items-center justify-center text-white font-display text-2xl md:text-3xl shadow-lg">
                    {getInitials()}
                  </div>
                  {/* Performance Points Badge */}
                  {profile?.performance_points && profile.performance_points > 0 && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.4, type: "spring" }}
                      className="absolute -bottom-2 -right-2 flex items-center gap-1 px-2 py-1 bg-white rounded-full shadow-md border border-mineral/20"
                    >
                      <Gem className="w-3 h-3 text-mineral" />
                      <span className="text-xs font-medium text-mineral">
                        {profile.performance_points}
                      </span>
                    </motion.div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 space-y-4">
                  {/* Name */}
                  <div>
                    {isEditingName ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="max-w-xs bg-white/60 border-mineral/30 focus:border-mineral"
                          autoFocus
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={handleSaveName}
                          disabled={updateProfile.isPending}
                          className="h-9 w-9 text-mineral hover:bg-mineral/10"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={handleCancelEdit}
                          className="h-9 w-9 text-muted-foreground hover:bg-muted/50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h2 className="font-display text-xl md:text-2xl text-carbon">
                          {profile?.display_name || "Rider"}
                        </h2>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditName(profile?.display_name || "");
                            setIsEditingName(true);
                          }}
                          className="h-8 w-8 text-muted-foreground hover:text-mineral"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">{user?.email}</span>
                    {isOAuth && (
                      <span className="text-xs px-2 py-0.5 bg-mineral/10 text-mineral rounded-full">
                        OAuth
                      </span>
                    )}
                  </div>

                  {/* Registration Date */}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Membre depuis {registrationDate}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Security Card */}
            {!isOAuth && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/20 p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-mineral/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-mineral" />
                  </div>
                  <h3 className="font-display text-lg text-carbon tracking-wide">
                    SÉCURITÉ
                  </h3>
                </div>

                {showPasswordForm ? (
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nouveau mot de passe</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="••••••••"
                                className="bg-white/60 border-white/30 focus:border-mineral"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirmer le mot de passe</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="••••••••"
                                className="bg-white/60 border-white/30 focus:border-mineral"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowPasswordForm(false);
                            passwordForm.reset();
                          }}
                          className="flex-1"
                        >
                          Annuler
                        </Button>
                        <Button
                          type="submit"
                          disabled={changePassword.isPending}
                          className="flex-1 bg-mineral hover:bg-mineral-dark"
                        >
                          {changePassword.isPending ? "..." : "Enregistrer"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setShowPasswordForm(true)}
                    className="w-full justify-between border-carbon/20 hover:border-mineral hover:bg-mineral/5"
                  >
                    <span className="flex items-center gap-2">
                      <Key className="w-4 h-4" />
                      Changer mon mot de passe
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                )}
              </motion.div>
            )}

            {/* Quick Links Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid md:grid-cols-2 gap-4"
            >
              {/* Mon Garage */}
              <Link to="/garage">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/20 p-6 hover:border-mineral/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-mineral/10 flex items-center justify-center">
                      <Bike className="w-5 h-5 text-mineral" />
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <h3 className="font-display text-lg text-carbon tracking-wide mb-1">
                    MON GARAGE
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Bike className="w-3 h-3" />
                      {garageStats?.owned || 0} trottinette{(garageStats?.owned || 0) > 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {garageStats?.favorites || 0} favori{(garageStats?.favorites || 0) > 1 ? "s" : ""}
                    </span>
                  </div>
                </motion.div>
              </Link>

              {/* Mes Commandes */}
              <Link to="/garage">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/20 p-6 hover:border-mineral/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-mineral/10 flex items-center justify-center">
                      <Package className="w-5 h-5 text-mineral" />
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <h3 className="font-display text-lg text-carbon tracking-wide mb-1">
                    MES COMMANDES
                  </h3>
                  <div className="text-sm text-muted-foreground">
                    {orderStats?.count ? (
                      <>
                        <span>{orderStats.count} commande{orderStats.count > 1 ? "s" : ""}</span>
                        {orderStats.lastOrder && (
                          <span className="ml-2 text-mineral">
                            • Dernière: {formatPrice(orderStats.lastOrder.total_ttc)}
                          </span>
                        )}
                      </>
                    ) : (
                      <span>Aucune commande</span>
                    )}
                  </div>
                </motion.div>
              </Link>
            </motion.div>

            {/* Actions Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/20 p-6 space-y-3"
            >
              {/* Logout */}
              <Button
                variant="outline"
                onClick={handleLogout}
                className="w-full justify-start gap-3 h-12 border-carbon/20 hover:border-mineral hover:bg-mineral/5"
              >
                <LogOut className="w-4 h-4" />
                Se déconnecter
              </Button>

              {/* Delete Account */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 h-12 border-destructive/30 text-destructive hover:bg-destructive/5 hover:border-destructive/50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer mon compte
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-display tracking-wide">
                      SUPPRIMER MON COMPTE
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action est irréversible. Toutes vos données seront définitivement supprimées.
                      Contactez-nous à support@piecestrottinettes.fr pour procéder à la suppression.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleLogout}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Je comprends
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </motion.div>

            {/* Watermark */}
            <div className="text-center pt-8">
              <p className="font-display text-xs tracking-[0.3em] text-carbon/10">
                ROULE · RÉPARE · DURE
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Profile;
