import { ChevronDown } from "lucide-react";

const FONT = "'Plus Jakarta Sans', sans-serif";

export interface BrandFaqItem {
  q: string;
  a: string;
}

interface Props {
  items: BrandFaqItem[];
  brandName: string;
}

// FAQ pièces & entretien de la marque (13/10/2026). Accordéon natif <details> :
// zéro JS, accessible au clavier, contenu présent dans le DOM (lisible par Google),
// cible tactile ≥ 44 px. Doublé d'un JSON-LD FAQPage (brandSchema.ts).
const BrandFAQ = ({ items, brandName }: Props) => {
  const faq = items.filter((i) => i?.q?.trim() && i?.a?.trim());
  if (faq.length === 0) return null;

  return (
    <section className="px-4 py-12 lg:px-8 lg:py-16" style={{ backgroundColor: "#F5F0E8" }} aria-labelledby="brand-faq-title">
      <div className="mx-auto max-w-3xl">
        <h2
          id="brand-faq-title"
          className="text-2xl lg:text-3xl font-black uppercase tracking-tight mb-6"
          style={{ color: "#1A1A1A", fontFamily: FONT }}
        >
          Pièces {brandName} : tes questions
        </h2>
        <div className="flex flex-col gap-3">
          {faq.map((item, idx) => (
            <details
              key={idx}
              className="group rounded-2xl bg-white"
              style={{ border: "1px solid rgba(26,26,26,0.06)" }}
            >
              <summary
                className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-base font-bold [&::-webkit-details-marker]:hidden"
                style={{ color: "#1A1A1A", fontFamily: FONT }}
              >
                <span>{item.q}</span>
                <ChevronDown
                  className="h-5 w-5 flex-shrink-0 transition-transform duration-200 group-open:rotate-180"
                  strokeWidth={1.75}
                  aria-hidden
                />
              </summary>
              <p className="px-5 pb-5 text-[15px] leading-relaxed" style={{ color: "#1A1A1A", fontFamily: FONT }}>
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BrandFAQ;
