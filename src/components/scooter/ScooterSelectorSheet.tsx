import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Bike, Check, Flame, Heart, Home, LogIn, Search, X } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useUserGarage, useAddToGarage, useToggleOwned, type GarageItem } from "@/hooks/useGarage";
import { useHeroScooters } from "@/hooks/useHeroScooters";
import { useAuth } from "@/hooks/useAuth";
import {
  useSelectedScooter,
  getBrandColors,
  type ScooterOption,
} from "@/contexts/ScooterContext";
import { THEME, hexToRgba } from "@/lib/theme";
import { searchScooters } from "@/lib/scooterSearch";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /**
   * Optionnel : appelé après confirmation d'une sélection (sheet fermé).
   * Sert au module home pour scroller vers la grille produits.
   * Non fourni par le Header global → aucun impact dessus.
   */
  onConfirmed?: () => void;
}

const DIACRITICS_RE = new RegExp("[\\u0300-\\u036f]", "g");

const normalize = (s: string): string =>
  s.toLowerCase().normalize("NFD").replace(DIACRITICS_RE, "");

type BadgeKind = "owned" | "fav" | null;

/** Desktop = modal centré (≥1024px) ; mobile = bottom-sheet. */
const useIsDesktop = (): boolean => {
  const [isDesktop, setIsDesktop] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.matchMedia("(min-width: 1024px)").matches : false
  );
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const onChange = () => setIsDesktop(mql.matches);
    mql.addEventListener("change", onChange);
    setIsDesktop(mql.matches);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return isDesktop;
};

/** État garage par model id : owned/fav + l'id de la ligne garage (pour toggle). */
interface GarageState {
  isOwned: boolean;
  garageItemId: string;
}

const ScooterSelectorSheet = ({ open, onOpenChange, onConfirmed }: Props) => {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const { user } = useAuth();
  const { selectedScooter, setSelectedScooter, clearSelection, allScooters } =
    useSelectedScooter();
  const { data: garageScooters, isLoading } = useUserGarage();
  const addToGarage = useAddToGarage();
  const toggleOwned = useToggleOwned();

  // --- État (vit dans le PARENT, partagé entre Dialog et Sheet) ---
  const [query, setQuery] = useState("");
  // id de la carte dont le popover "connecte-toi" est ouvert (null = aucun).
  const [authPromptFor, setAuthPromptFor] = useState<string | null>(null);

  const hasScooters = !!garageScooters && garageScooters.length > 0;
  const ownedItems = useMemo(
    () => (garageScooters ?? []).filter((i) => i.is_owned && i.scooter_model),
    [garageScooters]
  );
  const favItems = useMemo(
    () => (garageScooters ?? []).filter((i) => !i.is_owned && i.scooter_model),
    [garageScooters]
  );

  // "Les plus populaires" : reutilise la query curatee (is_top_moment), zero requete neuve.
  const { scooters: popularScooters } = useHeroScooters("");

  // model id -> { isOwned, garageItemId } : badge + toggle des résultats déjà sauvegardés
  const garageById = useMemo(() => {
    const m = new Map<string, GarageState>();
    for (const item of garageScooters ?? []) {
      const id = item.scooter_model?.id;
      if (id) m.set(id, { isOwned: item.is_owned, garageItemId: item.id });
    }
    return m;
  }, [garageScooters]);

  // Cartes populaires (hors modeles deja dans le garage), max 8.
  const popularItems = useMemo<ScooterOption[]>(
    () =>
      popularScooters
        .filter((s) => !garageById.has(s.id))
        .slice(0, 8)
        .map((s) => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
          brandName: s.brand_name ?? "Unknown",
          imageUrl: s.image_url,
        })),
    [popularScooters, garageById]
  );

  // "Toutes les trottinettes" : liste complète du contexte, hors modèles déjà
  // affichés au-dessus (garage toujours ; populaires seulement s'ils sont rendus).
  const allItems = useMemo<ScooterOption[]>(() => {
    const shown = new Set<string>(garageById.keys());
    if (!hasScooters) for (const p of popularItems) shown.add(p.id);
    return allScooters.filter((s) => !shown.has(s.id));
  }, [allScooters, garageById, popularItems, hasScooters]);

  const trimmed = query.trim();
  const isSearching = trimmed.length > 0;
  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    return searchScooters(allScooters, trimmed, (s) => ({ name: s.name, brand: s.brandName, slug: s.slug }));
  }, [isSearching, trimmed, allScooters]);

  const handleClose = (v: boolean) => {
    if (!v) {
      setQuery("");
      setAuthPromptFor(null);
    }
    onOpenChange(v);
  };

  // --- Sélection (filtrer) : SANS auth, ne ferme pas (confirmation via le CTA bénéfice) ---
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
  };

  const handleSelectOption = (option: ScooterOption) => {
    setSelectedScooter({
      id: option.id,
      name: option.name,
      slug: option.slug,
      brandName: option.brandName,
      imageUrl: option.imageUrl,
    });
  };

  // --- Ajout inline garage / favori : auth requise, reste ouvert, devient sélectionné ---
  const handleAddInline = async (option: ScooterOption, isOwned: boolean) => {
    if (!user) {
      setAuthPromptFor(option.id);
      return;
    }
    const existing = garageById.get(option.id);
    try {
      if (existing) {
        // Déjà dans le garage : on bascule écurie <-> favori si besoin
        if (existing.isOwned !== isOwned) {
          await toggleOwned.mutateAsync({
            garageItemId: existing.garageItemId,
            newIsOwned: isOwned,
          });
        }
      } else {
        await addToGarage.mutateAsync({
          scooterSlug: option.slug,
          isOwned,
          scooterName: option.name,
        });
      }
      // La trottinette devient la sélection active ; le sheet reste ouvert.
      handleSelectOption(option);
    } catch {
      // Les hooks affichent déjà un toast d'erreur.
    }
  };

  const handleConfirm = () => {
    if (selectedScooter) {
      handleClose(false);
      onConfirmed?.();
    }
  };

  const handleClear = () => {
    clearSelection();
    handleClose(false);
  };

  // "Voir la fiche →" : seule action carte qui quitte la home (vers la fiche /scooter).
  const handleShowroom = (slug: string) => {
    handleClose(false);
    navigate(`/scooter/${slug}`);
  };

  const isMutating = addToGarage.isPending || toggleOwned.isPending;
  const [selecteur] = useState(readSelecteurVariant);
  const [typing, setTyping] = useState(false);
  // Clavier ouvert (iOS / Android) : la feuille épouse la zone visible, pour que le champ et les résultats ne passent pas sous le clavier.
  const [vv, setVv] = useState<{ h: number; top: number } | null>(null);
  useEffect(() => {
    const v = typeof window !== "undefined" ? window.visualViewport : null;
    if (!v) return;
    const upd = () => setVv({ h: v.height, top: v.offsetTop });
    upd();
    v.addEventListener("resize", upd);
    v.addEventListener("scroll", upd);
    return () => { v.removeEventListener("resize", upd); v.removeEventListener("scroll", upd); };
  }, []);

  const BodyComponent = (selecteur ? SelectorBodyAtelier : SelectorBody) as typeof SelectorBodyAtelier;
  const body = (
    <BodyComponent
      onFocusChange={setTyping}
      query={query}
      onQueryChange={setQuery}
      isSearching={isSearching}
      trimmed={trimmed}
      searchResults={searchResults}
      garageById={garageById}
      ownedItems={ownedItems}
      favItems={favItems}
      popularItems={popularItems}
      allItems={allItems}
      hasScooters={hasScooters}
      isLoading={isLoading}
      isLoggedIn={!!user}
      authPromptFor={authPromptFor}
      onDismissAuthPrompt={() => setAuthPromptFor(null)}
      onGoLogin={() => {
        handleClose(false);
        navigate("/login");
      }}
      selectedId={selectedScooter?.id ?? null}
      hasSelection={!!selectedScooter}
      isMutating={isMutating}
      onSelectOption={handleSelectOption}
      onSelectGarage={handleSelectGarage}
      onAddInline={handleAddInline}
      onShowroom={handleShowroom}
      onConfirm={handleConfirm}
      onClear={handleClear}
    />
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent
          className={selecteur ? "p-0 gap-0 overflow-hidden border-0 rounded-none flex flex-col h-[80vh] max-h-[720px]" : "p-0 gap-0 overflow-hidden border-0 rounded-2xl"}
          style={selecteur ? { width: 520, maxWidth: "calc(100vw - 32px)", backgroundColor: "#FAFAF8", clipPath: "polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 0 100%)" } : { width: 460, maxWidth: "calc(100vw - 32px)", backgroundColor: THEME.bgWhite }}
        >
          {body}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="bottom"
        className={selecteur ? "p-0 rounded-none border-t-0 overflow-hidden flex flex-col" : "p-0 rounded-t-2xl border-t-0 max-h-[92vh] overflow-hidden"}
        style={
          selecteur
            ? typing && vv
              ? { backgroundColor: "#FAFAF8", top: vv.top, bottom: "auto", height: vv.h, maxHeight: vv.h }
              : { backgroundColor: "#FAFAF8", height: "88dvh", maxHeight: "88dvh", clipPath: "polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 0 100%)" }
            : { backgroundColor: THEME.bgWhite }
        }
      >
        {/* Handle (mobile uniquement) */}
        <div className="flex justify-center pt-3 pb-1">
          <div
            aria-hidden
            style={{ width: 36, height: 4, borderRadius: 999, backgroundColor: "rgba(0,0,0,0.15)" }}
          />
        </div>
        {body}
      </SheetContent>
    </Sheet>
  );
};

/* ── Corps partagé (présentationnel, état dans le parent) ──────────────────── */

interface SelectorBodyProps {
  query: string;
  onQueryChange: (v: string) => void;
  isSearching: boolean;
  trimmed: string;
  searchResults: ScooterOption[];
  garageById: Map<string, GarageState>;
  ownedItems: GarageItem[];
  favItems: GarageItem[];
  popularItems: ScooterOption[];
  allItems: ScooterOption[];
  hasScooters: boolean;
  isLoading: boolean;
  isLoggedIn: boolean;
  authPromptFor: string | null;
  onDismissAuthPrompt: () => void;
  onGoLogin: () => void;
  selectedId: string | null;
  hasSelection: boolean;
  isMutating: boolean;
  onSelectOption: (o: ScooterOption) => void;
  onSelectGarage: (i: GarageItem) => void;
  onAddInline: (o: ScooterOption, isOwned: boolean) => void;
  onShowroom: (slug: string) => void;
  onConfirm: () => void;
  onClear: () => void;
}

const optionFromGarage = (item: GarageItem): ScooterOption => {
  const model = item.scooter_model!;
  const brandName =
    typeof model.brand === "object" && model.brand ? model.brand.name : "Unknown";
  return {
    id: model.id,
    name: item.nickname || model.name,
    slug: model.slug,
    brandName,
    imageUrl: item.custom_photo_url || model.image_url,
  };
};

const SelectorBody = ({
  query,
  onQueryChange,
  isSearching,
  trimmed,
  searchResults,
  garageById,
  ownedItems,
  favItems,
  popularItems,
  allItems,
  hasScooters,
  isLoading,
  isLoggedIn,
  authPromptFor,
  onDismissAuthPrompt,
  onGoLogin,
  selectedId,
  hasSelection,
  isMutating,
  onSelectOption,
  onSelectGarage,
  onAddInline,
  onShowroom,
  onConfirm,
  onClear,
}: SelectorBodyProps) => {
  // Copy des 3 états : recherche / garage / accueil
  const subtitle = isSearching
    ? "Sélectionne un modèle, ajoute-le à ton garage ou à tes favoris"
    : hasScooters
      ? "Choisis dans ton garage ou cherche un autre modèle"
      : "Choisis un modèle populaire ou cherche le tien";

  // Fade haut/bas : indique qu'il reste du contenu à scroller dans la zone centrale.
  const scrollRef = useRef<HTMLDivElement>(null);
  const [fade, setFade] = useState({ top: false, bottom: false });
  const updateFade = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setFade({
      top: el.scrollTop > 4,
      bottom: el.scrollTop + el.clientHeight < el.scrollHeight - 4,
    });
  }, []);
  useEffect(() => {
    updateFade();
  }, [
    updateFade,
    isSearching,
    isLoading,
    searchResults.length,
    ownedItems.length,
    favItems.length,
    popularItems.length,
    allItems.length,
  ]);

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="px-5 pt-3 pb-3">
        <h2
          style={{
            fontFamily: "'Anton', Impact, sans-serif",
            fontWeight: 400,
            fontSize: 17,
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
          {subtitle}
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
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Rechercher un modèle (marque, nom)…"
            className="flex-1 bg-transparent outline-none"
            style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: THEME.carbon, minWidth: 0 }}
          />
          {isSearching && (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              aria-label="Effacer la recherche"
              className="flex items-center justify-center flex-shrink-0"
              style={{ width: 28, height: 28, color: THEME.textSecondary }}
            >
              <X size={15} strokeWidth={2.4} />
            </button>
          )}
        </div>
      </div>

      {/* Body — zone centrale scrollable (hauteur bornée, scroll vertical premium) */}
      <div className="relative">
        <style>{`
          .pt-selector-scroll { scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.18) transparent; scroll-behavior: smooth; }
          .pt-selector-scroll::-webkit-scrollbar { width: 6px; }
          .pt-selector-scroll::-webkit-scrollbar-track { background: transparent; }
          .pt-selector-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.18); border-radius: 999px; }
          .pt-selector-scroll::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.30); }
        `}</style>
        <div
          ref={scrollRef}
          onScroll={updateFade}
          className="pt-selector-scroll overflow-y-auto max-h-[60vh] lg:max-h-[420px] px-5 pb-3"
        >
        {isSearching ? (
          searchResults.length === 0 ? (
            <EmptyHint>Aucun modèle trouvé pour « {trimmed} ».</EmptyHint>
          ) : (
            <CardGrid>
              {searchResults.map((option) => {
                const g = garageById.get(option.id);
                const badge: BadgeKind = g ? (g.isOwned ? "owned" : "fav") : null;
                return (
                  <ScooterCard
                    key={option.id}
                    option={option}
                    active={selectedId === option.id}
                    badge={badge}
                    isMutating={isMutating}
                    onSelect={() => onSelectOption(option)}
                    onAddGarage={() => onAddInline(option, true)}
                    onAddFav={() => onAddInline(option, false)}
                    onShowroom={() => onShowroom(option.slug)}
                    showAuthPrompt={!isLoggedIn && authPromptFor === option.id}
                    onGoLogin={onGoLogin}
                    onDismissAuthPrompt={onDismissAuthPrompt}
                  />
                );
              })}
            </CardGrid>
          )
        ) : (
          <>
            {isLoading && <EmptyHint>Chargement…</EmptyHint>}

            {!isLoading && ownedItems.length > 0 && (
              <>
                <SectionLabel icon={<Home size={13} strokeWidth={2.4} />} label="Mon écurie" count={ownedItems.length} accent={THEME.accentSage} />
                <CardGrid>
                  {ownedItems.map((item) => {
                    const option = optionFromGarage(item);
                    return (
                      <ScooterCard
                        key={item.id}
                        option={option}
                        active={selectedId === option.id}
                        badge="owned"
                        isMutating={isMutating}
                        onSelect={() => onSelectGarage(item)}
                        onAddGarage={() => onAddInline(option, true)}
                        onAddFav={() => onAddInline(option, false)}
                        onShowroom={() => onShowroom(option.slug)}
                        showAuthPrompt={!isLoggedIn && authPromptFor === option.id}
                        onGoLogin={onGoLogin}
                        onDismissAuthPrompt={onDismissAuthPrompt}
                      />
                    );
                  })}
                </CardGrid>
              </>
            )}

            {!isLoading && favItems.length > 0 && (
              <>
                <SectionLabel icon={<Heart size={13} strokeWidth={2.4} />} label="Mes favoris" count={favItems.length} accent={THEME.accentRed} />
                <CardGrid>
                  {favItems.map((item) => {
                    const option = optionFromGarage(item);
                    return (
                      <ScooterCard
                        key={item.id}
                        option={option}
                        active={selectedId === option.id}
                        badge="fav"
                        isMutating={isMutating}
                        onSelect={() => onSelectGarage(item)}
                        onAddGarage={() => onAddInline(option, true)}
                        onAddFav={() => onAddInline(option, false)}
                        onShowroom={() => onShowroom(option.slug)}
                        showAuthPrompt={!isLoggedIn && authPromptFor === option.id}
                        onGoLogin={onGoLogin}
                        onDismissAuthPrompt={onDismissAuthPrompt}
                      />
                    );
                  })}
                </CardGrid>
              </>
            )}

            {!isLoading && !hasScooters && popularItems.length > 0 && (
              <>
                <SectionLabel icon={<Flame size={13} strokeWidth={2.4} />} label="Les plus populaires" count={popularItems.length} accent="#F59E0B" />
                <CardGrid>
                  {popularItems.map((option) => (
                    <ScooterCard
                      key={option.id}
                      option={option}
                      active={selectedId === option.id}
                      badge={null}
                      isMutating={isMutating}
                      onSelect={() => onSelectOption(option)}
                      onAddGarage={() => onAddInline(option, true)}
                      onAddFav={() => onAddInline(option, false)}
                      onShowroom={() => onShowroom(option.slug)}
                      showAuthPrompt={!isLoggedIn && authPromptFor === option.id}
                      onGoLogin={onGoLogin}
                      onDismissAuthPrompt={onDismissAuthPrompt}
                    />
                  ))}
                </CardGrid>
              </>
            )}

            {!isLoading && allItems.length > 0 && (
              <>
                <SectionLabel icon={<Bike size={13} strokeWidth={2.4} />} label="Toutes les trottinettes" count={allItems.length} accent={THEME.carbon} />
                <CardGrid>
                  {allItems.map((option) => {
                    const g = garageById.get(option.id);
                    const badge: BadgeKind = g ? (g.isOwned ? "owned" : "fav") : null;
                    return (
                      <ScooterCard
                        key={option.id}
                        option={option}
                        active={selectedId === option.id}
                        badge={badge}
                        isMutating={isMutating}
                        onSelect={() => onSelectOption(option)}
                        onAddGarage={() => onAddInline(option, true)}
                        onAddFav={() => onAddInline(option, false)}
                        onShowroom={() => onShowroom(option.slug)}
                        showAuthPrompt={!isLoggedIn && authPromptFor === option.id}
                        onGoLogin={onGoLogin}
                        onDismissAuthPrompt={onDismissAuthPrompt}
                      />
                    );
                  })}
                </CardGrid>
              </>
            )}
          </>
        )}
        </div>

        {/* Fade haut — visible une fois scrollé */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 right-0 transition-opacity duration-200"
          style={{
            height: 22,
            opacity: fade.top ? 1 : 0,
            background: `linear-gradient(180deg, ${THEME.bgWhite} 0%, rgba(255,255,255,0) 100%)`,
          }}
        />
        {/* Fade bas — signale qu'il reste du contenu dessous */}
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 right-0 transition-opacity duration-200"
          style={{
            height: 28,
            opacity: fade.bottom ? 1 : 0,
            background: `linear-gradient(0deg, ${THEME.bgWhite} 0%, rgba(255,255,255,0) 100%)`,
          }}
        />
      </div>

      {/* Actions — affichees uniquement quand une trottinette est selectionnee
          (jamais de bouton desactive, jamais de cul-de-sac) */}
      {hasSelection && (
        <>
          <div aria-hidden style={{ height: 1, backgroundColor: THEME.borderSubtle, margin: "0 20px" }} />
          <div className="px-5 py-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={onConfirm}
              className="flex items-center justify-center gap-2 w-full transition-colors duration-150"
              style={{
                minHeight: 50,
                padding: "12px 16px",
                borderRadius: 12,
                border: "none",
                backgroundColor: THEME.accentSage,
                color: "#FFFFFF",
                fontFamily: "'Inter', sans-serif",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <Check size={17} strokeWidth={2.6} />
              <span>Voir les pièces compatibles</span>
            </button>

            <button
              type="button"
              onClick={onClear}
              className="flex items-center justify-center gap-2 w-full transition-colors duration-150"
              style={{
                minHeight: 44,
                padding: "10px 16px",
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
          </div>
        </>
      )}
    </div>
  );
};

/* ── Sous-composants ───────────────────────────────────────────────────────── */

const CardGrid = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-1">{children}</div>
);

const EmptyHint = ({ children }: { children: React.ReactNode }) => (
  <div
    className="text-center py-8"
    style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: THEME.textSecondary, lineHeight: 1.5 }}
  >
    {children}
  </div>
);

const SectionLabel = ({
  icon,
  label,
  count,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  accent: string;
}) => (
  <div className="flex items-center gap-2 mt-2 mb-2.5">
    <span
      className="flex items-center justify-center flex-shrink-0"
      style={{
        width: 24,
        height: 24,
        borderRadius: 999,
        backgroundColor: hexToRgba(accent, 0.15),
        color: accent,
      }}
    >
      {icon}
    </span>
    <span
      style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: 13,
        fontWeight: 700,
        color: THEME.carbon,
        lineHeight: 1,
      }}
    >
      {label}
    </span>
    <span
      className="ml-auto"
      style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: 11,
        fontWeight: 500,
        color: THEME.textSecondary,
      }}
    >
      {count} trottinette{count > 1 ? "s" : ""}
    </span>
  </div>
);

interface CardProps {
  option: ScooterOption;
  active: boolean;
  badge: BadgeKind;
  isMutating: boolean;
  onSelect: () => void;
  onAddGarage: () => void;
  onAddFav: () => void;
  onShowroom: () => void;
  /** Popover "connecte-toi" ouvert pour CETTE carte (déconnecté). */
  showAuthPrompt: boolean;
  onGoLogin: () => void;
  onDismissAuthPrompt: () => void;
}

const ScooterCard = ({
  option,
  active,
  badge,
  isMutating,
  onSelect,
  onAddGarage,
  onAddFav,
  onShowroom,
  showAuthPrompt,
  onGoLogin,
  onDismissAuthPrompt,
}: CardProps) => {
  const accent = getBrandColors(option.brandName).accent;

  // Auto-fermeture du popover après quelques secondes.
  useEffect(() => {
    if (!showAuthPrompt) return;
    const t = setTimeout(onDismissAuthPrompt, 4000);
    return () => clearTimeout(t);
  }, [showAuthPrompt, onDismissAuthPrompt]);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={active}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className="relative flex flex-col text-left transition-all duration-150 cursor-pointer overflow-hidden"
      style={{
        borderRadius: 14,
        minHeight: 168,
        border: active ? `2px solid ${accent}` : `1px solid ${THEME.borderLight}`,
        backgroundColor: active ? hexToRgba(accent, 0.05) : THEME.bgWhite,
        boxShadow: active ? `0 4px 14px ${hexToRgba(accent, 0.18)}` : "none",
      }}
    >
      {/* Badge écurie / favori */}
      {badge && (
        <div
          className="absolute top-2 right-2 flex items-center justify-center"
          style={{
            width: 22,
            height: 22,
            borderRadius: 999,
            backgroundColor: badge === "fav" ? hexToRgba(THEME.accentRed, 0.12) : hexToRgba(THEME.carbon, 0.06),
          }}
        >
          {badge === "owned" ? (
            <Home size={12} strokeWidth={2.4} aria-label="Dans mon écurie" style={{ color: THEME.carbon }} />
          ) : (
            <Heart
              size={12}
              strokeWidth={2.4}
              aria-label="Dans mes favoris"
              style={{ color: THEME.accentRed, fill: THEME.accentRed }}
            />
          )}
        </div>
      )}

      {/* Check état sélectionné */}
      {active && (
        <div
          className="absolute top-2 left-2 flex items-center justify-center"
          style={{ width: 22, height: 22, borderRadius: 999, backgroundColor: accent }}
        >
          <Check size={13} strokeWidth={3} style={{ color: "#FFFFFF" }} />
        </div>
      )}

      {/* Vignette */}
      <div
        className="flex items-center justify-center"
        style={{ height: 78, backgroundColor: THEME.bgCapsule, paddingTop: 8 }}
      >
        {option.imageUrl ? (
          <img
            src={option.imageUrl}
            alt={option.name}
            loading="lazy"
            decoding="async"
            style={{ height: 64, width: "auto", objectFit: "contain" }}
          />
        ) : (
          <Bike size={28} strokeWidth={1.8} style={{ color: THEME.textSecondary }} aria-hidden />
        )}
      </div>

      {/* Filet couleur de marque */}
      <div aria-hidden style={{ height: 3, backgroundColor: accent }} />

      {/* Infos */}
      <div className="px-2.5 pt-2 pb-1 flex-1 min-w-0">
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 9.5,
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: THEME.textSecondary,
            lineHeight: 1,
            marginBottom: 3,
          }}
        >
          {option.brandName}
        </p>
        <p
          className="truncate"
          style={{
            fontFamily: "'Anton', Impact, sans-serif",
            fontSize: 13,
            fontWeight: 400,
            textTransform: "uppercase",
            letterSpacing: "-0.01em",
            color: THEME.carbon,
            lineHeight: 1.1,
          }}
        >
          {option.name}
        </p>
      </div>

      {/* Actions secondaires : favori / garage (sans redirection) */}
      <div className="flex border-t" style={{ borderColor: THEME.borderSubtle }}>
        <CardAction
          label="Favori"
          active={badge === "fav"}
          icon={<Heart size={13} strokeWidth={2.3} style={{ color: badge === "fav" ? THEME.accentRed : THEME.textSecondary, fill: badge === "fav" ? THEME.accentRed : "transparent" }} />}
          disabled={isMutating}
          onClick={(e) => {
            e.stopPropagation();
            onAddFav();
          }}
        />
        <div aria-hidden style={{ width: 1, backgroundColor: THEME.borderSubtle }} />
        <CardAction
          label="Garage"
          active={badge === "owned"}
          icon={<Home size={13} strokeWidth={2.3} style={{ color: badge === "owned" ? THEME.accentSage : THEME.textSecondary }} />}
          disabled={isMutating}
          onClick={(e) => {
            e.stopPropagation();
            onAddGarage();
          }}
        />
      </div>

      {/* Showroom → : seule action qui quitte la home (fiche showroom) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onShowroom();
        }}
        aria-label={`Voir le showroom de ${option.name}`}
        className="flex items-center justify-center gap-1 border-t transition-colors duration-150"
        style={{
          minHeight: 34,
          borderColor: THEME.borderSubtle,
          fontFamily: "'Inter', sans-serif",
          fontSize: 10.5,
          fontWeight: 600,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: THEME.textSecondary,
        }}
      >
        <span>Showroom</span>
        <ArrowRight size={12} strokeWidth={2.4} />
      </button>

      {/* Popover contextuel "connecte-toi" — ancré sur la carte cliquée (déconnecté) */}
      <AnimatePresence>
        {showAuthPrompt && (
          <motion.div
            key="auth-pop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => {
              e.stopPropagation();
              onDismissAuthPrompt();
            }}
            className="absolute inset-0 z-20 flex items-end"
            style={{ backgroundColor: "rgba(255,255,255,0.82)", backdropFilter: "blur(2px)" }}
          >
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="m-2 flex flex-col gap-2 w-full"
              style={{
                padding: 10,
                borderRadius: 12,
                backgroundColor: "#FFFFFF",
                border: `1px solid ${hexToRgba(THEME.accentSage, 0.35)}`,
                boxShadow: "0 10px 28px rgba(0,0,0,0.20)",
              }}
            >
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 11.5,
                  fontWeight: 500,
                  color: THEME.carbon,
                  lineHeight: 1.3,
                }}
              >
                Connecte-toi pour sauvegarder ta trottinette
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onGoLogin();
                }}
                className="inline-flex items-center justify-center gap-1.5 w-full transition-transform duration-150 active:scale-95"
                style={{
                  minHeight: 44,
                  borderRadius: 9,
                  backgroundColor: THEME.accentSage,
                  color: "#FFFFFF",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 12.5,
                  fontWeight: 700,
                }}
              >
                <LogIn size={15} strokeWidth={2.5} />
                <span>Se connecter</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CardAction = ({
  label,
  icon,
  active,
  disabled,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  /** Quand true : l'icône fait un "pop" (rejoué à chaque passage à true). */
  active: boolean;
  disabled: boolean;
  onClick: (e: React.MouseEvent) => void;
}) => (
  <motion.button
    type="button"
    disabled={disabled}
    onClick={onClick}
    whileTap={{ scale: 0.88 }}
    className="flex-1 inline-flex items-center justify-center gap-1 transition-colors duration-150"
    style={{
      minHeight: 36,
      fontFamily: "'Inter', sans-serif",
      fontSize: 11,
      fontWeight: 600,
      color: THEME.textSecondary,
      opacity: disabled ? 0.5 : 1,
    }}
  >
    {/* key change (active flip) rejoue l'animation de pop */}
    <motion.span
      key={String(active)}
      className="inline-flex"
      initial={false}
      animate={active ? { scale: [1, 1.3, 1] } : { scale: 1 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
    >
      {icon}
    </motion.span>
    <span>{label}</span>
  </motion.button>
);


/* ── 18/10 — Sélecteur en DA Atelier (retour Nolan : « le mode de sélection, c'est trollé ; je veux un joli carrousel,
   et il faut expliquer ce qu'on choisit »). Défaut ; ?selecteur=0 = ancien corps ci-dessus.
   - On peut choisir N'IMPORTE quelle trottinette du site (437 modèles) : la recherche tolère espaces, tirets, fautes.
   - Celles du garage et des favoris passent en premier, en carrousel, la trott qui sort de sa carte.
   - En recherche : une liste compacte juste sous le champ, visible au-dessus du clavier.
   - Plus de défilement imbriqué (une seule zone qui défile). ── */
const A_UNB = "'Unbounded', sans-serif";
const A_FONT = "'Plus Jakarta Sans', sans-serif";
const A_CARBON = "#1A1A1A";
const A_GREEN = "#4A7C59";
const A_LINE = "#E2DCD0";
const aCut = (px: number) => `polygon(0 0, calc(100% - ${px}px) 0, 100% ${px}px, 100% 100%, 0 100%)`;

export const readSelecteurVariant = (): 0 | 1 => {
  try {
    return new URLSearchParams(window.location.search).get("selecteur") === "0" ? 0 : 1;
  } catch {
    return 1;
  }
};

const ACarouselCard = ({ option, active, badge, onSelect }: { option: ScooterOption; active: boolean; badge: BadgeKind; onSelect: () => void }) => (
  <button type="button" onClick={onSelect} aria-pressed={active} className="relative shrink-0 w-[150px] pt-9 text-left">
    <div className="relative pt-[92px] px-3 pb-3" style={{ background: active ? A_CARBON : "#FFFFFF", clipPath: aCut(10), boxShadow: active ? "none" : `inset 0 0 0 1px ${A_LINE}` }}>
      <span className="block text-sm font-extrabold uppercase truncate" style={{ fontFamily: A_FONT, color: active ? "rgba(255,255,255,0.7)" : "#6B7280" }}>{option.brandName}</span>
      <span className="block text-[15px] uppercase leading-tight line-clamp-2" style={{ fontFamily: A_UNB, fontWeight: 900, fontStyle: "italic", color: active ? "#FFFFFF" : A_CARBON }}>{option.name}</span>
      <span className="mt-1.5 inline-flex items-center gap-1 text-sm font-bold" style={{ fontFamily: A_FONT, color: active ? "#8FBF9C" : A_GREEN }}>
        {active ? <><Check size={14} strokeWidth={3} /> Choisie</> : badge === "owned" ? "Ton garage" : badge === "fav" ? "Favori" : "Choisir"}
      </span>
    </div>
    <div className="pointer-events-none absolute inset-x-0 top-0 h-[128px] flex items-end justify-center">
      {option.imageUrl ? <img src={option.imageUrl} alt="" loading="lazy" className="max-h-full max-w-[90%] object-contain" style={{ filter: "drop-shadow(0 10px 10px rgba(0,0,0,0.3))" }} /> : <Bike className="w-12 h-12 text-gray-400" strokeWidth={1.2} />}
    </div>
  </button>
);

const ACarousel = ({ title, hint, items, selectedId, garageById, onSelect }: { title: string; hint?: string; items: ScooterOption[]; selectedId: string | null; garageById: Map<string, GarageState>; onSelect: (o: ScooterOption) => void }) =>
  items.length === 0 ? null : (
    <section className="mt-5">
      <div className="flex items-baseline justify-between gap-2 px-5">
        <h3 className="text-[15px] uppercase" style={{ fontFamily: A_UNB, fontWeight: 900, fontStyle: "italic", color: A_CARBON }}>{title}</h3>
        <span className="text-sm font-bold" style={{ fontFamily: A_FONT, color: "#6B7280" }}>{items.length}</span>
      </div>
      {hint && <p className="px-5 mt-0.5 text-sm" style={{ fontFamily: A_FONT, color: "#6B7280" }}>{hint}</p>}
      <div className="mt-1 flex gap-2.5 overflow-x-auto px-5 pb-1" style={{ scrollbarWidth: "none" }}>
        {items.map((o) => {
          const g = garageById.get(o.id);
          return <ACarouselCard key={o.id} option={o} active={selectedId === o.id} badge={g ? (g.isOwned ? "owned" : "fav") : null} onSelect={() => onSelect(o)} />;
        })}
      </div>
    </section>
  );

const SelectorBodyAtelier = (p: SelectorBodyProps & { onFocusChange?: (f: boolean) => void }) => {
  const owned = p.ownedItems.map(optionFromGarage);
  const favs = p.favItems.map(optionFromGarage);
  const selectGarageOrOption = (o: ScooterOption) => {
    const item = [...p.ownedItems, ...p.favItems].find((i) => i.scooter_model?.id === o.id);
    if (item) p.onSelectGarage(item);
    else p.onSelectOption(o);
  };
  const selectedName = (() => {
    const all = [...owned, ...favs, ...p.popularItems, ...p.searchResults, ...p.allItems];
    return all.find((o) => o.id === p.selectedId)?.name ?? null;
  })();
  return (
    <div className="flex flex-col min-h-0 flex-1" style={{ fontFamily: A_FONT }}>
      <div className="px-5 pt-2 pb-3 shrink-0">
        <h2 className="text-[22px] uppercase leading-none" style={{ fontFamily: A_UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.03em", color: A_CARBON }}>
          Ta <span style={{ color: A_GREEN }}>trottinette</span>
        </h2>
        <p className="mt-1.5 text-sm leading-snug" style={{ color: "#4B5563" }}>
          Choisis-la : on ne te montre que les pièces qui vont dessus. Toutes les marques du site sont là{p.hasScooters ? ", celles de ton garage en premier" : ""}.
        </p>
        <label className="mt-3 flex items-center gap-2 px-3 h-[50px] bg-white" style={{ clipPath: aCut(10), boxShadow: `inset 0 0 0 1px ${A_LINE}` }}>
          <Search size={18} strokeWidth={2.2} className="shrink-0 text-gray-500" />
          <span className="sr-only">Rechercher une trottinette</span>
          <input
            type="text"
            inputMode="search"
            value={p.query}
            onChange={(e) => p.onQueryChange(e.target.value)}
            onFocus={() => p.onFocusChange?.(true)}
            onBlur={() => p.onFocusChange?.(false)}
            placeholder="Marque ou modèle : Xiaomi, E-Twow GT…"
            enterKeyHint="search"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className="flex-1 min-w-0 bg-transparent outline-none text-base"
            style={{ color: A_CARBON }}
          />
          {p.isSearching && (
            <button type="button" onClick={() => p.onQueryChange("")} aria-label="Effacer" className="w-10 h-10 flex items-center justify-center text-gray-500"><X size={18} /></button>
          )}
        </label>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pb-4">
        {p.isSearching ? (
          p.searchResults.length === 0 ? (
            <p className="px-5 py-6 text-base" style={{ color: "#4B5563" }}>Rien pour « {p.trimmed} ». Essaie juste la marque, ou le nom sans la marque.</p>
          ) : (
            <ul className="px-5">
              <li className="pb-1 text-sm font-bold" style={{ color: "#6B7280" }}>{p.searchResults.length} modèle{p.searchResults.length > 1 ? "s" : ""}</li>
              {p.searchResults.slice(0, 40).map((o, i) => {
                const g = p.garageById.get(o.id);
                const on = p.selectedId === o.id;
                return (
                  <li key={o.id} style={{ borderTop: i ? `1px solid ${A_LINE}` : "none" }}>
                    <div className="flex items-center gap-3 py-2">
                      <button type="button" onClick={() => p.onSelectOption(o)} className="flex-1 min-w-0 flex items-center gap-3 text-left min-h-[52px]">
                        <span className="w-14 h-12 shrink-0 flex items-center justify-center" style={{ background: "#F2EFE8", clipPath: aCut(6) }}>
                          {o.imageUrl ? <img src={o.imageUrl} alt="" loading="lazy" className="max-h-full max-w-full object-contain p-0.5" /> : <Bike size={20} className="text-gray-400" />}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-bold uppercase truncate" style={{ color: "#6B7280" }}>{o.brandName}{g ? (g.isOwned ? " · ton garage" : " · favori") : ""}</span>
                          <span className="block text-[15px] font-extrabold truncate" style={{ color: A_CARBON }}>{o.name}</span>
                        </span>
                      </button>
                      {on ? (
                        <span className="shrink-0 inline-flex items-center gap-1 px-3 h-10 text-sm font-extrabold uppercase text-white" style={{ background: A_CARBON, clipPath: aCut(6) }}><Check size={14} strokeWidth={3} /> Choisie</span>
                      ) : !g ? (
                        <button type="button" disabled={p.isMutating} onClick={() => p.onAddInline(o, false)} aria-label={`Ajouter ${o.name} à mes favoris`} className="shrink-0 w-11 h-11 flex items-center justify-center" style={{ boxShadow: `inset 0 0 0 1px ${A_LINE}`, clipPath: aCut(6) }}>
                          <Heart size={18} className="text-gray-600" />
                        </button>
                      ) : null}
                    </div>
                    {p.authPromptFor === o.id && (
                      <div className="mb-2 px-3 py-2 flex items-center justify-between gap-2" style={{ background: "#F2EFE8", clipPath: aCut(6) }}>
                        <span className="text-sm" style={{ color: A_CARBON }}>Connecte-toi pour la garder dans ton garage.</span>
                        <button type="button" onClick={p.onGoLogin} className="shrink-0 px-3 h-9 text-sm font-extrabold uppercase text-white" style={{ background: A_CARBON, clipPath: aCut(5) }}>Connexion</button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )
        ) : (
          <>
            {p.isLoading && p.isLoggedIn ? <div className="mx-5 mt-5 h-[150px] animate-pulse" style={{ background: "#F2EFE8", clipPath: aCut(10) }} /> : null}
            <ACarousel title="Ton garage" hint="Tes trottinettes" items={owned} selectedId={p.selectedId} garageById={p.garageById} onSelect={selectGarageOrOption} />
            <ACarousel title="Tes favoris" items={favs} selectedId={p.selectedId} garageById={p.garageById} onSelect={selectGarageOrOption} />
            <ACarousel title="À la une" hint="Ou tape la tienne dans la barre au-dessus" items={p.popularItems} selectedId={p.selectedId} garageById={p.garageById} onSelect={p.onSelectOption} />
            {!p.isLoggedIn && (
              <p className="mx-5 mt-5 px-3 py-3 text-sm" style={{ background: "#F2EFE8", clipPath: aCut(8), color: A_CARBON }}>
                <b>Astuce :</b> crée ton garage gratuit, ta trott sera choisie d'office à chaque visite.{" "}
                <button type="button" onClick={p.onGoLogin} className="font-bold underline underline-offset-4">Me connecter</button>
              </p>
            )}
          </>
        )}
      </div>

      <div className="shrink-0 px-5 pt-3 pb-4" style={{ borderTop: `1px solid ${A_LINE}`, background: "#FFFFFF" }}>
        <button type="button" onClick={p.onConfirm} disabled={!p.hasSelection} className="w-full min-h-[52px] px-4 flex items-center justify-between text-[15px] font-extrabold uppercase text-white disabled:opacity-40" style={{ background: A_CARBON, clipPath: aCut(10) }}>
          <span className="truncate">{selectedName ? `Voir les pièces pour ${selectedName}` : "Choisis une trottinette"}</span>
          <ArrowRight size={20} strokeWidth={2.6} className="shrink-0" />
        </button>
        {p.hasSelection && (
          <button type="button" onClick={p.onClear} className="mt-1 w-full min-h-[44px] text-sm font-bold underline underline-offset-4" style={{ color: "#4B5563" }}>
            Voir toutes les pièces, sans filtre
          </button>
        )}
      </div>
    </div>
  );
};

export default ScooterSelectorSheet;
