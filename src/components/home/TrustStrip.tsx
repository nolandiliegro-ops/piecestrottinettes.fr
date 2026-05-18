import { Truck, Wrench, RotateCcw } from "lucide-react";

const items = [
  { icon: Truck, label: "Sous 24h" },
  { icon: Wrench, label: "Méca pro" },
  { icon: RotateCcw, label: "Retour 14j" },
];

const TrustStrip = () => {
  return (
    <section
      className="px-4 py-8 lg:py-12"
      style={{ backgroundColor: "#F5F0E8" }}
    >
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl bg-white shadow-md grid grid-cols-3 divide-x divide-gray-100">
          {items.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex flex-col items-center justify-center gap-2 py-5 lg:py-6 px-2"
            >
              <Icon
                className="w-6 h-6 lg:w-7 lg:h-7"
                style={{ color: "#4A7C59" }}
                strokeWidth={1.6}
              />
              <span
                className="text-xs lg:text-sm font-semibold text-center"
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  color: "#1A1A1A",
                }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustStrip;
