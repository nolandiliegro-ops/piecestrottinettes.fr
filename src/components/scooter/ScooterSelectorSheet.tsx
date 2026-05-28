import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bike, Check, Heart, Home, Plus, Search, X } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useUserGarage, type GarageItem } from "@/hooks/useGarage";
import {
  useSelectedScooter,
  getBrandColors,
  type ScooterOption,
} from "@/contexts/ScooterContext";
import { THEME, hexToRgba } from "@/lib/theme";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const DIACRITICS_RE = new RegExp("[\\u0300-\\u036f]", "g");

const normalize = (s: string): string =>
  s.toLowerCase().normalize("NFD").replace(DIACRITICS_RE, "");

type BadgeKind = "owned" | "fav" | null;

const ScooterSelectorSheet = ({ open, onOpenChange }: Props) => {
  const navigate = useNavigate();
  const { selectedScooter, setSelectedScooter, clearSelection, allScooters } =
    useSelectedScooter();
  const { data: garageScooters, isLoading } = useUserGarage();
  const [query, setQuery] = useState("");

  const hasScooters = !!garageScooters && garageScooters.length > 0;
  const ownedItems = useMemo(
    () => (garageScooters ?? []).filter((i) => i.is_owned && i.scooter_model),
    [garageScooters]
  );
  const favItems = useMemo(
    () => (garageScooters ?? []).filter((i) => !i.is_owned && i.scooter_model),
    [garageScooters]
  );

  // model id -> is_owned, to badge search results already saved in the garage
  const garageById = useMemo(() => {
    const m = new Map<string, boolean>();
    for (const item of garageScooters ?? []) {
      const id = item.scooter_model?.id;
      if (id) m.set(id, item.is_owned);
    }
    return m;
  }, [garageScooters]);

  const trimmed = query.trim();
  const isSearching = trimmed.length > 0;
  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    const q = normalize(trimmed);
    return allScooters.filter((s) =>
      normalize(`${s.brandName} ${s.name}`).includes(q)
    );
  }, [isSearching, trimmed, allScooters]);

  const handleClose = (v: boolean) => {
    if (!v) setQuery("");
    onOpenChange(v);
  };

  const handleSelectGarage = (item: GarageItem) => {
    const model = item.scooter_model;
    if (!model) return;
    const brandName =
      typeof model.brand === "object" && model.brand ? model.brand.name : "Unknown";
    setSelectedScooter({
      id: model.id,
      name: item.nickname || model.name,
      slug: model.slug,
      brandName,
      imageUrl: item.custom_photo_url || model.image_url,
    });
    handleClose(false);
  };

  const handleSelectOption = (option: ScooterOption) => {
    setSelectedScooter({
      id: option.id,
      name: option.name,
      slug: option.slug,
      brandName: option.brandName,
      imageUrl: option.imageUrl,
    });
    handleClose(false);
  };

  const handleAddGarage = () => {
    handleClose(false);
    navigate("/garage");
  };

  const handleClear = () => {
    clearSelection();
    handleClose(false);
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="bottom"
        className="p-0 rounded-t-2xl border-t-0 max-h-[85vh] overflow-y-auto"
        style={{ backgroundColor: THEME.bgWhite }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div
            aria-hidden
            style={{
              width: 36,
              height: 4,
              borderRadius: 999,
              backgroundColor: "rgba(0,0,0,0.15)",
            }}
          />
        </div>

        {/* Header */}
        <div className="px-5 pt-2 pb-3">
          <h2
            style={{
              fontFamily: "'Anton', Impact, sans-serif",
              fontWeight: 400,
              fontSize: 16,
              textTransform: "uppercase",
              letterSpacing: "-0.01em",
              color: THEME.carbon,
              lineHeight: 1,
            }}
          >
            Ma trottinette
          </h2>
          <p
            className="mt-1.5"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 12,
              color: THEME.textSecondary,
              lineHeight: 1.3,
            }}
          >
            Sélectionne pour filtrer les pièces compatibles
          </p>
        </div>

        {/* Search */}
        <div className="px-5 pb-3">
          <div
            className="flex items-center gap-2"
            style={{
              padding: "0 12px",
              minHeight: 44,
              borderRadius: 10,
              border: `1px solid ${THEME.borderLight}`,
              backgroundColor: THEME.bgCapsule,
            }}
          >
            <Search size={16} strokeWidth={2.2} style={{ color: THEME.textSecondary, flexShrink: 0 }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un modèle (marque, nom)…"
              className="flex-1 bg-transparent outline-none"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 13,
                color: THEME.carbon,
                minWidth: 0,
              }}
            />
            {isSearching && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Effacer la recherche"
                className="flex items-center justify-center flex-shrink-0"
                style={{ width: 28, height: 28, color: THEME.textSecondary }}
              >
                <X size={15} strokeWidth={2.4} />
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="px-5 pb-3">
          {isSearching ? (
            searchResults.length === 0 ? (
              <div
                className="text-center py-8"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 13,
                  color: THEME.textSecondary,
                }}
              >
                Aucun modèle trouvé pour « {trimmed} ».
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {searchResults.map((option) => {
                  const inGarage = garageById.has(option.id);
                  const badge: BadgeKind = inGarage
                    ? garageById.get(option.id)
                      ? "owned"
                      : "fav"
                    : null;
                  return (
                    <ScooterRow
                      key={option.id}
                      brandName={option.brandName}
                      modelName={option.name}
                      thumb={option.imageUrl ?? null}
                      active={selectedScooter?.id === option.id}
                      accent={getBrandColors(option.brandName).accent}
                      badge={badge}
                      secondary={!inGarage}
                      onClick={() => handleSelectOption(option)}
                    />
                  );
                })}
              </div>
            )
          ) : (
            <>
              {isLoading && (
                <div
                  className="text-center py-8"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 13,
                    color: THEME.textSecondary,
                  }}
                >
                  Chargement…
                </div>
              )}

              {!isLoading && !hasScooters && (
                <div
                  className="text-center py-8"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 13,
                    color: THEME.textSecondary,
                    lineHeight: 1.5,
                  }}
                >
                  Aucune trottinette sauvegardée. Utilise la recherche ci-dessus
                  pour choisir un modèle.
                </div>
              )}

              {!isLoading && ownedItems.length > 0 && (
                <SectionLabel icon={<Home size={12} strokeWidth={2.4} />} label="Mon écurie" />
              )}
              {!isLoading && ownedItems.length > 0 && (
                <div className="flex flex-col gap-2 mb-1">
                  {ownedItems.map((item) => {
                    const model = item.scooter_model!;
                    const brandName =
                      typeof model.brand === "object" && model.brand
                        ? model.brand.name
                        : "Unknown";
                    return (
                      <ScooterRow
                        key={item.id}
                        brandName={brandName}
                        modelName={item.nickname || model.name}
                        thumb={item.custom_photo_url || model.image_url}
                        active={selectedScooter?.id === model.id}
                        accent={getBrandColors(brandName).accent}
                        badge="owned"
                        onClick={() => handleSelectGarage(item)}
                      />
                    );
                  })}
                </div>
              )}

              {!isLoading && favItems.length > 0 && (
                <SectionLabel
                  icon={<Heart size={12} strokeWidth={2.4} />}
                  label="Mes favoris"
                />
              )}
              {!isLoading && favItems.length > 0 && (
                <div className="flex flex-col gap-2">
                  {favItems.map((item) => {
                    const model = item.scooter_model!;
                    const brandName =
                      typeof model.brand === "object" && model.brand
                        ? model.brand.name
                        : "Unknown";
                    return (
                      <ScooterRow
                        key={item.id}
                        brandName={brandName}
                        modelName={item.nickname || model.name}
                        thumb={item.custom_photo_url || model.image_url}
                        active={selectedScooter?.id === model.id}
                        accent={getBrandColors(brandName).accent}
                        badge="fav"
                        onClick={() => handleSelectGarage(item)}
                      />
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Separator */}
        <div
          aria-hidden
          style={{
            height: 1,
            backgroundColor: THEME.borderSubtle,
            margin: "0 20px",
          }}
        />

        {/* Actions */}
        <div className="px-5 py-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleAddGarage}
            className="flex items-center justify-center gap-2 w-full transition-colors duration-150"
            style={{
              minHeight: 48,
              padding: "12px 16px",
              borderRadius: 10,
              border: `1px solid ${THEME.carbon}`,
              backgroundColor: "transparent",
              fontFamily: "'Inter', sans-serif",
              fontSize: 13,
              fontWeight: 600,
              color: THEME.carbon,
            }}
          >
            <Plus size={16} strokeWidth={2.4} />
            <span>Ajouter une trotti à mon garage</span>
          </button>

          {selectedScooter && (
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center justify-center gap-2 w-full transition-colors duration-150"
              style={{
                minHeight: 48,
                padding: "12px 16px",
                borderRadius: 10,
                border: `1px solid ${hexToRgba(THEME.accentRed, 0.25)}`,
                backgroundColor: "transparent",
                fontFamily: "'Inter', sans-serif",
                fontSize: 13,
                fontWeight: 600,
                color: THEME.accentRed,
              }}
            >
              <X size={16} strokeWidth={2.4} />
              <span>Retirer la sélection (voir tout)</span>
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

const SectionLabel = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <div
    className="flex items-center gap-1.5 mt-1 mb-2"
    style={{
      fontFamily: "'Inter', sans-serif",
      fontSize: 10,
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.06em",
      color: THEME.textSecondary,
    }}
  >
    <span style={{ color: THEME.textSecondary, display: "inline-flex" }}>{icon}</span>
    {label}
  </div>
);

interface RowProps {
  brandName: string;
  modelName: string;
  thumb: string | null;
  active: boolean;
  accent: string;
  badge: BadgeKind;
  secondary?: boolean;
  onClick: () => void;
}

const ScooterRow = ({
  brandName,
  modelName,
  thumb,
  active,
  accent,
  badge,
  secondary = false,
  onClick,
}: RowProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 w-full text-left transition-all duration-150"
      style={{
        padding: "10px 12px",
        borderRadius: 12,
        minHeight: 64,
        opacity: secondary && !active ? 0.85 : 1,
        border: active
          ? `1.5px solid ${accent}`
          : `1px solid ${THEME.borderLight}`,
        backgroundColor: active ? hexToRgba(accent, 0.04) : THEME.bgWhite,
      }}
    >
      {thumb ? (
        <img
          src={thumb}
          alt={modelName}
          style={{
            width: 44,
            height: 44,
            borderRadius: 8,
            objectFit: "contain",
            backgroundColor: THEME.bgCapsule,
            padding: 2,
            flexShrink: 0,
          }}
        />
      ) : (
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 8,
            backgroundColor: THEME.bgCapsule,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
          aria-hidden
        >
          <Bike size={20} strokeWidth={2} style={{ color: THEME.textSecondary }} />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 10,
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: THEME.textSecondary,
            lineHeight: 1,
            marginBottom: 4,
          }}
        >
          {brandName}
        </p>
        <p
          className="truncate"
          style={{
            fontFamily: "'Anton', Impact, sans-serif",
            fontSize: 14,
            fontWeight: 400,
            textTransform: "uppercase",
            letterSpacing: "-0.01em",
            color: THEME.carbon,
            lineHeight: 1.1,
          }}
        >
          {modelName}
        </p>
      </div>

      {badge === "owned" && (
        <Home
          size={15}
          strokeWidth={2.2}
          aria-label="Dans mon écurie"
          style={{ color: THEME.textSecondary, flexShrink: 0 }}
        />
      )}
      {badge === "fav" && (
        <Heart
          size={15}
          strokeWidth={2.2}
          aria-label="Dans mes favoris"
          style={{ color: THEME.accentRed, fill: THEME.accentRed, flexShrink: 0 }}
        />
      )}

      {active && (
        <Check size={18} strokeWidth={2.5} style={{ color: accent, flexShrink: 0 }} />
      )}
    </button>
  );
};

export default ScooterSelectorSheet;
