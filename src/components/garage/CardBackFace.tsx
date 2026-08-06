import { useRef } from "react";
import type { RiderMachine } from "@/hooks/useRiderCardData";
import ScooterSilhouette from "./ScooterSilhouette";

interface CardBackFaceProps {
  machine: RiderMachine | null;
  city: string | null;
  canEdit: boolean;
  uploading: boolean;
  onFlip: () => void;
  onUpload: (file: File) => void;
}

/** Verso : photo réelle du rider, ou slot d'incitation +50 XP. */
const CardBackFace = ({
  machine,
  city,
  canEdit,
  uploading,
  onFlip,
  onUpload,
}: CardBackFaceProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const photo = machine?.custom_photo_url ?? null;

  if (photo) {
    return (
      <div className="rcv7-art rcv7-real">
        <img className="rcv7-photofill" src={photo} alt={machine?.model?.name ?? "Photo du rider"} />
        <span className="rcv7-grain" />
        <span className="rcv7-vgn" />
        <span className="rcv7-photolbl">
          <i /> Photo du rider
        </span>
        <span className="rcv7-exif">
          <b>{city ?? "Quelque part"}</b>
          {machine?.model?.name ?? ""}
        </span>
        <button type="button" className="rcv7-flipbtn" onClick={onFlip}>
          ◂ Voir le rendu
        </button>
      </div>
    );
  }

  return (
    <div className="rcv7-art rcv7-empty">
      <span className="rcv7-grain" />
      <span className="rcv7-photolbl">
        <i style={{ background: "#6B7280", boxShadow: "none" }} /> Verso vide
      </span>

      {canEdit && machine ? (
        <div className="rcv7-emptybox">
          <div className="rcv7-ico">📷</div>
          <div className="rcv7-t1">Montre-la en vrai</div>
          <button
            type="button"
            className="rcv7-t2"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? "Envoi…" : machine.photo_xp_claimed ? "Ajouter une photo" : "+50 XP"}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
              e.target.value = "";
            }}
          />
        </div>
      ) : (
        <div className="rcv7-emptybox">
          <div className="rcv7-ico">
            <ScooterSilhouette color="rgba(255,255,255,.4)" />
          </div>
          <div className="rcv7-t1">Pas encore de photo réelle</div>
        </div>
      )}

      <button type="button" className="rcv7-flipbtn" onClick={onFlip}>
        ◂ Voir le rendu
      </button>
    </div>
  );
};

export default CardBackFace;
