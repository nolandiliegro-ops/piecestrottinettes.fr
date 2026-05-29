import { useCallback, useEffect, useState } from "react";
import { useSelectedScooter } from "@/contexts/ScooterContext";
import { useShopByCategoryDataV2 } from "@/hooks/useShopByCategoryDataV2";
import { useScooterBrandColor } from "@/hooks/useScooterBrandColor";
import { useHomeBridge } from "@/hooks/useHomeBridge";
import CompatibilityHeader from "./CompatibilityHeader";
import ModeToggle from "./ModeToggle";
import CategoryPills from "./CategoryPills";
import PartsCarousel from "./PartsCarousel";
import BottomBanner from "./BottomBanner";
import ScooterSelectorSheet from "@/components/scooter/ScooterSelectorSheet";
import { THEME, hexToRgba } from "@/lib/theme";

const NEUTRAL_TITLE_ACCENT = "#4A7C59";

const ShopByCompatibility = () => {
  const { selectedScooter, clearSelection } = useSelectedScooter();
  const { color: brandColor, isDefault: brandIsDefault } = useScooterBrandColor();
  const { data: bridgeSettings } = useHomeBridge();
  const darkBlockColor = bridgeSettings?.dark_block_color ?? "#3A3A3A";
  // Only propagate brand color when a known brand is active; undefined keeps legacy palette.
  const accentColor = brandIsDefault ? undefined : brandColor;

  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    () => new Set()
  );
  const [sheetOpen, setSheetOpen] = useState(false);

  const data = useShopByCategoryDataV2(selectedScooter?.id, selectedCategories);

  // Auto-cleanup: if a previously-selected category drops to count=0
  // (e.g. user activated a scooter that has no parts in it), remove it
  // from the Set. Compare by size + content to avoid render loops.
  useEffect(() => {
    const validSlugs = new Set(data.availableCategories.map((c) => c.slug));
    let needsCleanup = false;
    for (const s of selectedCategories) {
      if (!validSlugs.has(s)) {
        needsCleanup = true;
        break;
      }
    }
    if (!needsCleanup) return;
    setSelectedCategories((prev) => {
      const next = new Set<string>();
      for (const s of prev) if (validSlugs.has(s)) next.add(s);
      return next;
    });
  }, [data.availableCategories, selectedCategories]);

  const handleToggleCategory = useCallback((slug: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }, []);

  const handleResetFilters = useCallback(() => {
    setSelectedCategories(new Set());
    if (selectedScooter) clearSelection();
  }, [selectedScooter, clearSelection]);

  const handleTitleClick = useCallback(() => {
    setSheetOpen(true);
  }, []);

  const handleActionClick = useCallback(() => {
    if (selectedScooter) {
      clearSelection();
      setSelectedCategories(new Set());
    } else {
      setSheetOpen(true);
    }
  }, [selectedScooter, clearSelection]);

  // Subtitle derivation (D8: pre-compute and pass to CompatibilityHeader)
  const subtitle = (() => {
    const n = selectedCategories.size;
    const catLabel = `${n} catégorie${n > 1 ? "s" : ""} active${n > 1 ? "s" : ""}`;
    if (data.mode === "all") {
      return `${data.totalCount} produit${data.totalCount > 1 ? "s" : ""} · Toutes catégories`;
    }
    if (data.mode === "filtered-cats") {
      return `${data.totalCount} produit${data.totalCount > 1 ? "s" : ""} · ${catLabel}`;
    }
    if (data.mode === "trotti") {
      return `${data.totalCount} pièce${data.totalCount > 1 ? "s" : ""} compatible${data.totalCount > 1 ? "s" : ""}`;
    }
    return `${data.totalCount} pièce${data.totalCount > 1 ? "s" : ""} · ${catLabel}`;
  })();

  const compatHeaderMode = selectedScooter ? "config" : "discovery";

  // D2: title parts. In trotti modes, when a model name is available,
  // switch to the model-focal layout (line 1 small "Pour ta Brand",
  // line 2 large "Model." in brand color).
  const brandName = selectedScooter?.brandName ?? "";
  const modelName = selectedScooter?.name ?? ""; // SelectedScooter.name holds nickname || scooterModel.name
  const hasModel = modelName.trim().length > 0 && modelName !== brandName;
  const isTrottiMode = data.mode === "trotti" || data.mode === "trotti-cats";
  const modelFocalMode = isTrottiMode && hasModel;

  const { titleFirstPart, titleSecondPart } = (() => {
    if (data.mode === "all") return { titleFirstPart: "Tous les", titleSecondPart: "produits." };
    if (data.mode === "filtered-cats")
      return { titleFirstPart: "Sélection", titleSecondPart: "sur mesure." };
    // trotti / trotti-cats
    if (modelFocalMode) {
      return { titleFirstPart: `Pour ta ${brandName}`, titleSecondPart: `${modelName}.` };
    }
    // Fallback when model name is missing/equals brand
    return { titleFirstPart: "Pour ta", titleSecondPart: `${brandName}.` };
  })();
  const titleAccentColor = brandIsDefault ? NEUTRAL_TITLE_ACCENT : brandColor;

  // Bottom banner href: pass first selected category as fallback (until catalogue supports multi)
  const catalogueHref = (() => {
    const params = new URLSearchParams();
    const firstCat = Array.from(selectedCategories)[0];
    if (firstCat) params.set("category", firstCat);
    if (selectedScooter) params.set("scooter", selectedScooter.id);
    const qs = params.toString();
    return qs ? `/catalogue?${qs}` : "/catalogue";
  })();

  // Dark capsule — théméable via token CSS var(--token-module-background).
  const backgroundStyle: React.CSSProperties = { backgroundColor: "var(--token-module-background, #2A2A2A)" };

  // D4: Dynamic filigrane behind everything.
  // In trotti mode, prefer the model name (e.g. "WOLF WARRIOR") over the brand.
  const filigraneText = brandIsDefault
    ? "PIECESTROTTINETTES"
    : (hasModel ? modelName : brandName).toUpperCase();
  const filigraneColor = brandIsDefault
    ? "rgba(255,255,255,0.10)"
    : hexToRgba(brandColor, 0.13);
  const filigraneFontSize = brandIsDefault
    ? "clamp(60px, 8vw, 80px)"
    : "clamp(100px, 14vw, 150px)";

  // Border capsule : blanc subtil par defaut, couleur de marque sinon.
  const capsuleBorderColor = brandIsDefault
    ? "rgba(255,255,255,0.08)"
    : hexToRgba(brandColor, 0.40);

  return (
    <section className="relative w-full" style={{ backgroundColor: darkBlockColor }}>
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 lg:py-12">
        <div
          className="relative overflow-hidden rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-10 transition-[background] duration-[400ms] ease-out"
          style={{
            ...backgroundStyle,
            border: `0.5px solid ${capsuleBorderColor}`,
          }}
        >
          {/* D3: Filigrane — absolute, behind content, clipped by overflow-hidden */}
          {filigraneText && (
            <div
              aria-hidden
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%) rotate(-3deg)",
                fontFamily: "'Anton', Impact, sans-serif",
                fontWeight: 400,
                textTransform: "uppercase",
                letterSpacing: "-0.04em",
                lineHeight: 0.85,
                whiteSpace: "nowrap",
                pointerEvents: "none",
                userSelect: "none",
                zIndex: 0,
                color: filigraneColor,
                fontSize: filigraneFontSize,
                transition: "color 400ms ease-out, font-size 400ms ease-out",
              }}
            >
              {filigraneText}
            </div>
          )}

          {/* Content wrapper above filigrane */}
          <div className="relative" style={{ zIndex: 1 }}>
            <CompatibilityHeader
              mode={compatHeaderMode}
              scooterName={selectedScooter?.name ?? null}
              scooterImageUrl={selectedScooter?.imageUrl ?? null}
              scooterSlug={selectedScooter?.slug ?? null}
              totalCount={data.totalCount}
              categoriesCount={data.availableCategories.length}
              onTitleClick={handleTitleClick}
              onActionClick={handleActionClick}
              subtitle={subtitle}
              accentColor={accentColor}
              titleFirstPart={titleFirstPart}
              titleSecondPart={titleSecondPart}
              titleAccentColor={titleAccentColor}
              modelFocalMode={modelFocalMode}
            />

            <ModeToggle
              mode={compatHeaderMode}
              accentColor={accentColor}
              hasScooter={!!selectedScooter}
              onSelectMyTrotti={() => setSheetOpen(true)}
              onShowAll={handleResetFilters}
            />

            <div className="mb-4 lg:mb-5">
              <CategoryPills
                categories={data.availableCategories}
                selectedSlugs={selectedCategories}
                onToggle={handleToggleCategory}
                accentColor={accentColor}
                hasScooter={!!selectedScooter}
                onSelectMyTrotti={() => setSheetOpen(true)}
              />
            </div>

            {data.isLoading ? (
              <div
                className="flex gap-3.5 overflow-hidden"
                style={{ height: 280 }}
                aria-hidden
              >
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 w-[200px] sm:w-[220px] rounded-2xl bg-white/60 animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <PartsCarousel
                parts={data.filteredParts}
                onReset={handleResetFilters}
                accentColor={accentColor}
              />
            )}

            <BottomBanner
              mode={compatHeaderMode}
              scooterName={selectedScooter?.name ?? null}
              brandName={selectedScooter?.brandName ?? null}
              totalCount={data.totalCount}
              catalogueHref={catalogueHref}
            />
          </div>
        </div>
      </div>

      {/* Mobile scooter selector Sheet (D4.3) */}
      <ScooterSelectorSheet open={sheetOpen} onOpenChange={setSheetOpen} />

      {/* Fade transition vers le fond beige #FAFAF8 de la page */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "80px",
          background: "linear-gradient(180deg, transparent 0%, #FAFAF8 100%)",
          pointerEvents: "none",
          zIndex: 10,
        }}
      />
    </section>
  );
};

export default ShopByCompatibility;
