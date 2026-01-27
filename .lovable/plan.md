
# Section "SHOP BY CATEGORY" - Organic Luxe Bento Grid

## Resume

Creation d'une nouvelle section "SHOP BY CATEGORY" sur la homepage avec un design "Organic Luxe" en grille Bento asymetrique. Cette section permet une navigation rapide vers les categories de pieces avec un rendu visuel haut de gamme.

---

## Fichiers a Creer / Modifier

| Fichier | Action |
|---------|--------|
| `src/components/home/ShopByCategorySection.tsx` | CREER - Nouveau composant section |
| `src/components/home/CategoryBentoCard.tsx` | CREER - Card individuelle avec glassmorphism |
| `src/hooks/useCategoryPartsCount.ts` | CREER - Hook pour compter les pieces par categorie |
| `src/pages/Index.tsx` | MODIFIER - Ajouter la section apres CompatiblePartsSection |

---

## Architecture de la Section

```text
+----------------------------------------------------------+
|                    SHOP BY CATEGORY                       |
|           Trouvez rapidement ce dont vous avez besoin     |
+----------------------------------------------------------+
|                                                           |
|  +-------------------+  +-----------+  +-----------+     |
|  |                   |  |           |  |           |     |
|  |   PNEUS & FREINS  |  |  MOTEURS  |  | BATTERIES |     |
|  |     127 pieces    |  | 45 pieces |  | 32 pieces |     |
|  |      (GRANDE)     |  |           |  |           |     |
|  +-------------------+  +-----------+  +-----------+     |
|                                                           |
|  +-----------+  +-------------------+  +-----------+     |
|  |           |  |                   |  |           |     |
|  |CONTROLEURS|  |     LUMIERES      |  |ACCESSOIRES|     |
|  | 28 pieces |  |     89 pieces     |  | 56 pieces |     |
|  |           |  |      (GRANDE)     |  |           |     |
|  +-----------+  +-------------------+  +-----------+     |
|                                                           |
+----------------------------------------------------------+
```

---

## 1. Hook useCategoryPartsCount.ts

Hook pour recuperer le nombre de pieces par categorie depuis Supabase :

```typescript
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CategoryWithCount {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  parts_count: number;
}

export const useCategoryPartsCount = () => {
  return useQuery({
    queryKey: ["category-parts-count"],
    queryFn: async (): Promise<CategoryWithCount[]> => {
      // Get parent categories with part counts
      const { data, error } = await supabase
        .from("categories")
        .select(`
          id,
          name,
          slug,
          icon,
          parts:parts(count)
        `)
        .is("parent_id", null)
        .order("display_order");

      if (error) throw error;

      return (data || []).map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        parts_count: cat.parts?.[0]?.count || 0,
      }));
    },
  });
};
```

---

## 2. CategoryBentoCard.tsx

Card individuelle avec effet glassmorphism et interactions premium :

**Props** :
- `category`: Objet categorie avec id, name, slug, icon
- `partsCount`: Nombre de pieces
- `isLarge`: Boolean pour cards plus grandes
- `imageUrl`: URL de l'image de fond (optionnelle)
- `index`: Position pour animation stagger

**Structure JSX** :

```typescript
<motion.div
  initial={{ opacity: 0, y: 30 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-50px" }}
  transition={{ duration: 0.5, delay: index * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
>
  <Link to={`/catalogue?category=${category.slug}`}>
    <motion.div
      whileHover={{ 
        scale: 1.02, 
        y: -8,
        transition: { duration: 0.4, ease: "easeOut" }
      }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative overflow-hidden cursor-pointer",
        "rounded-[24px] border border-white/30",
        "transition-all duration-400 ease-out",
        isLarge ? "col-span-2 aspect-[2/1]" : "aspect-square"
      )}
      style={{
        boxShadow: "0 8px 32px rgba(26, 26, 26, 0.08)",
      }}
    >
      {/* Background Image with zoom on hover */}
      <motion.div 
        className="absolute inset-0"
        whileHover={{ scale: 1.1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {imageUrl ? (
          <img src={imageUrl} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-carbon/80 to-carbon/60" />
        )}
      </motion.div>

      {/* Glassmorphism Overlay */}
      <div 
        className="absolute inset-0 flex flex-col justify-end p-6"
        style={{
          background: "linear-gradient(to top, rgba(245,243,240,0.9) 0%, rgba(245,243,240,0.7) 40%, transparent 100%)",
          backdropFilter: "blur(15px)",
          WebkitBackdropFilter: "blur(15px)",
        }}
      >
        {/* Icon */}
        <div className="mb-3">
          <IconComponent className="w-8 h-8 text-mineral" />
        </div>

        {/* Category Name */}
        <h3 
          className="font-display text-2xl lg:text-3xl text-carbon uppercase"
          style={{ fontWeight: 800, letterSpacing: "-0.02em" }}
        >
          {category.name}
        </h3>

        {/* Parts Count */}
        <p className="text-sm text-muted-foreground font-medium mt-1">
          {partsCount} pieces
        </p>
      </div>

      {/* Hover Glow Border */}
      <div className="absolute inset-0 rounded-[24px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ boxShadow: "inset 0 0 0 2px rgba(147,181,161,0.5), 0 0 30px rgba(147,181,161,0.3)" }}
      />
    </motion.div>
  </Link>
</motion.div>
```

---

## 3. ShopByCategorySection.tsx

Composant section complete avec grille Bento :

**Mapping des Categories** :

| Position | Categorie | Taille | Grid Classes |
|----------|-----------|--------|--------------|
| 1 | Pneus (+ Freins) | Grande | `col-span-2 row-span-1` |
| 2 | Moteurs | Normal | `col-span-1` |
| 3 | Batteries | Normal | `col-span-1` |
| 4 | Controleurs | Normal | `col-span-1` |
| 5 | Lumieres | Grande | `col-span-2 row-span-1` |
| 6 | Accessoires | Normal | `col-span-1` |

**Structure de la Grille** :

```typescript
<section className="py-16 lg:py-24 bg-greige">
  <div className="container mx-auto px-4">
    {/* Header */}
    <motion.div className="text-center mb-12">
      <h2 
        className="font-display text-4xl md:text-5xl lg:text-6xl text-carbon uppercase"
        style={{ fontWeight: 800, letterSpacing: "-0.02em" }}
      >
        SHOP BY CATEGORY
      </h2>
      <p className="text-muted-foreground mt-4 font-light">
        Trouvez rapidement ce dont vous avez besoin
      </p>
    </motion.div>

    {/* Bento Grid - Desktop 4 colonnes, Tablet 2, Mobile 1 */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 max-w-6xl mx-auto">
      {/* Ligne 1 */}
      <CategoryBentoCard category="Pneus & Freins" isLarge index={0} />
      <CategoryBentoCard category="Moteurs" index={1} />
      <CategoryBentoCard category="Batteries" index={2} />
      
      {/* Ligne 2 */}
      <CategoryBentoCard category="Controleurs" index={3} />
      <CategoryBentoCard category="Lumieres" isLarge index={4} />
      <CategoryBentoCard category="Accessoires" index={5} />
    </div>
  </div>
</section>
```

**Grille CSS responsive** :

```text
Desktop (lg:grid-cols-4):
[  Pneus & Freins (span 2)  ] [ Moteurs ] [ Batteries ]
[ Controleurs ] [  Lumieres (span 2)   ] [ Accessoires ]

Tablet (md:grid-cols-2):
[ Pneus & Freins (span 2) ]
[ Moteurs ] [ Batteries ]
[ Controleurs ] [ Lumieres (span 2) ]
[ Accessoires ]

Mobile (grid-cols-1):
Chaque card en pleine largeur
```

---

## 4. Modifications Index.tsx

Ajouter la section apres CompatiblePartsSection (ligne 63) :

```typescript
import ShopByCategorySection from "@/components/home/ShopByCategorySection";

// Dans le JSX, apres </motion.section> de compatible-parts (ligne 63)
{/* 4. Shop By Category Section */}
<motion.section
  initial={{ opacity: 0, y: 50 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-100px" }}
  transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
>
  <ShopByCategorySection />
</motion.section>
```

---

## Resume des Interactions

| Element | Hover | Transition |
|---------|-------|------------|
| Card entiere | `translateY(-8px)` + `scale(1.02)` + glow Mineral | 0.4s ease-out |
| Image de fond | `scale(1.1)` zoom subtil | 0.6s ease-out |
| Border | Glow Mineral Green apparait | 0.3s |
| Grid load | Stagger fade-in 0.1s entre cards | whileInView |

---

## Couleurs et Styles

| Element | Valeur |
|---------|--------|
| Section background | `#F5F3F0` (Greige) |
| Card glassmorphism | `rgba(245,243,240,0.85)` + `blur(15px)` |
| Border | `1px solid rgba(255,255,255,0.3)` |
| Border-radius | `24px` |
| Titre font-weight | `800` |
| Titre letter-spacing | `-0.02em` |
| Texte principal | `#1A1A1A` (Carbon Black) |
| Accent hover | `#93B5A1` (Mineral Green) |
| Shadow | `0 8px 32px rgba(26,26,26,0.08)` |
| Hover shadow | `0 0 30px rgba(147,181,161,0.3)` |

---

## Icons par Categorie

| Categorie | Icon Lucide |
|-----------|-------------|
| Pneus & Freins | `Disc` ou `Octagon` |
| Moteurs | `Cog` |
| Batteries | `Battery` |
| Controleurs | `Cpu` |
| Lumieres | `Lightbulb` |
| Accessoires | `Backpack` |

---

## Resultat Attendu

1. **Grille organique** : Layout asymetrique avec 2 grandes cards et 4 normales
2. **Effet glassmorphism** : Overlay subtil avec blur pour lisibilite
3. **Animations fluides** : Stagger fade-in au scroll + lift effect au hover
4. **Navigation directe** : Click redirige vers `/catalogue?category=slug`
5. **Responsive** : 4 cols desktop, 2 cols tablet, 1 col mobile
