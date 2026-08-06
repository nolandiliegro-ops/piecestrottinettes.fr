import type { RiderMachine } from "@/hooks/useRiderCardData";
import { getRarity } from "@/lib/riderStats";
import ScooterSilhouette from "./ScooterSilhouette";

const MAX_TILES = 12;
const MIN_SLOTS = 5;
const VISIBLE = 6;
const TILE_STEP = 38;

interface MachineRailProps {
  machines: RiderMachine[];
  view: number;
  featuredIndex: number;
  railFrom: number;
  holoIds: Set<string>;
  canEdit: boolean;
  onRail: (dir: number) => void;
  onSelect: (index: number) => void;
  onFeature: (garageId: string) => void;
  onAddMachine: () => void;
}

const MachineRail = ({
  machines,
  view,
  featuredIndex,
  railFrom,
  holoIds,
  canEdit,
  onRail,
  onSelect,
  onFeature,
  onAddMachine,
}: MachineRailProps) => {
  const tiles = machines.slice(0, MAX_TILES);
  const emptySlots = canEdit ? Math.max(0, MIN_SLOTS - tiles.length) : 0;
  const label = view === 0 ? `0 / ${tiles.length}` : `${view} / ${tiles.length}`;

  return (
    <div className="rcv7-carou">
      <button
        type="button"
        className="rcv7-cbtn"
        aria-label="Machines précédentes"
        onClick={() => onRail(-1)}
      >
        ◂
      </button>

      <span className="rcv7-track">
        <span
          className="rcv7-rail"
          style={{ transform: `translateX(-${railFrom * TILE_STEP}px)` }}
        >
          {tiles.map((machine, index) => {
            const rarity = getRarity(machine.model?.power_watts);
            const active = view === index + 1 || (view === 0 && index === featuredIndex);
            const image = machine.model?.image_url;

            return (
              <button
                type="button"
                key={machine.id}
                className={`rcv7-rc ${active ? "rcv7-on " : ""}${holoIds.has(machine.id) ? "rcv7-hl" : ""}`}
                style={{ ["--c1" as string]: rarity.c1, ["--c3" as string]: rarity.c3 }}
                title={machine.model?.name ?? "Machine"}
                aria-label={machine.model?.name ?? "Machine"}
                onClick={() => {
                  // Re-clic sur la vignette de la carte active → machine à la une
                  if (canEdit && view === index + 1) {
                    onFeature(machine.id);
                    onSelect(0);
                  } else {
                    onSelect(index + 1);
                  }
                }}
              >
                <span className="rcv7-ri">
                  <span className="rcv7-gl" />
                  {image ? (
                    <img src={image} alt="" loading="lazy" />
                  ) : (
                    <ScooterSilhouette color="rgba(255,255,255,.9)" />
                  )}
                </span>
              </button>
            );
          })}

          {Array.from({ length: emptySlots }).map((_, i) => (
            <button
              type="button"
              key={`slot-${i}`}
              className="rcv7-rc rcv7-slot"
              aria-label="Ajouter une machine"
              title="Ajouter une machine"
              onClick={onAddMachine}
            >
              +
            </button>
          ))}
        </span>
      </span>

      <button
        type="button"
        className="rcv7-cbtn"
        aria-label="Machines suivantes"
        onClick={() => onRail(1)}
      >
        ▸
      </button>
      <span className="rcv7-cidx">{label}</span>
    </div>
  );
};

export { MAX_TILES, VISIBLE };
export default MachineRail;
