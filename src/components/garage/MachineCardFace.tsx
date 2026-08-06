import type { RiderMachine, RiderMod } from "@/hooks/useRiderCardData";
import { getRarity, moodLabel } from "@/lib/riderStats";
import ScooterSilhouette from "./ScooterSilhouette";

interface MachineCardFaceProps {
  machine: RiderMachine;
  mods: RiderMod[];
  onFlip: () => void;
}

/** Positions 1 → N — carte d'une machine du garage. */
const MachineCardFace = ({ machine, onFlip }: MachineCardFaceProps) => {
  const rarity = getRarity(machine.model?.power_watts);

  return (
    <div className="rcv7-art rcv7-off">
      <span className="rcv7-rays" />
      <span className="rcv7-flr" />

      <span className="rcv7-mood">{moodLabel(machine.mood)}</span>
      <span className="rcv7-gem">
        <b /> {rarity.label}
      </span>

      <span className="rcv7-hero">
        {machine.model?.image_url ? (
          <img src={machine.model.image_url} alt={machine.model.name} />
        ) : (
          <ScooterSilhouette />
        )}
      </span>

      <span className="rcv7-hname">
        <b>{machine.model?.name ?? "Machine"}</b>
        <span>
          {`« ${machine.nickname ?? machine.model?.brand ?? "ma machine"} »`}
          {machine.model?.year ? ` · ${machine.model.year}` : ""}
          {machine.model?.voltage ? ` · ${machine.model.voltage} V` : ""}
        </span>
      </span>

      <button type="button" className="rcv7-flipbtn" onClick={onFlip}>
        📷 Voir en vrai ▸
      </button>
    </div>
  );
};

export default MachineCardFace;
