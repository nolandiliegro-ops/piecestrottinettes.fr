/** Garage : choisir les 5 « à moi » et les 5 « je kiffe » affichés sur la carte Story (25/10/2026). */
import { Check, Loader2, Plus } from "lucide-react";
import { useToggleCardSlot, type RiderMachine } from "@/hooks/useRiderCardData";

const UNB = "'Unbounded', sans-serif";
const FONT = "'Plus Jakarta Sans', sans-serif";
const CARBON = "#1A1A1A";
const GREEN = "#4A7C59";
const LINE = "#E2DCD0";
const LIKE_BG = "#F1D9CC";
const ch = (c: number) => `polygon(0 0, calc(100% - ${c}px) 0, 100% ${c}px, 100% 100%, ${c}px 100%, 0 calc(100% - ${c}px))`;

const Group = ({ title, owned, machines, all }: { title: string; owned: boolean; machines: RiderMachine[]; all: RiderMachine[] }) => {
  const toggle = useToggleCardSlot();
  const on = machines.filter((m) => m.card_slot != null).length;
  if (!machines.length) return null;
  return (
    <div>
      <p className="text-sm font-extrabold uppercase tracking-wide" style={{ color: owned ? GREEN : "#C2410C" }}>
        {title} <span style={{ color: "#6B7280" }}>· {on}/5 sur la carte</span>
      </p>
      <ul className="mt-2 grid gap-2 grid-cols-[minmax(0,1fr)] sm:grid-cols-2">
        {machines.map((m) => {
          const sel = m.card_slot != null;
          // 25/10 (recette) : l'écriture + la relecture prennent ~2 s ; sans signe, on croit que le toucher n'a pas marché.
          const busy = toggle.isPending && toggle.variables?.machine.id === m.id;
          return (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => toggle.mutate({ machine: m, all })}
                disabled={toggle.isPending}
                aria-pressed={sel}
                aria-busy={busy}
                className={`w-full min-h-[56px] flex items-center gap-3 p-2 text-left transition-opacity ${toggle.isPending && !busy ? "opacity-60" : ""}`}
                style={{ background: sel ? (owned ? "#FFFFFF" : LIKE_BG) : "transparent", boxShadow: `inset 0 0 0 ${sel ? 2 : 1}px ${sel ? (owned ? GREEN : "#C2410C") : LINE}`, clipPath: ch(8) }}
              >
                {m.model?.image_url && <img src={m.model.image_url} alt="" loading="lazy" className="w-10 h-10 object-contain shrink-0" />}
                <span className="min-w-0 flex-1 text-sm font-bold leading-tight" style={{ color: CARBON }}>
                  {m.model?.name}
                  {m.nickname && <span className="block font-semibold" style={{ color: GREEN }}>« {m.nickname} »</span>}
                </span>
                <span className="w-8 h-8 shrink-0 inline-flex items-center justify-center" style={{ background: sel ? CARBON : "#FFFFFF", color: sel ? "#FFFFFF" : CARBON, boxShadow: sel ? undefined : `inset 0 0 0 1px ${LINE}` }} aria-hidden>
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : sel ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const RiderCardPicker = ({ machines }: { machines: RiderMachine[] }) => {
  const list = machines.filter((m) => m.model);
  return (
    <section className="p-4 bg-[#FAFAF8] grid gap-4" style={{ clipPath: ch(14), fontFamily: FONT }} aria-label="Ce qui s'affiche sur ma carte">
      <div>
        <h3 className="text-base uppercase" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: CARBON }}>Sur ma carte</h3>
        <p className="mt-1 text-sm" style={{ color: "#4B5563" }}>Choisis 5 trotts à toi et 5 coups de cœur. Touche une trott pour l'ajouter ou la retirer.</p>
      </div>
      <Group title="À moi" owned machines={list.filter((m) => m.is_owned)} all={list} />
      <Group title="Je kiffe" owned={false} machines={list.filter((m) => !m.is_owned)} all={list} />
    </section>
  );
};

export default RiderCardPicker;
