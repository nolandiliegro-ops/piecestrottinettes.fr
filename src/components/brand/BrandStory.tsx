import { motion, useReducedMotion } from "framer-motion";

const EASE: [number, number, number, number] = [0.32, 0.72, 0, 1];
const FONT = "'Plus Jakarta Sans', sans-serif";

interface Props {
  description: string;
}

// Editorial "ADN" block — long-form brand story. Rendered only when a description exists.
const BrandStory = ({ description }: Props) => {
  const reduce = useReducedMotion();

  return (
    <section className="px-4 py-16 lg:px-8 lg:py-24" style={{ backgroundColor: "#F5F0E8" }}>
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: EASE }}
        className="mx-auto max-w-3xl"
      >
        <p
          className="text-[10px] font-bold uppercase tracking-[0.25em] mb-3"
          style={{ color: "#6B7280", fontFamily: FONT }}
        >
          — L'ADN
        </p>
        <h2
          className="text-3xl lg:text-5xl mb-6 leading-tight"
          style={{
            fontFamily: "'Anton', sans-serif",
            color: "#1A1A1A",
            textTransform: "uppercase",
            letterSpacing: "-0.01em",
          }}
        >
          L'histoire
        </h2>
        <p
          className="text-base lg:text-lg leading-relaxed whitespace-pre-line"
          style={{ color: "#4B5563", fontFamily: FONT }}
        >
          {description}
        </p>
      </motion.div>
    </section>
  );
};

export default BrandStory;
