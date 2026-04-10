

# Fix & Improve PartDetail Product Page

## Problems Identified
1. **Scroll blocked**: Desktop uses `h-screen` + `overflow-hidden` (lines 107, 120), making content below the bento grid invisible
2. **No related products section** exists
3. **No YouTube video section** outside the small WorkshopSection tile
4. **Mobile** is functional but needs polish

## Changes

### File 1: `src/pages/PartDetail.tsx` — Major rewrite

**1. Fix scroll (CRITICAL)**
- Remove `h-screen` from desktop container (line 107) → use `min-h-screen`
- Remove `overflow-hidden` from bento grid wrapper (line 120)
- Remove `flex-1` height constraint — let content flow naturally
- Set explicit heights on bento grid rows instead of flex-based sizing

**2. Desktop layout restructure**
- Bento grid gets explicit row heights (`grid-rows-[500px_280px]`) instead of flex-fill
- After the bento grid, add new full-width sections that scroll into view:
  - YouTube video section (conditional on `part.youtube_video_id`)
  - Related products section

**3. Add YouTube "VIDÉO D'INSTALLATION" section**
- Rendered between the bento grid and related products
- Only shown if `part.youtube_video_id` exists
- Full-width container with `max-w-4xl`, `rounded-2xl` iframe embed
- Title: uppercase font-black with green accent icon
- Scroll-reveal animation via `whileInView`

**4. Add "VOUS POURRIEZ AUSSI AVOIR BESOIN DE" section**
- New hook `useRelatedParts` that queries `parts` table by `category_id`, excludes current `part.id`, limits to 4
- Full-width section below the bento grid (and video if present)
- 4-column grid on desktop, 2-column on mobile
- Each card: image, name, price, orange "Ajouter au panier" button (44px touch target)
- Cards link to `/piece/{slug}`

**5. Mobile improvements**
- Increase spacing: `space-y-6` instead of `space-y-4`
- Ensure all buttons have `min-h-[44px]`
- Add the YouTube section and related products section to mobile stack too
- Description card already has green accent bar and p-6 — keep as is

### File 2: `src/hooks/usePartDetail.ts` — Add `useRelatedParts` hook

```ts
export const useRelatedParts = (categoryId: string | null, currentPartId: string | null) => {
  return useQuery({
    queryKey: ["related-parts", categoryId, currentPartId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parts")
        .select("id, name, slug, price, image_url, stock_quantity")
        .eq("category_id", categoryId)
        .neq("id", currentPartId)
        .limit(4);
      if (error) throw error;
      return data;
    },
    enabled: !!categoryId && !!currentPartId,
  });
};
```

### File 3: `src/components/pdp/RelatedProducts.tsx` — New component

- Receives `parts` array and loading state
- 4-col grid desktop, 2-col mobile
- Each card: rounded-2xl, white/70 backdrop-blur, image, name, price in mineral color, orange CTA button
- Uses `useCart` for add-to-cart functionality
- Scroll-reveal with staggered children animation

### File 4: `src/components/pdp/VideoInstallation.tsx` — New component

- Receives `youtubeVideoId` and `productName`
- Full-width section with `bg-white/40 backdrop-blur` container
- Title "VIDÉO D'INSTALLATION" with green accent
- `rounded-2xl` YouTube embed, `aspect-video`
- `whileInView` scroll reveal

### Design system compliance
- Background: `bg-greige` (#F5F0E8) throughout
- Green accent: `#4A7C59` / `text-mineral` / `border-l-[#4A7C59]`
- Orange CTA: `bg-[#FF6600] hover:bg-[#E55C00]` on add-to-cart buttons
- Titles: `font-black uppercase tracking-tight`
- Cards: `rounded-2xl shadow-md`

## Files touched
| File | Action |
|------|--------|
| `src/pages/PartDetail.tsx` | Major edit — fix scroll, add sections |
| `src/hooks/usePartDetail.ts` | Add `useRelatedParts` hook |
| `src/components/pdp/RelatedProducts.tsx` | New component |
| `src/components/pdp/VideoInstallation.tsx` | New component |

