import { Bike, Check } from "lucide-react";

/** Tuile « Plaque » (choix de Nolan du 25/10 pour le sélecteur clavier ouvert) : cadre carbone 2 px, photo sur fond pierre,
 *  marque en petites capitales grises, modèle en Unbounded italique sans répéter la marque. Partagée par la recherche
 *  du haut de l'accueil ; le sélecteur garde sa copie dans ScooterSelectorSheet (KbPicks, variante 6). */
const UNB = "'Unbounded', sans-serif";
const CARBON = "#1A1A1A";
const GREEN = "#4A7C59";

export const modelWithoutBrand = (name: string, brand?: string | null) => {
  const b = (brand ?? "").trim();
  return b && name.toLowerCase().startsWith(b.toLowerCase() + " ") ? name.slice(b.length + 1) : name;
};

interface Props {
  brand?: string | null;
  name: string;
  imageUrl?: string | null;
  onClick: () => void;
  active?: boolean;
  note?: string;
  label?: string;
}

const PlaqueTile = ({ brand, name, imageUrl, onClick, active = false, note, label }: Props) => (
  <button type="button" onClick={onClick} aria-pressed={active} aria-label={label} className="relative min-w-0 text-left bg-white" style={{ boxShadow: active ? `inset 0 0 0 3px ${GREEN}` : `inset 0 0 0 2px ${CARBON}` }}>
    <span className="block m-[2px]" style={{ background: "#F2EFE8" }}>
      <span className="flex items-center justify-center" style={{ height: 96 }}>
        {imageUrl ? <img src={imageUrl} alt="" loading="lazy" decoding="async" className="max-h-full max-w-[88%] object-contain" /> : <Bike size={28} className="text-gray-400" />}
      </span>
    </span>
    <span className="block px-3 pt-2.5 pb-3">
      {brand && <span className="block text-sm font-extrabold uppercase tracking-[0.12em] leading-none break-words" style={{ color: "#6B7280" }}>{brand}</span>}
      <span className="mt-1.5 block uppercase leading-[1.1] break-words" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", fontSize: 15, color: CARBON }}>{modelWithoutBrand(name, brand)}</span>
      {note && <span className="mt-1.5 block text-sm font-semibold" style={{ color: GREEN }}>{note}</span>}
    </span>
    {active && <span className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center text-white" style={{ background: GREEN, borderRadius: 999 }}><Check size={16} strokeWidth={3} /></span>}
  </button>
);

export default PlaqueTile;
