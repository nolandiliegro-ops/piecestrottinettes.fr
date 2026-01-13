import { motion } from "framer-motion";
import { Zap, Battery, Gauge, Route, CircleDot, Ruler } from "lucide-react";
import { ScooterDetail } from "@/hooks/useScooterDetail";

interface ScooterSpecsProps {
  scooter: ScooterDetail;
}

const ScooterSpecs = ({ scooter }: ScooterSpecsProps) => {
  const specs = [
    {
      icon: Zap,
      label: "Puissance",
      value: scooter.power_watts,
      unit: "W",
      gradient: "from-yellow-500/20 to-orange-500/20",
      iconColor: "text-yellow-500",
    },
    {
      icon: Battery,
      label: "Voltage",
      value: scooter.voltage,
      unit: "V",
      gradient: "from-blue-500/20 to-cyan-500/20",
      iconColor: "text-blue-500",
    },
    {
      icon: Ruler,
      label: "Capacité",
      value: scooter.amperage,
      unit: "Ah",
      gradient: "from-purple-500/20 to-pink-500/20",
      iconColor: "text-purple-500",
    },
    {
      icon: Gauge,
      label: "Vitesse Max",
      value: scooter.max_speed_kmh,
      unit: "km/h",
      gradient: "from-red-500/20 to-orange-500/20",
      iconColor: "text-red-500",
    },
    {
      icon: Route,
      label: "Autonomie",
      value: scooter.range_km,
      unit: "km",
      gradient: "from-green-500/20 to-emerald-500/20",
      iconColor: "text-green-500",
    },
    {
      icon: CircleDot,
      label: "Taille Pneus",
      value: scooter.tire_size,
      unit: "",
      gradient: "from-gray-500/20 to-slate-500/20",
      iconColor: "text-gray-500",
    },
  ].filter((spec) => spec.value);

  if (specs.length === 0) return null;

  return (
    <section className="py-12 lg:py-16">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display text-3xl lg:text-4xl text-foreground mb-8"
        >
          SPÉCIFICATIONS TECHNIQUES
        </motion.h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {specs.map((spec, index) => (
            <motion.div
              key={spec.label}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative"
            >
              <div
                className={`relative rounded-2xl border border-border bg-card p-6 overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary/30`}
              >
                {/* Background gradient */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${spec.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                />

                <div className="relative z-10">
                  {/* Icon */}
                  <spec.icon className={`w-6 h-6 ${spec.iconColor} mb-4`} />

                  {/* Value */}
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="font-display text-3xl lg:text-4xl text-foreground">
                      {spec.value}
                    </span>
                    {spec.unit && (
                      <span className="text-sm text-muted-foreground">{spec.unit}</span>
                    )}
                  </div>

                  {/* Label */}
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    {spec.label}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ScooterSpecs;
