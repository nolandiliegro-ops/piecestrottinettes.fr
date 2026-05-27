import { useNavigate } from "react-router-dom";
import { Bike, Check, Plus, X } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useUserGarage } from "@/hooks/useGarage";
import { useSelectedScooter, getBrandColors } from "@/contexts/ScooterContext";
import { THEME, hexToRgba } from "@/lib/theme";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const ScooterSelectorSheet = ({ open, onOpenChange }: Props) => {
  const navigate = useNavigate();
  const { selectedScooter, setSelectedScooter, clearSelection } = useSelectedScooter();
  const { data: garageScooters, isLoading } = useUserGarage();

  const hasScooters = !!garageScooters && garageScooters.length > 0;

  const handleSelect = (item: NonNullable<typeof garageScooters>[number]) => {
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
    onOpenChange(false);
  };

  const handleAddGarage = () => {
    onOpenChange(false);
    navigate("/garage");
  };

  const handleClear = () => {
    clearSelection();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
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
        <div className="px-5 pt-2 pb-4">
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

        {/* List */}
        <div className="px-5 pb-3">
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
              Aucune trottinette dans ton garage.
            </div>
          )}

          {hasScooters && (
            <div className="flex flex-col gap-2">
              {garageScooters!.map((item) => {
                const model = item.scooter_model;
                if (!model) return null;
                const brandName =
                  typeof model.brand === "object" && model.brand
                    ? model.brand.name
                    : "Unknown";
                const brandColors = getBrandColors(brandName);
                const isActive = selectedScooter?.id === model.id;
                const thumb = item.custom_photo_url || model.image_url;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className="flex items-center gap-3 w-full text-left transition-all duration-150"
                    style={{
                      padding: "10px 12px",
                      borderRadius: 12,
                      minHeight: 64,
                      border: isActive
                        ? `1.5px solid ${brandColors.accent}`
                        : `1px solid ${THEME.borderLight}`,
                      backgroundColor: isActive
                        ? hexToRgba(brandColors.accent, 0.04)
                        : THEME.bgWhite,
                    }}
                  >
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={model.name}
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
                          fontSize: 22,
                        }}
                        aria-hidden
                      >
                        🛴
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
                        {item.nickname || model.name}
                      </p>
                    </div>

                    {isActive && (
                      <Check
                        size={18}
                        strokeWidth={2.5}
                        style={{ color: brandColors.accent, flexShrink: 0 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
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

export default ScooterSelectorSheet;
