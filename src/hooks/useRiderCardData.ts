import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface RiderMod {
  id: string;
  user_garage_id: string;
  order_item_id: string | null;
  installed_at: string;
  part: {
    id: string;
    name: string;
    category: { name: string } | null;
  } | null;
}

export interface RiderMachine {
  id: string;
  nickname: string | null;
  mood: string | null;
  is_featured: boolean;
  /** true = à lui ; false = coup de cœur (« Je kiffe »). */
  is_owned: boolean;
  /** Emplacement sur la carte Story (1..5 par groupe), null = pas sur la carte. Limite tenue par la base. */
  card_slot: number | null;
  custom_photo_url: string | null;
  photo_xp_claimed: boolean;
  model: {
    id: string;
    name: string;
    slug: string;
    image_url: string | null;
    power_watts: number | null;
    voltage: number | null;
    year: number | null;
    brand: string;
  } | null;
}

export interface RiderCardProfile {
  id: string;
  display_name: string | null;
  username: string | null;
  performance_points: number | null;
  rider_location: string | null;
  avatar_url: string | null;
  is_public: boolean;
  active_theme_key?: string | null;
  bio?: string | null;
}

export interface RiderCardData {
  profile: RiderCardProfile;
  machines: RiderMachine[];
  modsByMachine: Record<string, RiderMod[]>;
  likes: number;
  likedByMe: boolean;
  /** Wallpaper du rider (garage_themes.image_url de son thème actif, sinon le 1er thème actif). */
  wallpaper_url: string | null;
}

const PROFILE_FIELDS =
  "id, display_name, username, performance_points, rider_location, avatar_url, is_public, active_theme_key, bio";

export const useRiderCardData = (opts: { username?: string } = {}) => {
  const { user } = useAuthContext();
  const { username } = opts;

  return useQuery<RiderCardData | null>({
    queryKey: ["rider-card", username ?? user?.id ?? null, user?.id ?? null],
    enabled: !!username || !!user,
    staleTime: 0,
    queryFn: async () => {
      // 1. Profil ciblé
      let profileQuery = supabase.from("profiles").select(PROFILE_FIELDS).limit(1);
      profileQuery = username
        ? profileQuery.ilike("username", username)
        : profileQuery.eq("id", user!.id);

      const { data: profiles, error: profileError } = await profileQuery;
      if (profileError) throw profileError;
      const profile = (profiles?.[0] ?? null) as RiderCardProfile | null;
      if (!profile) return null;
      // Carte publique : réservée aux profils publics
      if (username && !profile.is_public && profile.id !== user?.id) return null;

      // 25/10 : likes et wallpaper partent en parallèle du garage (la carte se chargeait requête après requête).
      const likesP = supabase.from("user_card_likes").select("id", { count: "exact", head: true }).eq("card_owner_id", profile.id);
      const mineP = user
        ? supabase.from("user_card_likes").select("id").eq("card_owner_id", profile.id).eq("liker_user_id", user.id).maybeSingle()
        : Promise.resolve({ data: null });
      const wallP = (async () => {
        if (profile.active_theme_key) {
          const { data: th } = await supabase.from("garage_themes").select("image_url").eq("key", profile.active_theme_key).eq("is_active", true).maybeSingle();
          if (th?.image_url) return th.image_url as string;
        }
        const { data: first } = await supabase.from("garage_themes").select("image_url").eq("is_active", true).order("display_order", { ascending: true }).limit(1).maybeSingle();
        return (first?.image_url as string | undefined) ?? null;
      })();

      // 2. Garage + modèles
      const { data: garage, error: garageError } = await supabase
        .from("user_garage")
        .select(
          `id, nickname, mood, is_featured, is_owned, card_slot, custom_photo_url, photo_xp_claimed, added_at,
           scooter_model:scooter_models(
             id, name, slug, image_url, power_watts, voltage, year,
             brand:brands!scooter_models_brand_id_fkey(name)
           )`,
        )
        .eq("user_id", profile.id)
        .order("added_at", { ascending: false });
      if (garageError) throw garageError;

      const machines: RiderMachine[] = (garage ?? []).map((row: any) => ({
        id: row.id,
        nickname: row.nickname,
        mood: row.mood,
        is_featured: !!row.is_featured,
        is_owned: row.is_owned !== false,
        card_slot: row.card_slot ?? null,
        custom_photo_url: row.custom_photo_url,
        photo_xp_claimed: !!row.photo_xp_claimed,
        model: row.scooter_model
          ? {
              id: row.scooter_model.id,
              name: row.scooter_model.name,
              slug: row.scooter_model.slug,
              image_url: row.scooter_model.image_url,
              power_watts: row.scooter_model.power_watts,
              voltage: row.scooter_model.voltage,
              year: row.scooter_model.year,
              brand: row.scooter_model.brand?.name ?? "—",
            }
          : null,
      }));

      // 3. Modifications de tout le garage en une passe
      const ids = machines.map((m) => m.id);
      const modsByMachine: Record<string, RiderMod[]> = {};
      ids.forEach((id) => (modsByMachine[id] = []));

      if (ids.length > 0) {
        const { data: mods, error: modsError } = await supabase
          .from("garage_modifications")
          .select(
            `id, user_garage_id, order_item_id, installed_at,
             part:parts(id, name, category:categories(name))`,
          )
          .in("user_garage_id", ids)
          .order("installed_at", { ascending: false });
        if (modsError) throw modsError;
        (mods ?? []).forEach((m: any) => {
          if (!modsByMachine[m.user_garage_id]) modsByMachine[m.user_garage_id] = [];
          modsByMachine[m.user_garage_id].push(m as RiderMod);
        });
      }

      // 4. Likes + 5. Wallpaper (lancés plus haut)
      const [{ count: likes }, { data: mine }, wallpaper_url] = await Promise.all([likesP, mineP, wallP]);
      const likedByMe = !!mine;

      return { profile, machines, modsByMachine, likes: likes ?? 0, likedByMe, wallpaper_url };
    },
  });
};

export const useSetFeaturedMachine = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async (garageId: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.rpc("set_featured_scooter", {
        p_user_id: user.id,
        p_scooter_id: garageId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rider-card"] });
      toast.success("Machine à la une mise à jour");
    },
    onError: () => toast.error("Impossible de changer la machine à la une"),
  });
};

export const useSetMachineMood = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ garageId, mood }: { garageId: string; mood: string }) => {
      const { error } = await supabase.from("user_garage").update({ mood }).eq("id", garageId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rider-card"] }),
    onError: () => toast.error("Impossible de changer le mood"),
  });
};

export const useToggleCardLike = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async ({ ownerId, liked }: { ownerId: string; liked: boolean }) => {
      if (!user) throw new Error("Not authenticated");
      if (user.id === ownerId) throw new Error("self");

      if (liked) {
        const { error } = await supabase
          .from("user_card_likes")
          .delete()
          .eq("card_owner_id", ownerId)
          .eq("liker_user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_card_likes")
          .insert({ card_owner_id: ownerId, liker_user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rider-card"] }),
    onError: (err: any) => {
      if (err?.message === "self") toast.info("Tu ne peux pas liker ta propre carte");
      else if (!user) toast.info("Connecte-toi pour liker cette carte");
      else toast.error("Like impossible");
    },
  });
};

export const useUploadMachinePhoto = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async ({
      garageId,
      file,
      alreadyClaimed,
    }: {
      garageId: string;
      file: File;
      alreadyClaimed: boolean;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/${garageId}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("scooter-photos")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;

      const { data: pub } = supabase.storage.from("scooter-photos").getPublicUrl(path);

      const { error: updateError } = await supabase
        .from("user_garage")
        .update({ custom_photo_url: pub.publicUrl, photo_xp_claimed: true })
        .eq("id", garageId);
      if (updateError) throw updateError;

      let xpAwarded = false;
      if (!alreadyClaimed) {
        const { error: xpError } = await supabase.functions.invoke("add-experience-points", {
          body: { pointsToAdd: 50, action: "Photo réelle ajoutée à la carte rider" },
        });
        if (!xpError) xpAwarded = true;
      }

      return { xpAwarded };
    },
    onSuccess: ({ xpAwarded }) => {
      queryClient.invalidateQueries({ queryKey: ["rider-card"] });
      queryClient.invalidateQueries({ queryKey: ["user-garage-scooters"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success(xpAwarded ? "Photo ajoutée — +50 XP !" : "Photo mise à jour");
    },
    onError: () => toast.error("Impossible d'envoyer la photo"),
  });
};

/** Carte Story (25/10) : met une machine sur la carte (1er emplacement libre de son groupe) ou l'en retire. */
export const useToggleCardSlot = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  return useMutation({
    mutationFn: async ({ machine, all }: { machine: RiderMachine; all: RiderMachine[] }) => {
      if (!user) throw new Error("Not authenticated");
      if (machine.card_slot != null) {
        const { error } = await supabase.from("user_garage").update({ card_slot: null } as never).eq("id", machine.id);
        if (error) throw error;
        return "off" as const;
      }
      const used = new Set(all.filter((m) => m.is_owned === machine.is_owned && m.card_slot != null).map((m) => m.card_slot));
      const free = [1, 2, 3, 4, 5].find((n) => !used.has(n));
      if (!free) throw new Error("full");
      const { error } = await supabase.from("user_garage").update({ card_slot: free } as never).eq("id", machine.id);
      if (error) throw error;
      return "on" as const;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rider-card"] }),
    onError: (err: any) => {
      if (err?.message === "full" || err?.code === "23505") toast.info("5 maximum : retire d'abord une trott de ta carte");
      else toast.error("Impossible de modifier ta carte");
    },
  });
};
