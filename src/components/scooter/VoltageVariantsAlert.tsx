import { useQuery } from "@tanstack/react-query";
import { Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// 19/10 (Nolan) : un même modèle existe parfois en plusieurs tensions (ex. Speedway Mini 4 Pro 36 V / 48 V).
// Dès que scooter_battery_configs porte plus d'une tension, on prévient AVANT que le client commande
// un chargeur ou une batterie. Source unique : scooter_battery_configs (label généré, ex. « 48V 13Ah »).

type Config = { voltage: number; capacity_ah: number | string | null; is_default: boolean | null };

export const useVoltageVariants = (scooterId: string | null | undefined) =>
  useQuery({
    queryKey: ["scooter-voltage-variants", scooterId],
    enabled: !!scooterId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scooter_battery_configs")
        .select("voltage, capacity_ah, is_default")
        .eq("scooter_model_id", scooterId!)
        .order("voltage", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Config[];
    },
  });

const ah = (v: Config["capacity_ah"]) => {
  const n = v == null ? NaN : Number(v);
  return Number.isFinite(n) && n > 0 ? `${n.toLocaleString("fr-FR")} Ah` : null;
};

const CHAMFER = "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 0 100%)";

const VoltageVariantsAlert = ({ scooterId, scooterName }: { scooterId?: string; scooterName: string }) => {
  const { data = [] } = useVoltageVariants(scooterId);
  const voltages = [...new Set(data.map((c) => c.voltage))];
  if (voltages.length < 2) return null;

  const label = voltages.map((v) => `${v} V`).join(" et ").replace(/ et (?=.* et )/g, ", ");

  return (
    <div
      role="note"
      className="mb-6 max-w-2xl bg-[#1A1A1A] text-white p-4 sm:p-5"
      style={{ clipPath: CHAMFER, boxShadow: "inset 4px 0 0 #4A7C59" }}
    >
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 w-10 h-10 rounded-full bg-[#4A7C59] flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-base font-extrabold uppercase tracking-tight leading-tight">
            Ta {scooterName} existe en {label}
          </p>
          <p className="text-sm text-white/80 mt-1 leading-snug">
            Avant de commander un chargeur ou une batterie, vérifie la tension sur l'étiquette sous le plateau ou sur ton chargeur d'origine. Chaque chargeur indique sa tension dans son nom.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {data.map((c, i) => (
              <span key={i} className="inline-flex items-center min-h-[32px] px-3 rounded-full bg-white/10 text-sm font-semibold">
                {c.voltage} V{ah(c.capacity_ah) ? ` · ${ah(c.capacity_ah)}` : ""}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoltageVariantsAlert;
