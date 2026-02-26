import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, Clock, AlertTriangle, Search, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ScanRow {
  id: string;
  ai_brand: string;
  ai_model: string;
  ai_confidence: string;
  is_validated: boolean | null;
  corrected_text: string | null;
  image_url: string | null;
  created_at: string;
  matched_model_id: string | null;
  corrected_model_id: string | null;
}

const ScansManager = () => {
  const [filter, setFilter] = useState<"all" | "validated" | "corrected" | "pending">("all");

  const { data: scans, isLoading } = useQuery({
    queryKey: ["admin-scans", filter],
    queryFn: async () => {
      let query = supabase
        .from("scan_validations" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (filter === "validated") query = query.eq("is_validated", true);
      else if (filter === "corrected") query = query.eq("is_validated", false);
      else if (filter === "pending") query = query.is("is_validated", null);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as ScanRow[];
    },
  });

  // Compute stats
  const totalScans = scans?.length || 0;
  const validated = scans?.filter((s) => s.is_validated === true).length || 0;
  const corrected = scans?.filter((s) => s.is_validated === false).length || 0;
  const pending = scans?.filter((s) => s.is_validated === null).length || 0;

  // Compute missing models (no_match with corrected_text)
  const missingModels = scans
    ?.filter((s) => !s.matched_model_id && s.corrected_text)
    .reduce((acc, s) => {
      const key = s.corrected_text!;
      acc.set(key, (acc.get(key) || 0) + 1);
      return acc;
    }, new Map<string, number>());

  // Compute confusion pairs
  const confusions = scans
    ?.filter((s) => s.is_validated === false && s.corrected_model_id)
    .reduce((acc, s) => {
      const key = `${s.ai_brand} ${s.ai_model}`;
      acc.set(key, (acc.get(key) || 0) + 1);
      return acc;
    }, new Map<string, number>());

  const handleEnrichSearchTerms = async (aiBrand: string, aiModel: string) => {
    const searchName = `${aiBrand} ${aiModel}`.trim();
    toast.info(`Recherche du modèle pour enrichir les alias : "${searchName}"...`);
    // This would require finding the matched model and appending to search_terms
    // For now, just notify admin
    toast.success("Fonctionnalité d'enrichissement automatique à venir. Ajoutez manuellement les alias dans l'onglet Trottinettes.");
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total", value: totalScans, icon: Search, color: "text-foreground" },
          { label: "Validés", value: validated, icon: CheckCircle, color: "text-emerald-500" },
          { label: "Corrigés", value: corrected, icon: XCircle, color: "text-amber-500" },
          { label: "En attente", value: pending, icon: Clock, color: "text-muted-foreground" },
        ].map((stat) => (
          <div key={stat.label} className="p-4 rounded-xl bg-background/50 border border-border/30">
            <div className="flex items-center gap-2 mb-1">
              <stat.icon className={cn("w-4 h-4", stat.color)} />
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "validated", "corrected", "pending"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {f === "all" ? "Tous" : f === "validated" ? "Validés" : f === "corrected" ? "Corrigés" : "En attente"}
          </button>
        ))}
      </div>

      {/* Confusions Section */}
      {confusions && confusions.size > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-foreground">Confusions fréquentes</h3>
          </div>
          <div className="space-y-2">
            {[...confusions.entries()]
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([name, count]) => (
                <div key={name} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">{count}x</Badge>
                    <button
                      onClick={() => {
                        const parts = name.split(" ");
                        handleEnrichSearchTerms(parts[0], parts.slice(1).join(" "));
                      }}
                      className="text-xs text-primary hover:underline"
                    >
                      Enrichir
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Missing Models */}
      {missingModels && missingModels.size > 0 && (
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-foreground">Modèles les plus demandés (non référencés)</h3>
          </div>
          <div className="space-y-2">
            {[...missingModels.entries()]
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([name, count]) => (
                <div key={name} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{name}</span>
                  <Badge variant="secondary" className="text-xs">{count} demandes</Badge>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Scans Table */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Chargement...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/20">
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Photo</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Réponse IA</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Confiance</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Statut</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {scans?.map((scan) => (
                <tr key={scan.id} className="border-b border-border/10 hover:bg-muted/30">
                  <td className="py-2 px-3">
                    {scan.image_url ? (
                      <img src={scan.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-muted" />
                    )}
                  </td>
                  <td className="py-2 px-3">
                    <span className="text-foreground font-medium">{scan.ai_brand} {scan.ai_model}</span>
                    {scan.corrected_text && (
                      <p className="text-xs text-amber-500">→ {scan.corrected_text}</p>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-xs",
                        scan.ai_confidence === "high" && "bg-emerald-500/20 text-emerald-600",
                        scan.ai_confidence === "medium" && "bg-amber-500/20 text-amber-600",
                      )}
                    >
                      {scan.ai_confidence}
                    </Badge>
                  </td>
                  <td className="py-2 px-3">
                    {scan.is_validated === true && (
                      <Badge className="bg-emerald-500/20 text-emerald-600 text-xs">✓ Validé</Badge>
                    )}
                    {scan.is_validated === false && (
                      <Badge className="bg-amber-500/20 text-amber-600 text-xs">✏️ Corrigé</Badge>
                    )}
                    {scan.is_validated === null && (
                      <Badge variant="secondary" className="text-xs">En attente</Badge>
                    )}
                  </td>
                  <td className="py-2 px-3 text-muted-foreground text-xs">
                    {new Date(scan.created_at).toLocaleDateString("fr-FR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!scans || scans.length === 0) && (
            <p className="text-center py-8 text-muted-foreground text-sm">Aucun scan enregistré</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ScansManager;
