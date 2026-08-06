import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import "./RiderCard.css";

import {
  useRiderCardData,
  useSetFeaturedMachine,
  useToggleCardLike,
  useUploadMachinePhoto,
  type RiderCardData,
} from "@/hooks/useRiderCardData";
import { useAuthContext } from "@/contexts/AuthContext";
import { getProgressToNextLevel } from "@/lib/xpLevels";
import {
  computeGarageStats,
  formatWatts,
  getRarity,
  isHolo,
  modIconForCategory,
} from "@/lib/riderStats";

import RiderCardFace from "./RiderCardFace";
import MachineCardFace from "./MachineCardFace";
import MachineRail, { MAX_TILES, VISIBLE } from "./MachineRail";
import CardBackFace from "./CardBackFace";
import RiderCardSocial from "./RiderCardSocial";

interface RiderCardProps {
  mode?: "owner" | "public";
  username?: string;
  data?: RiderCardData;
}

const MODS_SLOTS = 3;

const RiderCard = ({ mode = "owner", username, data: providedData }: RiderCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const query = useRiderCardData(providedData ? {} : { username });
  const data = providedData ?? query.data ?? null;

  const [view, setView] = useState(0);
  const [back, setBack] = useState(false);
  const [railFrom, setRailFrom] = useState(0);
  const [sharing, setSharing] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);

  const setFeatured = useSetFeaturedMachine();
  const toggleLike = useToggleCardLike();
  const uploadPhoto = useUploadMachinePhoto();

  const machines = data?.machines ?? [];
  const tiles = machines.slice(0, MAX_TILES);
  const canEdit = mode === "owner" && !!user && data?.profile.id === user.id;

  const featuredIndex = Math.max(
    0,
    tiles.findIndex((m) => m.is_featured),
  );
  const featured = tiles[featuredIndex] ?? null;
  const current = view === 0 ? featured : (tiles[view - 1] ?? null);

  const holoIds = useMemo(() => {
    const set = new Set<string>();
    machines.forEach((m) => {
      if (isHolo(data?.modsByMachine[m.id] ?? [])) set.add(m.id);
    });
    return set;
  }, [machines, data]);

  const stats = useMemo(
    () =>
      computeGarageStats(
        machines.map((m) => ({ id: m.id, power_watts: m.model?.power_watts ?? 0 })),
        data?.modsByMachine ?? {},
      ),
    [machines, data],
  );

  if (query.isLoading && !providedData) {
    return (
      <div className="rcv7-scope">
        <div className="rcv7-stage">
          <div className="rcv7-flipper">
            <div className="rcv7-face">
              <div className="rcv7-card">
                <div className="rcv7-inner" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { profile } = data;
  const progress = getProgressToNextLevel(profile.performance_points ?? 0);
  const rarity = getRarity(current?.model?.power_watts);
  const holo = current ? holoIds.has(current.id) : false;
  const currentMods = current ? (data.modsByMachine[current.id] ?? []) : [];

  const flip = () => setBack((b) => !b);

  const handleRail = (dir: number) => {
    const max = Math.max(0, tiles.length - VISIBLE);
    setRailFrom((f) => Math.min(max, Math.max(0, f + dir)));
  };

  const handleShare = async () => {
    if (!captureRef.current) return;
    setSharing(true);
    try {
      const node = captureRef.current;
      const dataUrl = await toPng(node, {
        pixelRatio: 3,
        cacheBust: true,
        filter: (el) =>
          !(el instanceof HTMLElement && el.dataset.rcv7HideOnExport === "true"),
      });

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `carte-rider-${profile.username ?? "rider"}.png`, {
        type: "image/png",
      });
      const shareUrl = `${window.location.origin}/rider/${profile.username ?? ""}`;

      const nav = navigator as Navigator & {
        canShare?: (d: { files: File[] }) => boolean;
      };
      if (nav.share && nav.canShare?.({ files: [file] })) {
        await nav.share({
          files: [file],
          title: `Carte rider de ${profile.display_name ?? "rider"}`,
          text: "Voici ma carte rider 👇",
          url: shareUrl,
        });
      } else {
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = file.name;
        link.click();
        toast.success("Carte téléchargée en PNG");
      }
    } catch {
      toast.error("Impossible de générer l'image de la carte");
    } finally {
      setSharing(false);
    }
  };

  // ── Contenu vitrine (recto/verso) ───────────────────────────────────────
  const art = back ? (
    <CardBackFace
      machine={current}
      city={profile.rider_location}
      canEdit={canEdit}
      uploading={uploadPhoto.isPending}
      onFlip={flip}
      onUpload={(file) =>
        current &&
        uploadPhoto.mutate({
          garageId: current.id,
          file,
          alreadyClaimed: current.photo_xp_claimed,
        })
      }
    />
  ) : view === 0 ? (
    <RiderCardFace
      profile={profile}
      featured={featured}
      others={tiles.filter((_, i) => i !== featuredIndex)}
      onFlip={flip}
    />
  ) : current ? (
    <MachineCardFace machine={current} mods={currentMods} onFlip={flip} />
  ) : null;

  // ── Liste des mods ──────────────────────────────────────────────────────
  const mods =
    view === 0 ? (
      <div className="rcv7-mods">
        <div className="rcv7-mod">
          <span className="rcv7-ic">⚡</span>
          <span className="rcv7-tx">
            <b>Puissance cumulée</b>
            <span>Somme du garage</span>
          </span>
          <span className="rcv7-gn">{formatWatts(stats.totalWatts)}</span>
        </div>
        <div className={`rcv7-mod ${stats.siteMods > 0 ? "rcv7-own" : ""}`}>
          <span className="rcv7-ic">🔧</span>
          <span className="rcv7-tx">
            <b>Pièces montées</b>
            <span>dont {stats.siteMods} du site</span>
          </span>
          <span className="rcv7-gn">{stats.totalMods}</span>
        </div>
        <div className="rcv7-mod">
          <span className="rcv7-ic">⭐</span>
          <span className="rcv7-tx">
            <b>Cartes holo</b>
            <span>Builds 100 % site</span>
          </span>
          <span className="rcv7-gn">{stats.holoCount}</span>
        </div>
      </div>
    ) : (
      <div className="rcv7-mods">
        {Array.from({ length: Math.max(MODS_SLOTS, currentMods.length) })
          .slice(0, Math.max(MODS_SLOTS, 0))
          .map((_, i) => {
            const mod = currentMods[i];
            if (!mod) {
              return (
                <div className="rcv7-mod rcv7-empty" key={`empty-${i}`}>
                  Emplacement libre
                </div>
              );
            }
            const own = !!mod.order_item_id;
            return (
              <div className={`rcv7-mod ${own ? "rcv7-own" : ""}`} key={mod.id}>
                <span className="rcv7-ic">{modIconForCategory(mod.part?.category?.name)}</span>
                <span className="rcv7-tx">
                  <b>{mod.part?.name ?? "Pièce"}</b>
                  <span>
                    Montée le{" "}
                    {new Date(mod.installed_at).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </span>
                </span>
                <span className="rcv7-gn">{own ? "★ Site" : "Perso"}</span>
              </div>
            );
          })}
      </div>
    );

  const filled = Math.min(currentMods.length, MODS_SLOTS);
  const xpPercent =
    view === 0 ? progress.percentage : Math.round((filled / MODS_SLOTS) * 100);

  const allOwn = currentMods.length > 0 && currentMods.every((m) => !!m.order_item_id);

  // ── Cadre verrouillé (acier #5FB4D4) + vitrine adaptative ───────────────
  const renderCard = () => (
    <div
      className={`rcv7-card ${holo ? "rcv7-holo" : ""}`}
      style={{
        ["--m1" as string]: rarity.c1,
        ["--m3" as string]: rarity.c3,
        ["--tint" as string]: rarity.tint,
      }}
    >
      <span className="rcv7-rv rcv7-a" />
      <span className="rcv7-rv rcv7-b" />
      <span className="rcv7-rv rcv7-c" />
      <span className="rcv7-rv rcv7-d" />

      <div className="rcv7-inner">
        {/* En-tête rider — immuable */}
        <div className="rcv7-ct">
          {view !== 0 && (
            <button
              type="button"
              className="rcv7-backbtn"
              data-rcv7-hide-on-export="true"
              onClick={() => setView(0)}
            >
              ◂ Rider
            </button>
          )}
          <span
            className="rcv7-cname"
            style={view !== 0 ? { flex: 1, textAlign: "center" } : undefined}
          >
            {view === 0 ? (profile.display_name ?? "Rider") : (current?.model?.name ?? "Machine")}
          </span>
          <span className="rcv7-cpow">
            {view === 0 ? (
              <>
                {profile.performance_points ?? 0}
                <small> XP</small>
              </>
            ) : (
              <>
                {current?.model?.power_watts ?? 0}
                <small> W</small>
              </>
            )}
          </span>
        </div>

        {art}

        <div className="rcv7-tline">
          <em>{view === 0 ? progress.currentLevel.name : (current?.model?.brand ?? "—")}</em>
          <span className="rcv7-dash" />
          <span>
            {view === 0
              ? `LVL ${progress.currentLevel.level} · ${profile.rider_location ?? "France"} · ${
                  stats.machineCount
                } machine${stats.machineCount > 1 ? "s" : ""}`
              : `${formatWatts(current?.model?.power_watts ?? 0)} · ${
                  holo ? "Holo" : rarity.label
                }`}
          </span>
        </div>

        <MachineRail
          machines={tiles}
          view={view}
          featuredIndex={featuredIndex}
          railFrom={railFrom}
          holoIds={holoIds}
          canEdit={canEdit}
          onRail={handleRail}
          onSelect={(v) => {
            setView(v);
            setBack(false);
          }}
          onFeature={(id) => setFeatured.mutate(id)}
          onAddMachine={() => navigate("/trottinettes")}
        />

        <RiderCardSocial
          likes={data.likes}
          liked={data.likedByMe}
          canLike={!!user && user.id !== profile.id}
          sharing={sharing}
          onLike={() =>
            toggleLike.mutate({ ownerId: profile.id, liked: data.likedByMe })
          }
          onShare={handleShare}
        />

        {mods}

        <div className="rcv7-xpbar">
          <i style={{ width: `${xpPercent}%` }} />
        </div>

        <div className="rcv7-cf">
          <span>
            {view === 0 ? (
              <>
                N° <b>{profile.id.slice(0, 4).toUpperCase()}</b> ·{" "}
                {back ? "Verso" : "Carte rider"}
              </>
            ) : back ? (
              "Verso · en vrai"
            ) : (
              "Recto · rendu officiel"
            )}
          </span>
          <span>
            {view === 0
              ? `${profile.performance_points ?? 0} / ${
                  progress.nextLevel ? progress.nextLevel.minXP : progress.currentLevel.minXP
                } XP`
              : allOwn
                ? "★ 100 % du site"
                : `${filled} / ${MODS_SLOTS} mods`}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="rcv7-scope">
      <div className="rcv7-stage">
        <div className={`rcv7-flipper ${back ? "rcv7-back" : ""}`}>
          <div className="rcv7-face" ref={captureRef}>
            {!back && renderCard()}
          </div>
          <div className="rcv7-face rcv7-b">{back && renderCard()}</div>
        </div>
      </div>
    </div>
  );
};

export default RiderCard;
