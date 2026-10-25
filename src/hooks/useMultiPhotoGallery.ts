import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { EntityType, ProcessedImage } from "@/types/multiPhoto";

const TABLE_BY_ENTITY: Record<EntityType, "scooter_models" | "parts"> = {
  scooter: "scooter_models",
  part: "parts",
};

const BUCKET_BY_ENTITY: Record<EntityType, "scooter-photos" | "part-images"> = {
  scooter: "scooter-photos",
  part: "part-images",
};

const PROCESS_TIMEOUT_MS = 90_000;

export function useMultiPhotoGallery(
  entityType: EntityType,
  entityId: string,
  defaultAltBase: string,
) {
  const qc = useQueryClient();
  const table = TABLE_BY_ENTITY[entityType];
  const bucket = BUCKET_BY_ENTITY[entityType];
  const queryKey = ["entity-images", entityType, entityId] as const;

  const { data: currentImages = [], isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(table)
        .select("images")
        .eq("id", entityId)
        .single();
      if (error) throw error;
      const raw = (data?.images ?? []) as unknown;
      return Array.isArray(raw) ? (raw as ProcessedImage[]) : [];
    },
    staleTime: 0,
    enabled: !!entityId,
  });

  const persist = async (images: ProcessedImage[]) => {
    const normalized = images.map((img, idx) => ({
      ...img,
      position: idx,
      is_primary: idx === 0,
    }));
    const { error } = await supabase
      .from(table)
      .update({ images: normalized as any })
      .eq("id", entityId);
    if (error) throw error;
    return normalized;
  };

  const autoProcess = useMutation({
    mutationFn: async (urls: string[]) => {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), PROCESS_TIMEOUT_MS);
      try {
        const { data, error } = await supabase.functions.invoke(
          "admin-process-images",
          {
            body: {
              entity_type: entityType,
              entity_id: entityId,
              source_urls: urls,
              alt_base: defaultAltBase,
            },
          },
        );
        if (error) throw error;
        return data;
      } finally {
        clearTimeout(timer);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const uploadManual = useMutation({
    mutationFn: async (file: File) => {
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("Fichier trop lourd (max 5 MB)");
      }
      // Garde-fou anti-doublon (25/10/2026) : jamais deux fois la même photo sur une fiche.
      // Vérification SEULE côté serveur (aucune écriture) AVANT l'envoi. Si la vérification ne répond pas,
      // on laisse passer (la ronde hebdo du lundi rattrapera un éventuel doublon) — l'admin n'est jamais bloqué
      // pour une raison technique.
      try {
        const b64 = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
          r.onerror = () => reject(r.error);
          r.readAsDataURL(file);
        });
        const { data: chk, error: chkErr } = await supabase.functions.invoke(
          "admin-process-images",
          { body: { entity_type: entityType, entity_id: entityId, images_base64: [b64], check_only: true } },
        );
        const res = !chkErr ? chk?.results?.[0] : null;
        if (res?.doublon) {
          throw new Error(
            "Photo déjà présente sur cette fiche — envoi annulé (règle : jamais deux fois la même photo).",
          );
        }
        if (chkErr) console.warn("[garde-fou photo] vérification indisponible, envoi autorisé", chkErr);
      } catch (e) {
        if (e instanceof Error && e.message.startsWith("Photo déjà présente")) throw e;
        console.warn("[garde-fou photo] vérification impossible, envoi autorisé", e);
      }
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${entityId}/${Date.now()}-${safeName}`;
      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: false, contentType: file.type });
      if (upErr) throw upErr;
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(path);
      const next: ProcessedImage[] = [
        ...currentImages,
        {
          url: publicUrl,
          position: currentImages.length,
          is_primary: currentImages.length === 0,
          alt: defaultAltBase,
        },
      ];
      return persist(next);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const setPrimary = useMutation({
    mutationFn: async (position: number) => {
      if (position < 0 || position >= currentImages.length) return currentImages;
      const target = currentImages[position];
      const rest = currentImages.filter((_, i) => i !== position);
      return persist([target, ...rest]);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const updateAlt = useMutation({
    mutationFn: async ({
      position,
      newAlt,
    }: {
      position: number;
      newAlt: string;
    }) => {
      const next = currentImages.map((img, i) =>
        i === position ? { ...img, alt: newAlt } : img,
      );
      return persist(next);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const deleteOne = useMutation({
    mutationFn: async (position: number) =>
      persist(currentImages.filter((_, i) => i !== position)),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const reorder = useMutation({
    mutationFn: async (newOrder: ProcessedImage[]) => persist(newOrder),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const resetAll = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from(table)
        .update({ images: [] as any })
        .eq("id", entityId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  return {
    currentImages,
    isLoading,
    error,
    refetch,
    autoProcess,
    uploadManual,
    setPrimary,
    updateAlt,
    deleteOne,
    reorder,
    resetAll,
  };
}
