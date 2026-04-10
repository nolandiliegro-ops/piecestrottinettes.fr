

# Complete Redesign — PartDetail Product Page

## Critical Bugs to Fix

### 1. Bento Grid Overlap (PRÉSENTATION vs PurchaseBlock)
The current grid uses `grid-cols-4 grid-rows-[500px_280px]` — all 4 columns are equal width (25% each). The MediaGallery takes `col-span-2` (50%), but PurchaseBlock and PRÉSENTATION each get only 25%, which is too narrow for the PurchaseBlock content, causing visual overlap. Fix: switch Row 1 to a proper 3-column layout with explicit fractional widths: `grid-template-columns: 2fr 1fr 1fr`.

### 2. Related Products Title Overlap
The sections below the bento grid (`space-y-12`) sit in a sibling div without enough top margin. The title "VOUS POURRIEZ AUSSI AVOIR BESOIN DE" can visually collide with the last bento row. Fix: add `mt-12` to the below-bento container and use `max-w-7xl mx-auto` consistently.

### 3. Related Products Prices
Already correct in `RelatedProducts.tsx` (line 109: `formatPrice(part.price * 1.2)`). The `useRelatedParts` hook fetches `price` (HT from DB). The display uses `* 1.2` for TTC. If prices look wrong, it's because the DB stores HT values. This is actually correct — no code change needed here.

### 4. Related Products Scooter Compatibility Filter
Currently `useRelatedParts` only filters by `category_id`. Need to add an optional `scooterModelId` parameter — when a scooter is selected in `ScooterContext`, filter related parts through the `part_compatibility` join table.

---

## Files to Modify

### File 1: `src/pages/PartDetail.tsx` — Full layout rewrite

**Desktop layout:**
- Row 1: CSS Grid with `grid-template-columns: 2fr 1fr 1fr` and fixed height `500px`
  - Col 1: MediaGallery (50% width)
  - Col 2: PurchaseBlock (25%)
  - Col 3: PRÉSENTATION card with green accent bar, scrollable overflow (25%) — or empty placeholder if no description
- Row 2: 4 equal columns, auto height (~280px)
  - InstallationGuide | EngineeringLab | CompatibilityMatrix | WorkshopSection
- Below grid (full-width, natural scroll):
  - VideoInstallation (conditional on `youtube_video_id`)
  - RelatedProducts

**Mobile layout:**
- Keep vertical stack with `space-y-6`
- Order: Back link → MediaGallery → PurchaseBlock → PRÉSENTATION → YouTube Video → InstallationGuide → EngineeringLab → CompatibilityMatrix → WorkshopSection → RelatedProducts
- Remove `min-h-[300px]` wrapper around WorkshopSection

**Import `useSelectedScooter`** from ScooterContext to pass selected scooter ID to `useRelatedParts`.

### File 2: `src/hooks/usePartDetail.ts` — Update `useRelatedParts`

Add optional `scooterModelId` parameter. When provided, use a two-step query:
1. Get part IDs compatible with the selected scooter from `part_compatibility`
2. Filter the category query to only include those part IDs

```ts
export const useRelatedParts = (
  categoryId: string | null,
  currentPartId: string | null,
  scooterModelId?: string | null
) => {
  return useQuery({
    queryKey: ["related-parts", categoryId, currentPartId, scooterModelId],
    queryFn: async () => {
      if (scooterModelId) {
        // Get compatible part IDs first
        const { data: compatibleIds } = await supabase
          .from("part_compatibility")
          .select("part_id")
          .eq("scooter_model_id", scooterModelId);
        
        const ids = (compatibleIds || []).map(c => c.part_id);
        if (ids.length === 0) return [];
        
        const { data, error } = await supabase
          .from("parts")
          .select("id, name, slug, price, image_url, stock_quantity")
          .eq("category_id", categoryId!)
          .neq("id", currentPartId!)
          .in("id", ids)
          .limit(4);
        if (error) throw error;
        return data ?? [];
      }
      
      // Fallback: no scooter filter
      const { data, error } = await supabase
        .from("parts")
        .select("id, name, slug, price, image_url, stock_quantity")
        .eq("category_id", categoryId!)
        .neq("id", currentPartId!)
        .limit(4);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!categoryId && !!currentPartId,
  });
};
```

### File 3: `src/components/pdp/RelatedProducts.tsx` — Minor polish

- Already correct on price display (`part.price * 1.2`)
- Already has orange CTA, cart icon, staggered animations
- No major changes needed — just ensure `max-w-7xl mx-auto` wrapper is present

### File 4: `src/components/pdp/VideoInstallation.tsx` — No changes needed

Already implements the YouTube embed with proper styling.

---

## Design System Compliance

All elements will use:
- `bg-[hsl(var(--greige))]` background (#F5F0E8)
- `border-l-4 border-l-[#4A7C59]` green accent on PRÉSENTATION
- `bg-[#FF6600] hover:bg-[#E55C00]` orange CTA on related product cards
- `font-black uppercase tracking-tight` for section titles
- `rounded-2xl shadow-md bg-white/70 backdrop-blur-sm` for cards
- `min-h-[44px]` on all interactive elements
- `whileInView` framer-motion scroll reveals

## Summary of Changes
| File | Change |
|------|--------|
| `src/pages/PartDetail.tsx` | Fix grid to `2fr 1fr 1fr`, fix section spacing, pass scooter filter |
| `src/hooks/usePartDetail.ts` | Add scooter compatibility filter to `useRelatedParts` |
| `src/components/pdp/RelatedProducts.tsx` | Minor cleanup only |

