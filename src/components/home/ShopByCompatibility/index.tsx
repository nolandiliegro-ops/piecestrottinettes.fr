import { useCallback, useEffect, useState } from "react";
import { useSelectedScooter } from "@/contexts/ScooterContext";
import { useHeaderScooterDropdown } from "@/contexts/HeaderScooterDropdownContext";
import { useShopByCategoryDataV2 } from "@/hooks/useShopByCategoryDataV2";
import { useScooterBrandColor } from "@/hooks/useScooterBrandColor";
import CompatibilityHeader from "./CompatibilityHeader";
import CategoryPills from "./CategoryPills";
import PartsCarousel from "./PartsCarousel";
import BottomBanner from "./BottomBanner";

const ShopByCompatibility = () => {
  const { selectedScooter, clearSelection } = useSelectedScooter();
  const { open: openHeaderDropdown } = useHeaderScooterDropdown();
  const { color: brandColor, isDefault: brandIsDefault } = useScooterBrandColor();
  // Only propagate brand color when a known brand is active; undefined keeps legacy palette.
  const accentColor = brandIsDefault ? undefined : brandColor;

  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    () => new Set()
  );

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
    openHeaderDropdown();
  }, [openHeaderDropdown]);

  const handleActionClick = useCallback(() => {
    if (selectedScooter) {
      clearSelection();
      setSelectedCategories(new Set());
    } else {
      openHeaderDropdown();
    }
  }, [selectedScooter, clearSelection, openHeaderDropdown]);

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

  // Bottom banner href: pass first selected category as fallback (until catalogue supports multi)
  const catalogueHref = (() => {
    const params = new URLSearchParams();
    const firstCat = Array.from(selectedCategories)[0];
    if (firstCat) params.set("category", firstCat);
    if (selectedScooter) params.set("scooter", selectedScooter.id);
    const qs = params.toString();
    return qs ? `/catalogue?${qs}` : "/catalogue";
  })();

  return (
    <section className="relative w-full">
      <div className="max-w-7xl mx-auto px-4 my-12 lg:my-16">
        <div
          className="rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-10"
          style={{
            backgroundColor: "#F5F0E8",
            border: "0.5px solid rgba(0,0,0,0.04)",
          }}
        >
          <CompatibilityHeader
            mode={compatHeaderMode}
            scooterName={selectedScooter?.name ?? null}
            totalCount={data.totalCount}
            categoriesCount={data.availableCategories.length}
            onTitleClick={handleTitleClick}
            onActionClick={handleActionClick}
            subtitle={subtitle}
            accentColor={accentColor}
          />

          <div className="mb-4 lg:mb-5">
            <CategoryPills
              categories={data.availableCategories}
              selectedSlugs={selectedCategories}
              onToggle={handleToggleCategory}
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
    </section>
  );
};

export default ShopByCompatibility;
