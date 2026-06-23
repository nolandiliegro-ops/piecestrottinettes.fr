import { motion } from "framer-motion";
import { FileText } from "lucide-react";

interface ScooterDescriptionProps {
  description: string | null;
  accentColor?: string;
}

const UNBOUNDED = "'Unbounded', sans-serif";

const ScooterDescription = ({ description, accentColor = "#6B8E89" }: ScooterDescriptionProps) => {
  if (!description) return null;

  return (
    <section className="py-12 lg:py-16">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl rounded-2xl bg-white border border-[#ECE7DD] shadow-[0_6px_18px_-12px_rgba(26,26,26,0.25)] overflow-hidden"
        >
          <div className="flex">
            {/* Filet 4px couleur marque à gauche */}
            <div className="w-1 flex-shrink-0" style={{ backgroundColor: accentColor }} aria-hidden />

            <div className="p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-5">
                <span
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${accentColor}1f` }}
                >
                  <FileText className="w-5 h-5" style={{ color: accentColor }} strokeWidth={2.2} />
                </span>
                <h2
                  className="text-2xl lg:text-3xl text-foreground uppercase"
                  style={{ fontFamily: UNBOUNDED, fontWeight: 800, letterSpacing: "-0.02em" }}
                >
                  Présentation
                </h2>
              </div>

              <div className="prose prose-lg max-w-none text-muted-foreground leading-relaxed">
                {description.split("\n").map((paragraph, index) => (
                  <p key={index} className="mb-4 last:mb-0">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ScooterDescription;
