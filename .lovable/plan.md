

# PartDetail Page — Clean Stacked Layout Redesign

## Layout Structure

```text
┌──────────────────────────────────────────┐
│ ← Retour au catalogue                   │
├───────────────────────┬──────────────────┤
│                       │  Category Badge  │
│   MediaGallery        │  Product Name    │
│   (60% - col-span-3)  │  Price TTC 4xl   │
│   shadow-lg rounded   │  Stock status    │
│                       │  AJOUTER button  │
│                       │  J'AI INSTALLÉ   │
├───────────────────────┴──────────────────┤
│  Install  │  Lab  │  Compat  │  Workshop │
│  min-h-200px each, green icons, equal h  │
├──────────────────────────────────────────┤
│  PRÉSENTATION — full width white card    │
│  green left bar + green underline title  │
│  text #374151, leading-[1.8]             │
├──────────────────────────────────────────┤
│  VIDÉO D'INSTALLATION (conditional)      │
├──────────────────────────────────────────┤
│  VOUS POURRIEZ AUSSI AVOIR BESOIN DE     │
│  4-col grid, hover scale-105, green price│
└──────────────────────────────────────────┘
```

Mobile: same order, all stacked single-column with `space-y-6`.

## Files to Modify

### 1. `src/pages/PartDetail.tsx` — Full rewrite

Replace the bento grid with a clean vertical stack:

- **Hero row**: `grid-cols-5` → MediaGallery `col-span-3` (60%) wrapped in `rounded-2xl shadow-lg` container, PurchaseBlock `col-span-2` (40%)
- **No fixed heights** — natural content flow, no `h-[500px]`, no `overflow-hidden`
- **4 tech cards**: `grid-cols-2 lg:grid-cols-4` with `min-h-[200px]` wrappers
- **PRÉSENTATION**: Full-width section below tech cards with `border-l-4 border-l-[#4A7C59]`, title followed by `border-b-2 border-[#4A7C59] w-12 mb-6` green underline, text in `text-[#374151] leading-[1.8]`
- **YouTube + Related Products**: Full-width sections below
- **Section animations**: Each section uses `whileInView` with staggered `custom` index (0.1s delay per section)
- All sections wrapped in `max-w-7xl mx-auto px-4 md:px-8` with `py-8` between them

### 2. `src/components/pdp/RelatedProducts.tsx` — Card polish

- Add `hover:scale-105 transition-transform duration-300` on each card Link
- Product name: change `font-bold` → `font-semibold`
- Price: change color from `text-[hsl(var(--mineral))]` → `text-[#4A7C59]`
- Orange button: keep existing `bg-[#FF6600]`, already full width — add text "Ajouter" always visible (remove `hidden sm:inline`)

### 3. `src/components/pdp/PurchaseBlock.tsx` — Premium polish

- Price display: change from `text-3xl md:text-4xl font-light` → `text-4xl font-black text-[#1A1A1A]`
- Show TTC price: `formatPrice(price * 1.2)` instead of `formatPrice(price)`
- Category badge: ensure green styling `bg-[#4A7C59]/10 text-[#4A7C59]`
- Padding already `p-6 md:p-8` — confirmed OK

### 4. `src/components/pdp/MediaGallery.tsx` — Shadow + cover

- Add `shadow-lg` to the outer container
- Change image from `object-contain` → `object-contain` (keep contain for product photos — cover would crop them badly)
- The parent in PartDetail wraps it with `shadow-lg rounded-2xl` for the drop shadow effect

## Design System Compliance

- Background: `#F5F0E8` on page container
- Green accent: `#4A7C59` on badges, borders, price text, title underlines
- Orange CTA: `#FF6600` / hover `#E55C00` on add-to-cart buttons
- Text: `#1A1A1A` for titles, `#374151` for body
- Titles: `font-black uppercase tracking-tight`
- Cards: `rounded-2xl shadow-md bg-white/70 backdrop-blur-sm`
- Touch targets: `min-h-[44px]` on all buttons
- Animations: `whileInView` with 0.1s stagger delay between sections

