import { useEffect, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useRiderProfile } from "@/hooks/useRiderProfile";
import RiderAvatar from "./RiderAvatar";
import RiderAvatarUpload from "./RiderAvatarUpload";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RiderProfileEditDialog = ({ open, onOpenChange }: Props) => {
  const { profile } = useAuth();
  const { updateBio, updateLocation, updateDisplayName, deleteAvatar } = useRiderProfile();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [location, setLocation] = useState(profile?.rider_location ?? "");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setDisplayName(profile?.display_name ?? "");
      setBio(profile?.bio ?? "");
      setLocation(profile?.rider_location ?? "");
    }
  }, [open, profile?.display_name, profile?.bio, profile?.rider_location]);

  const trimmedName = displayName.trim();
  const nameRegex = /^[a-zA-Z0-9 ._-]+$/;
  const nameError =
    trimmedName.length === 0
      ? "Le nom de rider est obligatoire"
      : !nameRegex.test(trimmedName)
      ? "Caractères autorisés : lettres, chiffres, espace, . _ -"
      : null;

  const handleSave = async () => {
    if (nameError) return;
    setSaving(true);
    try {
      const tasks: Promise<unknown>[] = [];
      if ((profile?.display_name ?? "") !== trimmedName) {
        tasks.push(updateDisplayName.mutateAsync(trimmedName));
      }
      if ((profile?.bio ?? "") !== bio) tasks.push(updateBio.mutateAsync(bio));
      if ((profile?.rider_location ?? "") !== location) tasks.push(updateLocation.mutateAsync(location));
      await Promise.all(tasks);
      onOpenChange(false);
    } catch {
      // erreur déjà toastée dans le hook
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mon profil rider</DialogTitle>
            <DialogDescription>
              Personnalisez votre identité visible dans le garage.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setUploadOpen(true)}
                className="relative group"
                aria-label="Modifier la photo de profil"
              >
                <RiderAvatar url={profile?.avatar_url} name={profile?.display_name} size="lg" />
                <span className="absolute inset-0 rounded-full bg-carbon/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                  <Camera className="w-5 h-5 text-white" />
                </span>
              </button>
              <div className="flex flex-col gap-2">
                <Button variant="outline" size="sm" onClick={() => setUploadOpen(true)}>
                  <Camera className="w-4 h-4" /> Changer
                </Button>
                {profile?.avatar_url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteAvatar.mutate()}
                    disabled={deleteAvatar.isPending}
                    className="text-destructive hover:text-destructive"
                  >
                    {deleteAvatar.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    Supprimer
                  </Button>
                )}
              </div>
            </div>

            {/* Nom de Rider */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-carbon/70 flex justify-between">
                <span>Nom de Rider</span>
                <span className="text-carbon/40">{displayName.length}/30</span>
              </label>
              <Input
                value={displayName}
                maxLength={30}
                placeholder="Ex : NOLAN2.0"
                onChange={(e) => setDisplayName(e.target.value)}
                className="text-base"
                aria-invalid={!!nameError}
              />
              {nameError && (
                <p className="text-xs text-destructive">{nameError}</p>
              )}
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-carbon/70 flex justify-between">
                <span>Bio</span>
                <span className="text-carbon/40">{bio.length}/150</span>
              </label>
              <Textarea
                value={bio}
                maxLength={150}
                rows={3}
                placeholder="Ex : Rider Marseille, fan de Dualtron, mods perso."
                onChange={(e) => setBio(e.target.value)}
                className="text-base resize-none"
              />
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-carbon/70 flex justify-between">
                <span>Ville / Région</span>
                <span className="text-carbon/40">{location.length}/60</span>
              </label>
              <Input
                value={location}
                maxLength={60}
                placeholder="Ex : Marseille"
                onChange={(e) => setLocation(e.target.value)}
                className="text-base"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving || !!nameError}>
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RiderAvatarUpload
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUploaded={() => setUploadOpen(false)}
      />
    </>
  );
};

export default RiderProfileEditDialog;
