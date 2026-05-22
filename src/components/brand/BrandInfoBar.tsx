import { motion, useReducedMotion } from "framer-motion";
import { MapPin, Calendar, Globe } from "lucide-react";

const EASE: [number, number, number, number] = [0.32, 0.72, 0, 1];
const FONT = "'Plus Jakarta Sans', sans-serif";

interface Props {
  country: string | null;
  foundedYear: number | null;
  websiteUrl: string | null;
  brandName: string;
}

// Practical info mini-bento. Only present fields are shown; the whole section
// is hidden when none of country / founded_year / website_url are set.
const BrandInfoBar = ({ country, foundedYear, websiteUrl, brandName }: Props) => {
  const reduce = useReducedMotion();

  const items: { key: string; icon: typeof MapPin; label: string; value: string; href?: string }[] = [];
  if (country) items.push({ key: "country", icon: MapPin, label: "Origine", value: country });
  if (foundedYear) items.push({ key: "founded", icon: Calendar, label: "Fondée en", value: String(foundedYear) });
  if (websiteUrl) items.push({ key: "website", icon: Globe, label: "Site officiel", value: "Visiter", href: websiteUrl });

  if (items.length === 0) return null;

  return (
    <section className="px-4 py-12 lg:px-8 lg:py-16" style={{ backgroundColor: "#F5F0E8" }}>
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: EASE }}
        className="mx-auto max-w-4xl grid gap-3 sm:grid-cols-3"
      >
        {items.map(({ key, icon: Icon, label, value, href }) => {
          const inner = (
            <div
              className="flex items-center gap-3 rounded-2xl bg-white p-4 h-full"
              style={{ border: "1px solid rgba(26,26,26,0.06)" }}
            >
              <span
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "rgba(26,26,26,0.05)" }}
              >
                <Icon className="w-5 h-5" strokeWidth={1.5} style={{ color: "#1A1A1A" }} aria-hidden />
              </span>
              <div>
                <p
                  className="text-[10px] uppercase tracking-[0.2em] font-bold"
                  style={{ color: "#6B7280", fontFamily: FONT }}
                >
                  {label}
                </p>
                <p className="text-sm font-bold" style={{ color: "#1A1A1A", fontFamily: FONT }}>
                  {value}
                </p>
              </div>
            </div>
          );

          return href ? (
            <a
              key={key}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Site officiel ${brandName} (nouvel onglet)`}
              className="transition-transform duration-300 hover:-translate-y-1"
            >
              {inner}
            </a>
          ) : (
            <div key={key}>{inner}</div>
          );
        })}
      </motion.div>
    </section>
  );
};

export default BrandInfoBar;
