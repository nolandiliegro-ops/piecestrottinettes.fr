import { motion } from "framer-motion";
import { FileText } from "lucide-react";

interface ScooterDescriptionProps {
  description: string | null;
}

const ScooterDescription = ({ description }: ScooterDescriptionProps) => {
  if (!description) return null;

  return (
    <section className="py-12 lg:py-16">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-6 h-6 text-primary" />
            <h2 className="font-display text-3xl lg:text-4xl text-foreground">
              PRÉSENTATION
            </h2>
          </div>

          <div className="prose prose-lg max-w-none text-muted-foreground leading-relaxed">
            {description.split("\n").map((paragraph, index) => (
              <p key={index} className="mb-4">
                {paragraph}
              </p>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ScooterDescription;
