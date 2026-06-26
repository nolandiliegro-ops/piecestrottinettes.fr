import { motion } from "framer-motion";
import { Zap, Battery, Gauge, Route, CircleDot, Ruler } from "lucide-react";
import { ScooterDetail } from "@/hooks/useScooterDetail";
import { getBrandColors } from "@/contexts/ScooterContext";

interface ScooterSpecsProps {
  scooter: ScooterDetail;
}

const UNBOUNDED = "'Unbounded', sans-serif";

const ScooterSpecs = ({ scooter }: ScooterSpecsProps) => {
  const accent = getBrandColors(scooter.brand?.name).accent;

  // Vitesse terrain privé affichée seulement si renseignée ET > vitesse route.
  const hasPrivate =
    scooter.max_speed_private_kmh != null &&
    scooter.max_speed_kmh != null &&
    scooter.max_speed_private_kmh > scooter.max_speed_kmh;

  const speedSpecs = hasPrivate
    ? [
        { icon: Gauge, label: "Vitesse (route)", value: scooter.max_speed_kmh, unit: "km/h" },
        { icon: Gauge, label: "Vitesse (privé)", value: scooter.max_speed_private_kmh, unit: "km/h" },
      ]
    : [{ icon: Gauge, label: "Vitesse Max", value: scooter.max_speed_kmh, unit: "km/h" }];

  const specs = [
    { icon: Zap, label: "Puissance", value: scooter.power_watts, unit: "W" },
    { icon: Battery, label: "Voltage", value: scooter.voltage, unit: "V" },
    { icon: Ruler, label: "Capacité", value: scooter.amperage, unit: "Ah" },
    ...speedSpecs,
    { icon: Route, label: "Autonomie", value: scooter.range_km, unit: "km" },
    { icon: CircleDot, label: "Taille Pneus", value: scooter.tire_size, unit: "" },
  ].filter((spec) => spec.value != null && spec.value !== "");

  if (specs.length === 0) return null;

  return (
    <section className="py-12 lg:py-16">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl lg:text-4xl text-foreground mb-8 uppercase"
          style={{ fontFamily: UNBOUNDED, fontWeight: 800, letterSpacing: "-0.02em" }}
        >
          Spécifications techniques
        </motion.h2>

        {/* Grille 2 (mobile) / 3 (desktop) — pas de scroll horizontal */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {specs.map((spec, index) => {
            const isNumeric = typeof spec.value === "number";
            return (
              <motion.div
                key={spec.label}
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06 }}
                className="relative rounded-2xl border border-[#ECE7DD] p-5 shadow-[0_6px_18px_-12px_rgba(26,26,26,0.25)]"
                style={{ backgroundColor: "#F4F1EA" }}
              >
                {/* Icône dans carré teinté marque (seul rappel couleur marque) */}
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: `${accent}1f` }}
                >
                  <spec.icon className="w-5 h-5" style={{ color: accent }} strokeWidth={2.2} />
                </div>

                {/* Label */}
                <span className="block text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  {spec.label}
                </span>

                {/* Valeur : numérique = gros + unité petite ; texte long = plus petit, multi-lignes */}
                {isNumeric ? (
                  <div className="flex items-baseline gap-1">
                    <span
                      className="text-3xl lg:text-4xl text-foreground"
                      style={{ fontFamily: UNBOUNDED, fontWeight: 900, letterSpacing: "-0.03em" }}
                    >
                      {spec.value}
                    </span>
                    {spec.unit && <span className="text-sm text-muted-foreground">{spec.unit}</span>}
                  </div>
                ) : (
                  <span
                    className="block text-base lg:text-lg text-foreground leading-tight"
                    style={{
                      fontFamily: UNBOUNDED,
                      fontWeight: 700,
                      letterSpacing: "-0.01em",
                      overflowWrap: "anywhere",
                      wordBreak: "break-word",
                    }}
                  >
                    {spec.value}
                    {spec.unit ? ` ${spec.unit}` : ""}
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ScooterSpecs;
