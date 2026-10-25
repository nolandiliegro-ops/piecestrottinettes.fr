/** Garage v3 — « Réglages » (25/10/2026) : profil, garage public, wallpaper, niveau, code RIDER, ambassadeur, mails. */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { UserPen, Wallpaper } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Switch } from "@/components/ui/switch";
import RiderAvatar from "../RiderAvatar";
import RiderLaunchCode from "@/components/launch/RiderLaunchCode";
import AmbassadorGarageCard from "../AmbassadorGarageCard";
import { getXPLevel, getProgressToNextLevel } from "@/lib/xpLevels";
import { ScreenTitle, Box, BoxTitle, FONT, UNB, CARBON, GREEN, LINE, MUTED, cut } from "./ui";

const ReglagesSection = ({ onEditProfile, onTheme }: { onEditProfile: () => void; onTheme: () => void }) => {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const { data: flags } = useQuery({
    queryKey: ["v3-profile-flags", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("is_public, marketing_consent, username").eq("id", user!.id).maybeSingle();
      if (error) throw error;
      return data as { is_public: boolean; marketing_consent: boolean | null; username: string | null } | null;
    },
  });

  const setFlag = async (patch: { is_public?: boolean; marketing_consent?: boolean }) => {
    if (!user) return;
    const full = patch.marketing_consent !== undefined ? { ...patch, marketing_consent_at: new Date().toISOString() } : patch;
    const { error } = await supabase.from("profiles").update(full as never).eq("id", user.id);
    if (error) { toast.error("Réglage non enregistré"); return; }
    qc.invalidateQueries({ queryKey: ["v3-profile-flags"] });
    qc.invalidateQueries({ queryKey: ["rider-card"] });
    toast.success("Réglage enregistré");
  };

  const points = profile?.performance_points ?? 0;
  const level = getXPLevel(points);
  const prog = getProgressToNextLevel(points);
  const name = profile?.display_name || "Rider";
  const btn = "inline-flex items-center gap-2 min-h-[48px] px-4 text-[15px] font-extrabold";

  const Row = ({ id, title, sub, checked, onChange }: { id: string; title: string; sub: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex items-center gap-4 py-3" style={{ borderTop: `1px solid ${LINE}` }}>
      <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer">
        <span className="block text-[15px] font-bold" style={{ color: CARBON }}>{title}</span>
        <span className="block text-sm" style={{ color: MUTED }}>{sub}</span>
      </label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );

  return (
    <div>
      <ScreenTitle kicker="Mon compte" title="Réglages" />
      <div className="grid gap-4 lg:grid-cols-2 items-start">
        <div className="grid gap-4">
          <Box>
            <div className="flex items-center gap-3">
              <RiderAvatar url={profile?.avatar_url || null} name={name} size="lg" />
              <div className="min-w-0">
                <p className="text-[20px] uppercase leading-none truncate" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: CARBON }}>{name}</p>
                <p className="mt-1 text-sm" style={{ color: MUTED }}>{[profile?.rider_location, flags?.username ? `@${flags.username}` : null].filter(Boolean).join(" · ")}</p>
              </div>
            </div>
            {profile?.bio && <p className="mt-3 text-[15px]" style={{ color: "#374151" }}>« {profile.bio} »</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={onEditProfile} className={btn} style={{ background: CARBON, color: "#FFFFFF", clipPath: cut(10), fontFamily: FONT }}><UserPen className="w-5 h-5" /> Modifier mon profil</button>
              <button type="button" onClick={onTheme} className={btn} style={{ background: "#FFFFFF", color: CARBON, clipPath: cut(10), boxShadow: `inset 0 0 0 1px ${LINE}`, fontFamily: FONT }}><Wallpaper className="w-5 h-5" style={{ color: GREEN }} /> Mon wallpaper</button>
            </div>
          </Box>

          <Box>
            <BoxTitle>Confidentialité et mails</BoxTitle>
            <div className="mt-2">
              <Row id="v3-public" title="Garage public" sub="Ta carte et ton garage sont visibles sur ta page /rider et peuvent sortir sur l'accueil." checked={!!flags?.is_public} onChange={(v) => setFlag({ is_public: v })} />
              <Row id="v3-mails" title="Bons plans par mail" sub="Promos, nouvelles pièces pour ta trott. Désinscription en un clic." checked={!!flags?.marketing_consent} onChange={(v) => setFlag({ marketing_consent: v })} />
            </div>
          </Box>

          <Box>
            <BoxTitle right={<span className="text-sm font-bold" style={{ color: MUTED }}>{points.toLocaleString("fr-FR")} XP</span>}>Niveau {level.level} · {level.name}</BoxTitle>
            {prog.nextLevel ? (
              <>
                <div className="mt-3 h-2" style={{ background: LINE }}><div className="h-full" style={{ width: `${prog.percentage}%`, background: GREEN }} /></div>
                <p className="mt-2 text-sm" style={{ color: MUTED }}>{prog.pointsToNext} XP avant {prog.nextLevel.name}. Tu en gagnes à chaque commande, photo et entretien noté.</p>
              </>
            ) : <p className="mt-2 text-sm" style={{ color: MUTED }}>Niveau maximum atteint.</p>}
          </Box>
        </div>

        <div className="grid gap-4">
          <RiderLaunchCode />
          <AmbassadorGarageCard />
        </div>
      </div>
    </div>
  );
};

export default ReglagesSection;
