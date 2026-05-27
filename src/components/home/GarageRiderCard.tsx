import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ArrowRight, Star } from "lucide-react";

const GarageRiderCard = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const riderNumber = useMemo(() => {
    if (!user?.id) return "—";
    let hash = 0;
    for (let i = 0; i < user.id.length; i++) {
      hash = (hash * 31 + user.id.charCodeAt(i)) >>> 0;
    }
    return String(hash % 9999)
      .padStart(4, "0");
  }, [user?.id]);

  const handleClick = () => {
    if (user) {
      navigate("/garage");
    } else {
      navigate("/login");
    }
  };

  const headline = user ? "Retourne dans TON garage." : "Entre dans TON garage.";
  const description = user
    ? "Tes scooters, tes mods, ton XP, ton historique de maintenance. Tout est là."
    : "Sauvegarde ta trottinette, gagne de l'XP à chaque action, suis tes mods et ton historique de maintenance.";
  const ctaLabel = user
    ? `RETOUR AU GARAGE${profile?.display_name ? `, ${profile.display_name.toUpperCase()}` : ""} →`
    : "CRÉER MON GARAGE →";

  return (
    <section className="px-4 py-10 lg:py-14" style={{ backgroundColor: "#FAFAF8" }}>
      <style>{`
        @keyframes garageShine {
          0% { background-position: -150% 50%; }
          100% { background-position: 250% 50%; }
        }
      `}</style>

      <div className="mx-auto max-w-3xl">
        <div
          className="relative overflow-hidden rounded-2xl p-6 sm:p-8 lg:p-10"
          style={{
            background:
              "linear-gradient(135deg, #161616 0%, #0d0d0d 100%)",
            border: "1px solid rgba(74,124,89,0.35)",
            boxShadow:
              "0 20px 50px -10px rgba(0,0,0,0.55), 0 0 0 1px rgba(74,124,89,0.08) inset",
          }}
        >
          {/* Shine bar top */}
          <div
            className="absolute top-0 left-0 right-0 h-[3px] pointer-events-none"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, #4A7C59 30%, #FF6600 50%, #4A7C59 70%, transparent 100%)",
              backgroundSize: "200% 100%",
              animation: "garageShine 4s linear infinite",
            }}
            aria-hidden
          />

          {/* Decorative radial gradients */}
          <div
            className="absolute -top-20 -right-20 w-64 h-64 rounded-full pointer-events-none opacity-50"
            style={{
              background:
                "radial-gradient(circle, rgba(74,124,89,0.35) 0%, transparent 70%)",
            }}
            aria-hidden
          />
          <div
            className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full pointer-events-none opacity-30"
            style={{
              background:
                "radial-gradient(circle, rgba(255,102,0,0.35) 0%, transparent 70%)",
            }}
            aria-hidden
          />

          <div className="relative z-10">
            <div className="flex items-center gap-3 flex-wrap mb-4 lg:mb-5">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] lg:text-xs font-bold tracking-widest uppercase"
                style={{
                  backgroundColor: "rgba(74,124,89,0.18)",
                  color: "#7FB58F",
                  border: "1px solid rgba(74,124,89,0.4)",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                <Star className="w-3 h-3 fill-current" />
                Espace Rider
              </span>
              <span
                className="text-[10px] lg:text-xs tracking-[0.25em] text-white/40 uppercase"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                N°{riderNumber} / 2026
              </span>
            </div>

            <h2
              className="text-3xl sm:text-4xl lg:text-5xl mb-3 lg:mb-4 leading-[1.05]"
              style={{
                fontFamily: "'Anton', sans-serif",
                color: "#FFFFFF",
                letterSpacing: "-0.01em",
                textTransform: "uppercase",
              }}
            >
              {headline.split("TON")[0]}
              <span style={{ color: "#FF6600" }}>TON</span>
              {headline.split("TON")[1]}
            </h2>

            <p
              className="text-sm lg:text-base text-white/70 mb-5 lg:mb-7 max-w-xl"
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                lineHeight: 1.55,
              }}
            >
              {description}
            </p>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-6 lg:mb-8">
              {[
                { value: "+50 XP", label: "cadeau" },
                { value: "1 min", label: "setup" },
                { value: "∞", label: "trottis" },
              ].map((stat) => (
                <div key={stat.label} className="flex items-baseline gap-1.5">
                  <span
                    className="text-base lg:text-lg font-bold"
                    style={{
                      color: "#FFFFFF",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                  >
                    {stat.value}
                  </span>
                  <span
                    className="text-[11px] lg:text-xs uppercase tracking-wider text-white/50"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={handleClick}
              className="inline-flex items-center gap-2 px-6 lg:px-7 py-3.5 lg:py-4 rounded-xl text-white font-bold transition-all min-h-[48px]"
              style={{
                backgroundColor: "#FF6600",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                letterSpacing: "0.04em",
                fontSize: "14px",
                boxShadow: "0 8px 24px -6px rgba(255,102,0,0.55)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#E55C00")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#FF6600")
              }
            >
              <span>{ctaLabel}</span>
              <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GarageRiderCard;
