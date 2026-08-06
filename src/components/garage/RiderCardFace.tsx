import type { RiderCardProfile, RiderMachine } from "@/hooks/useRiderCardData";
import { getRarity, moodLabel } from "@/lib/riderStats";
import ScooterSilhouette from "./ScooterSilhouette";

interface RiderCardFaceProps {
  profile: RiderCardProfile;
  featured: RiderMachine | null;
  others: RiderMachine[];
  onFlip: () => void;
}

/** Position 0 — carte rider globale : machine à la une + silhouettes du garage derrière. */
const RiderCardFace = ({ profile, featured, others, onFlip }: RiderCardFaceProps) => {
  const rarity = getRarity(featured?.model?.power_watts);
  const initial = (profile.display_name?.trim()?.[0] ?? "R").toUpperCase();

  return (
    <div className="rcv7-art rcv7-off">
      <span className="rcv7-rays" />
      <span className="rcv7-flr" />

      <span className="rcv7-bgline">
        {others.slice(0, 5).map((m) =>
          m.model?.image_url ? (
            <img key={m.id} src={m.model.image_url} alt="" loading="lazy" />
          ) : (
            <ScooterSilhouette key={m.id} color="#fff" />
          ),
        )}
      </span>

      <span className="rcv7-mood">{moodLabel(featured?.mood)}</span>
      <span className="rcv7-gem">
        <b /> {rarity.label}
      </span>

      <span className="rcv7-avb">
        {profile.avatar_url ? <img src={profile.avatar_url} alt="" /> : initial}
      </span>

      <span className="rcv7-hero">
        {featured?.model?.image_url ? (
          <img src={featured.model.image_url} alt={featured.model.name} />
        ) : (
          <ScooterSilhouette />
        )}
      </span>

      <span className="rcv7-hname">
        <b>{featured?.model?.name ?? "Garage vide"}</b>
        <span>
          {featured
            ? `« ${featured.nickname ?? featured.model?.brand ?? "ma machine"} » · ${
                featured.model?.power_watts ?? 0
              } W`
            : "Ajoute ta première machine"}
        </span>
      </span>

      <button type="button" className="rcv7-flipbtn" onClick={onFlip}>
        📷 Voir en vrai ▸
      </button>
    </div>
  );
};

export default RiderCardFace;
