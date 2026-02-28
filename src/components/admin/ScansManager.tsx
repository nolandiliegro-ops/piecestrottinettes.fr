import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, Clock, AlertTriangle, Search, TrendingUp, Brain, Camera, ChevronUp, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

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

interface LearningLog {
  id: string;
  detected_markers: Record<string, any>;
  confirmed_model_id: string | null;
  image_url: string | null;
  confidence_score: number | null;
  promoted: boolean;
  created_at: string;
  model_name?: string;
}

interface AssetRequest {
  id: string;
  model_id: string;
  component_type: string;
  priority_score: number;
  status: string;
  instructions: string | null;
  model_name?: string;
}

const ScansManager = () => {
  const [filter, setFilter] = useState<"all" | "validated" | "corrected" | "pending">("all");
  const [confirmPromote, setConfirmPromote] = useState<{ log: LearningLog; conflicts: string[] } | null>(null);
  const queryClient = useQueryClient();

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

  // Learning Logs query
  const { data: learningLogs } = useQuery({
    queryKey: ["admin-learning-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_learning_logs" as any)
        .select("*")
        .eq("promoted", false)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;

      const logs = (data || []) as unknown as LearningLog[];
      // Fetch model names
      const modelIds = [...new Set(logs.map(l => l.confirmed_model_id).filter(Boolean))];
      if (modelIds.length > 0) {
        const { data: models } = await supabase
          .from("scooter_models")
          .select("id, name")
          .in("id", modelIds as string[]);
        const modelMap = new Map((models || []).map((m: any) => [m.id, m.name]));
        logs.forEach(l => { l.model_name = l.confirmed_model_id ? modelMap.get(l.confirmed_model_id) || '?' : '?'; });
      }
      return logs;
    },
  });

  // Asset Requests (Mission Control) query
  const { data: assetRequests } = useQuery({
    queryKey: ["admin-asset-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asset_requests" as any)
        .select("*")
        .eq("status", "pending")
        .order("priority_score", { ascending: false })
        .limit(20);
      if (error) throw error;

      const requests = (data || []) as unknown as AssetRequest[];
      const modelIds = [...new Set(requests.map(r => r.model_id).filter(Boolean))];
      if (modelIds.length > 0) {
        const { data: models } = await supabase
          .from("scooter_models")
          .select("id, name")
          .in("id", modelIds);
        const modelMap = new Map((models || []).map((m: any) => [m.id, m.name]));
        requests.forEach(r => { r.model_name = modelMap.get(r.model_id) || '?'; });
      }
      return requests;
    },
  });

  // Stats
  const totalScans = scans?.length || 0;
  const validated = scans?.filter((s) => s.is_validated === true).length || 0;
  const corrected = scans?.filter((s) => s.is_validated === false).length || 0;
  const pending = scans?.filter((s) => s.is_validated === null).length || 0;

  const missingModels = scans
    ?.filter((s) => !s.matched_model_id && s.corrected_text)
    .reduce((acc, s) => {
      const key = s.corrected_text!;
      acc.set(key, (acc.get(key) || 0) + 1);
      return acc;
    }, new Map<string, number>());

  const confusions = scans
    ?.filter((s) => s.is_validated === false && s.corrected_model_id)
    .reduce((acc, s) => {
      const key = `${s.ai_brand} ${s.ai_model}`;
      acc.set(key, (acc.get(key) || 0) + 1);
      return acc;
    }, new Map<string, number>());

  // Promote logic with deep merge + conflict detection
  const handlePromote = async (log: LearningLog) => {
    if (!log.confirmed_model_id) { toast.error("Aucun modèle confirmé"); return; }

    // Fetch current signature
    const { data: model } = await supabase
      .from("scooter_models")
      .select("technical_signature")
      .eq("id", log.confirmed_model_id)
      .single();

    const currentSig = (model as any)?.technical_signature || {};
    const newMarkers = log.detected_markers || {};

    // Check conflicts
    const conflicts = Object.keys(newMarkers).filter(
      k => currentSig[k] !== undefined && currentSig[k] !== newMarkers[k]
    );

    if (conflicts.length > 0) {
      setConfirmPromote({ log, conflicts });
      return;
    }

    await executePromote(log, currentSig);
  };

  const executePromote = async (log: LearningLog, currentSig: Record<string, any>) => {
    try {
      const merged = { ...currentSig, ...log.detected_markers };
      await supabase
        .from("scooter_models")
        .update({ technical_signature: merged } as any)
        .eq("id", log.confirmed_model_id!);

      await supabase
        .from("ai_learning_logs" as any)
        .update({ promoted: true, promoted_at: new Date().toISOString() })
        .eq("id", log.id);

      queryClient.invalidateQueries({ queryKey: ["admin-learning-logs"] });
      toast.success("Marqueurs promus dans la signature !");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la promotion");
    }
    setConfirmPromote(null);
  };

  const handleIgnore = async (logId: string) => {
    try {
      await supabase
        .from("ai_learning_logs" as any)
        .update({ promoted: true, promoted_at: new Date().toISOString() })
        .eq("id", logId);
      queryClient.invalidateQueries({ queryKey: ["admin-learning-logs"] });
      toast.info("Log ignoré");
    } catch (err) {
      toast.error("Erreur");
    }
  };

  const handleCaptured = async (requestId: string) => {
    try {
      await supabase
        .from("asset_requests" as any)
        .update({ status: "captured", updated_at: new Date().toISOString() })
        .eq("id", requestId);
      queryClient.invalidateQueries({ queryKey: ["admin-asset-requests"] });
      toast.success("Mission terminée !");
    } catch (err) {
      toast.error("Erreur");
    }
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
          <div key={stat.label} className="p-4 rounded-xl bg-[#1A1A1A]/80 backdrop-blur-sm border border-[#93B5A1]/20">
            <div className="flex items-center gap-2 mb-1">
              <stat.icon className={cn("w-4 h-4", stat.color)} />
              <span className="text-xs text-white/50">{stat.label}</span>
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
              "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
              filter === f
                ? "bg-[#93B5A1] text-white shadow-[0_0_12px_rgba(147,181,161,0.4)]"
                : "bg-[#1A1A1A] text-white/50 border border-white/10 hover:border-[#93B5A1]/40"
            )}
          >
            {f === "all" ? "Tous" : f === "validated" ? "Validés" : f === "corrected" ? "Corrigés" : "En attente"}
          </button>
        ))}
      </div>

      {/* Mission Control — Asset Requests */}
      {assetRequests && assetRequests.length > 0 && (
        <div className="p-4 rounded-xl bg-[#1A1A1A]/90 backdrop-blur-sm border border-[#93B5A1]/30 shadow-[0_0_20px_rgba(147,181,161,0.1)]">
          <div className="flex items-center gap-2 mb-3">
            <Camera className="w-4 h-4 text-[#93B5A1] drop-shadow-[0_0_6px_rgba(147,181,161,0.5)]" />
            <h3 className="text-sm font-semibold text-white">Mission Control — Captures Requises</h3>
            <Badge className="bg-[#93B5A1]/20 text-[#93B5A1] text-xs ml-auto">{assetRequests.length} en attente</Badge>
          </div>
          <div className="space-y-2">
            {assetRequests.map((req) => (
              <div key={req.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-medium">{req.model_name}</span>
                    <Badge variant="secondary" className="text-xs bg-white/10 text-white/70">{req.component_type}</Badge>
                    <div className="flex items-center gap-1">
                      <ChevronUp className="w-3 h-3 text-[#93B5A1]" />
                      <span className="text-xs text-[#93B5A1]">{req.priority_score}</span>
                    </div>
                  </div>
                  {req.instructions && (
                    <p className="text-xs text-white/40 mt-1 truncate">{req.instructions}</p>
                  )}
                </div>
                <button
                  onClick={() => handleCaptured(req.id)}
                  className="ml-3 px-3 py-1.5 rounded-lg bg-[#93B5A1] hover:bg-[#7a9e89] text-white text-xs font-medium transition-all shadow-[0_0_8px_rgba(147,181,161,0.3)]"
                >
                  ✓ Capturé
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Learning Logs IA */}
      {learningLogs && learningLogs.length > 0 && (
        <div className="p-4 rounded-xl bg-[#1A1A1A]/90 backdrop-blur-sm border border-[#93B5A1]/20">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-4 h-4 text-[#93B5A1] drop-shadow-[0_0_6px_rgba(147,181,161,0.5)]" />
            <h3 className="text-sm font-semibold text-white">Learning Logs IA</h3>
            <Badge className="bg-[#93B5A1]/20 text-[#93B5A1] text-xs ml-auto">{learningLogs.length}</Badge>
          </div>
          <div className="space-y-2">
            {learningLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
                {log.image_url && (
                  <img src={log.image_url} alt="" className="w-12 h-12 rounded-lg object-cover border border-white/10" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white text-sm font-medium">{log.model_name || '—'}</span>
                    {log.confidence_score && (
                      <Badge variant="secondary" className={cn(
                        "text-xs",
                        log.confidence_score > 0.8 ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                      )}>
                        {Math.round(log.confidence_score * 100)}%
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(log.detected_markers).map(([k, v]) => (
                      <span key={k} className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#93B5A1]/10 text-[#93B5A1] text-xs font-mono border border-[#93B5A1]/20">
                        {k}: {String(v)}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    onClick={() => handlePromote(log)}
                    className="px-3 py-1.5 rounded-lg bg-[#93B5A1] hover:bg-[#7a9e89] text-white text-xs font-medium transition-all shadow-[0_0_8px_rgba(147,181,161,0.3)]"
                  >
                    Promouvoir
                  </button>
                  <button
                    onClick={() => handleIgnore(log.id)}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 text-xs transition-all"
                  >
                    Ignorer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confusions Section */}
      {confusions && confusions.size > 0 && (
        <div className="p-4 rounded-xl bg-[#1A1A1A]/80 backdrop-blur-sm border border-amber-500/20">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-white">Confusions fréquentes</h3>
          </div>
          <div className="space-y-2">
            {[...confusions.entries()]
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([name, count]) => (
                <div key={name} className="flex items-center justify-between text-sm">
                  <span className="text-white/80">{name}</span>
                  <Badge variant="secondary" className="text-xs bg-white/10 text-white/60">{count}x</Badge>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Missing Models */}
      {missingModels && missingModels.size > 0 && (
        <div className="p-4 rounded-xl bg-[#1A1A1A]/80 backdrop-blur-sm border border-blue-500/20">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Modèles les plus demandés (non référencés)</h3>
          </div>
          <div className="space-y-2">
            {[...missingModels.entries()]
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([name, count]) => (
                <div key={name} className="flex items-center justify-between text-sm">
                  <span className="text-white/80">{name}</span>
                  <Badge variant="secondary" className="text-xs bg-white/10 text-white/60">{count} demandes</Badge>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Scans Table */}
      {isLoading ? (
        <div className="text-center py-8 text-white/40 text-sm">Chargement...</div>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-[#1A1A1A]/80 backdrop-blur-sm border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-2 px-3 text-white/40 font-medium">Photo</th>
                <th className="text-left py-2 px-3 text-white/40 font-medium">Réponse IA</th>
                <th className="text-left py-2 px-3 text-white/40 font-medium">Confiance</th>
                <th className="text-left py-2 px-3 text-white/40 font-medium">Statut</th>
                <th className="text-left py-2 px-3 text-white/40 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {scans?.map((scan) => (
                <tr key={scan.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-2 px-3">
                    {scan.image_url ? (
                      <img src={scan.image_url} alt="" className="w-10 h-10 rounded-lg object-cover border border-white/10" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-white/5" />
                    )}
                  </td>
                  <td className="py-2 px-3">
                    <span className="text-white font-medium">{scan.ai_brand} {scan.ai_model}</span>
                    {scan.corrected_text && (
                      <p className="text-xs text-amber-400">→ {scan.corrected_text}</p>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-xs",
                        scan.ai_confidence === "high" && "bg-emerald-500/20 text-emerald-400",
                        scan.ai_confidence === "medium" && "bg-amber-500/20 text-amber-400",
                      )}
                    >
                      {scan.ai_confidence}
                    </Badge>
                  </td>
                  <td className="py-2 px-3">
                    {scan.is_validated === true && (
                      <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">✓ Validé</Badge>
                    )}
                    {scan.is_validated === false && (
                      <Badge className="bg-amber-500/20 text-amber-400 text-xs">✏️ Corrigé</Badge>
                    )}
                    {scan.is_validated === null && (
                      <Badge variant="secondary" className="text-xs bg-white/10 text-white/50">En attente</Badge>
                    )}
                  </td>
                  <td className="py-2 px-3 text-white/40 text-xs">
                    {new Date(scan.created_at).toLocaleDateString("fr-FR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!scans || scans.length === 0) && (
            <p className="text-center py-8 text-white/30 text-sm">Aucun scan enregistré</p>
          )}
        </div>
      )}

      {/* Promote Confirmation Dialog */}
      <AlertDialog open={!!confirmPromote} onOpenChange={() => setConfirmPromote(null)}>
        <AlertDialogContent className="bg-[#1A1A1A] border-[#93B5A1]/30 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Écraser des marqueurs existants ?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Les clés suivantes existent déjà dans la signature avec des valeurs différentes :
              <span className="block mt-2 font-mono text-[#93B5A1]">
                {confirmPromote?.conflicts.join(', ')}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/10 text-white border-white/10 hover:bg-white/20">Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#93B5A1] hover:bg-[#7a9e89] text-white"
              onClick={async () => {
                if (!confirmPromote) return;
                const { data: model } = await supabase
                  .from("scooter_models")
                  .select("technical_signature")
                  .eq("id", confirmPromote.log.confirmed_model_id!)
                  .single();
                await executePromote(confirmPromote.log, (model as any)?.technical_signature || {});
              }}
            >
              Écraser et promouvoir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ScansManager;
