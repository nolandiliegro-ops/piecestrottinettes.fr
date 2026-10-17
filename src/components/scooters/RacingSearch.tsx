/** Recherche de /trottinettes en 5 habillages racing (17/10/2026, ?filtres=1..5). */
import { Search, ArrowRight } from "lucide-react";
import { UNB, FONT, CARBON, GREEN, LINE, CHECKER, type FilterLook } from "@/components/scooters/filterSkins";

interface Props {
  look: FilterLook;
  value: string;
  onChange: (v: string) => void;
}

const PH = "Ta trottinette : Xiaomi, G30…";

const RacingSearch = ({ look, value, onChange }: Props) => {
  const input = (cls: string, style: React.CSSProperties) => (
    <input id="scooter-search" type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={PH}
      aria-label="Rechercher une marque ou un modèle" className={`w-full bg-transparent outline-none ${cls}`} style={style} />
  );

  if (look === 1) {
    return (
      <div className="flex items-stretch h-14" style={{ filter: "drop-shadow(0 6px 14px rgba(26,26,26,0.12))" }}>
        <div className="flex-1 flex items-center gap-3 pl-4 pr-3 bg-white" style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)", boxShadow: `inset 0 0 0 1px ${LINE}` }}>
          <Search className="w-5 h-5 text-gray-400 shrink-0" />
          {input("h-full text-base text-carbon placeholder:text-gray-400", { fontFamily: FONT })}
        </div>
        <span className="flex items-center justify-center w-16 -ml-2" style={{ background: CARBON, clipPath: "polygon(12px 0, 100% 0, 100% 100%, 0 100%)" }} aria-hidden>
          <ArrowRight className="w-5 h-5 text-white" strokeWidth={2.5} />
        </span>
      </div>
    );
  }
  if (look === 2) {
    return (
      <div className="flex items-center gap-3 h-14 px-4 rounded-xl focus-within:ring-2 focus-within:ring-green-600" style={{ background: CARBON, boxShadow: `inset 0 -3px 0 ${GREEN}` }}>
        <Search className="w-5 h-5 shrink-0" style={{ color: "#9FD3AE" }} />
        {input("h-full text-base text-white placeholder:text-white/50", { fontFamily: FONT })}
        <span className="hidden sm:inline text-sm font-bold uppercase tracking-[0.18em] text-white/40" style={{ fontFamily: FONT }}>Chercher</span>
      </div>
    );
  }
  if (look === 3) {
    return (
      <div className="flex items-stretch h-14 rounded-lg overflow-hidden bg-white focus-within:ring-2 focus-within:ring-green-600" style={{ boxShadow: `inset 0 0 0 1px ${LINE}` }}>
        <span aria-hidden className="w-5 shrink-0" style={{ backgroundImage: CHECKER, backgroundSize: "10px 10px" }} />
        <div className="flex-1 flex items-center gap-3 px-4">
          <Search className="w-5 h-5 text-gray-400 shrink-0" />
          {input("h-full text-base text-carbon placeholder:text-gray-400", { fontFamily: FONT })}
        </div>
      </div>
    );
  }
  if (look === 4) {
    return (
      <div className="-skew-x-6 h-14 flex items-center gap-3 px-5 bg-white focus-within:ring-2 focus-within:ring-green-600" style={{ border: `2px solid ${CARBON}`, boxShadow: `5px 5px 0 ${GREEN}`, borderRadius: 4 }}>
        <div className="skew-x-6 flex items-center gap-3 w-full">
          <Search className="w-5 h-5 shrink-0" style={{ color: CARBON }} strokeWidth={2.5} />
          {input("h-full text-base text-carbon placeholder:text-gray-500 placeholder:italic", { fontFamily: FONT, fontWeight: 600 })}
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 h-16 focus-within:[box-shadow:inset_0_-3px_0_#4A7C59]" style={{ boxShadow: `inset 0 -2px 0 ${CARBON}` }}>
      <Search className="w-6 h-6 shrink-0" style={{ color: CARBON }} strokeWidth={2.5} />
      {input("h-full text-lg sm:text-xl text-carbon placeholder:text-gray-400", { fontFamily: UNB, fontWeight: 700, fontStyle: "italic", letterSpacing: "-0.01em" })}
    </div>
  );
};

export default RacingSearch;
