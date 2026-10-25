/** Admin — modération des commentaires de cartes Rider (25/10/2026, garage v3 / carte Story). */
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { Eye, EyeOff, Trash2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Row {
  id: string; body: string; hidden: boolean; created_at: string;
  owner: { display_name: string | null; username: string | null } | null;
  author: { display_name: string | null; username: string | null } | null;
}
const table = () => (supabase as unknown as { from: (t: string) => any }).from("rider_card_comments");

const RiderCommentsManager = () => {
  const qc = useQueryClient();
  const [confirm, setConfirm] = useState<string | null>(null);
  const { data = [], isLoading } = useQuery<Row[]>({
    queryKey: ["admin-rider-comments"],
    queryFn: async () => {
      const { data, error } = await table()
        .select("id, body, hidden, created_at, owner:profiles!rider_card_comments_card_owner_id_fkey(display_name, username), author:profiles!rider_card_comments_author_id_fkey(display_name, username)")
        .order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-rider-comments"] });
  const toggle = async (r: Row) => {
    const { error } = await table().update({ hidden: !r.hidden }).eq("id", r.id);
    if (error) toast.error("Action impossible"); else { toast.success(r.hidden ? "Commentaire visible" : "Commentaire masqué"); refresh(); }
  };
  const remove = async (id: string) => {
    const { error } = await table().delete().eq("id", id);
    setConfirm(null);
    if (error) toast.error("Suppression impossible"); else { toast.success("Commentaire supprimé"); refresh(); }
  };

  return (
    <div className="grid gap-3">
      <p className="text-sm text-[hsl(var(--admin-text-muted))]">Commentaires laissés sur les cartes Rider. Un commentaire masqué n'est plus visible du public (le propriétaire et l'auteur le voient encore).</p>
      {isLoading && <p className="text-sm">Chargement…</p>}
      {!isLoading && data.length === 0 && <p className="text-sm">Aucun commentaire pour l'instant.</p>}
      <ul className="grid gap-2">
        {data.map((r) => (
          <li key={r.id} className={`grid gap-2 rounded-xl border border-[hsl(var(--admin-border))] bg-white p-3 ${r.hidden ? "opacity-60" : ""}`}>
            <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
              <b>{r.author?.display_name ?? "Rider"}</b>
              <span className="text-[hsl(var(--admin-text-muted))]">sur la carte de</span>
              {r.owner?.username ? <a href={`/rider/${r.owner.username}`} target="_blank" rel="noopener noreferrer" className="font-bold underline inline-flex items-center gap-1">{r.owner.display_name}<ExternalLink className="w-3.5 h-3.5" /></a> : <b>{r.owner?.display_name ?? "?"}</b>}
              <span className="text-[hsl(var(--admin-text-muted))]">· {formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: fr })}</span>
              {r.hidden && <span className="font-bold text-amber-700">· masqué</span>}
            </div>
            <p className="text-[15px] break-words">{r.body}</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => toggle(r)} className="inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-xl border border-[hsl(var(--admin-border))] text-sm font-semibold">
                {r.hidden ? <><Eye className="w-4 h-4" /> Rendre visible</> : <><EyeOff className="w-4 h-4" /> Masquer</>}
              </button>
              {confirm === r.id ? (
                <>
                  <button type="button" onClick={() => remove(r.id)} className="min-h-[44px] px-3 rounded-xl bg-red-600 text-white text-sm font-semibold">Confirmer la suppression</button>
                  <button type="button" onClick={() => setConfirm(null)} className="min-h-[44px] px-3 rounded-xl border border-[hsl(var(--admin-border))] text-sm font-semibold">Annuler</button>
                </>
              ) : (
                <button type="button" onClick={() => setConfirm(r.id)} className="inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-xl border border-[hsl(var(--admin-border))] text-sm font-semibold text-red-700"><Trash2 className="w-4 h-4" /> Supprimer</button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RiderCommentsManager;
