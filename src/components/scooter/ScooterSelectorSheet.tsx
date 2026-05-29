import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bike, Check, Flame, Heart, Home, LogIn, Search, X } from "lucide-react";
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

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
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

const ScooterSelectorSheet = ({ open, onOpenChange }: Props) => {
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
  const [authPrompt, setAuthPrompt] = useState(false);

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
    if (!v) {
      setQuery("");
      setAuthPrompt(false);
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
      setAuthPrompt(true);
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
    if (selectedScooter) handleClose(false);
  };

  const handleClear = () => {
    clearSelection();
    handleClose(false);
  };

  const isMutating = addToGarage.isPending || toggleOwned.isPending;

  const body = (
    <SelectorBody
      query={query}
      onQueryChange={setQuery}
      isSearching={isSearching}
      trimmed={trimmed}
      searchResults={searchResults}
      garageById={garageById}
      ownedItems={ownedItems}
      favItems={favItems}
      popularItems={popularItems}
      hasScooters={hasScooters}
      isLoading={isLoading}
      isLoggedIn={!!user}
      authPrompt={authPrompt}
      onDismissAuthPrompt={() => setAuthPrompt(false)}
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
      onConfirm={handleConfirm}
      onClear={handleClear}
    />
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent
          className="p-0 gap-0 overflow-hidden border-0 rounded-2xl"
          style={{ width: 460, maxWidth: "calc(100vw - 32px)", backgroundColor: THEME.bgWhite }}
        >
          <div className="max-h-[80vh] overflow-y-auto">{body}</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="bottom"
        className="p-0 rounded-t-2xl border-t-0 max-h-[85vh] overflow-y-auto"
        style={{ backgroundColor: THEME.bgWhite }}
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
  hasScooters: boolean;
  isLoading: boolean;
  isLoggedIn: boolean;
  authPrompt: boolean;
  onDismissAuthPrompt: () => void;
  onGoLogin: () => void;
  selectedId: string | null;
  hasSelection: boolean;
  isMutating: boolean;
  onSelectOption: (o: ScooterOption) => void;
  onSelectGarage: (i: GarageItem) => void;
  onAddInline: (o: ScooterOption, isOwned: boolean) => void;
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
  hasScooters,
  isLoading,
  isLoggedIn,
  authPrompt,
  onDismissAuthPrompt,
  onGoLogin,
  selectedId,
  hasSelection,
  isMutating,
  onSelectOption,
  onSelectGarage,
  onAddInline,
  onConfirm,
  onClear,
}: SelectorBodyProps) => {
  // Copy des 3 états : recherche / garage / accueil
  const subtitle = isSearching
    ? "Sélectionne un modèle, ajoute-le à ton garage ou à tes favoris"
    : hasScooters
      ? "Choisis dans ton garage ou cherche un autre modèle"
      : "Choisis un modèle populaire ou cherche le tien";

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

      {/* Auth prompt inline (jamais de redirect qui perd le contexte) */}
      {authPrompt && !isLoggedIn && (
        <div className="px-5 pb-3">
          <div
            className="flex items-center gap-3"
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: `1px solid ${hexToRgba(THEME.accentSage, 0.3)}`,
              backgroundColor: hexToRgba(THEME.accentSage, 0.06),
            }}
          >
            <p
              className="flex-1"
              style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: THEME.carbon, lineHeight: 1.35 }}
            >
              Connecte-toi pour sauvegarder ta trottinette dans ton garage.
            </p>
            <button
              type="button"
              onClick={onGoLogin}
              className="flex items-center gap-1.5 flex-shrink-0"
              style={{
                minHeight: 36,
                padding: "0 12px",
                borderRadius: 8,
                backgroundColor: THEME.accentSage,
                color: "#FFFFFF",
                fontFamily: "'Inter', sans-serif",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <LogIn size={14} strokeWidth={2.4} />
              <span>Se connecter</span>
            </button>
            <button
              type="button"
              onClick={onDismissAuthPrompt}
              aria-label="Fermer"
              className="flex items-center justify-center flex-shrink-0"
              style={{ width: 28, height: 28, color: THEME.textSecondary }}
            >
              <X size={14} strokeWidth={2.4} />
            </button>
          </div>
        </div>
      )}

      {/* Body */}
      <div className="px-5 pb-3">
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
                <SectionLabel icon={<Home size={12} strokeWidth={2.4} />} label="Mon écurie" />
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
                      />
                    );
                  })}
                </CardGrid>
              </>
            )}

            {!isLoading && favItems.length > 0 && (
              <>
                <SectionLabel icon={<Heart size={12} strokeWidth={2.4} />} label="Mes favoris" />
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
                      />
                    );
                  })}
                </CardGrid>
              </>
            )}

            {!isLoading && popularItems.length > 0 && (
              <>
                <SectionLabel icon={<Flame size={12} strokeWidth={2.4} />} label="Les plus populaires" />
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
                    />
                  ))}
                </CardGrid>
              </>
            )}
          </>
        )}
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
  <div className="grid grid-cols-2 gap-2.5">{children}</div>
);

const EmptyHint = ({ children }: { children: React.ReactNode }) => (
  <div
    className="text-center py-8"
    style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: THEME.textSecondary, lineHeight: 1.5 }}
  >
    {children}
  </div>
);

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

interface CardProps {
  option: ScooterOption;
  active: boolean;
  badge: BadgeKind;
  isMutating: boolean;
  onSelect: () => void;
  onAddGarage: () => void;
  onAddFav: () => void;
}

const ScooterCard = ({
  option,
  active,
  badge,
  isMutating,
  onSelect,
  onAddGarage,
  onAddFav,
}: CardProps) => {
  const accent = getBrandColors(option.brandName).accent;

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
          icon={<Home size={13} strokeWidth={2.3} style={{ color: badge === "owned" ? THEME.accentSage : THEME.textSecondary }} />}
          disabled={isMutating}
          onClick={(e) => {
            e.stopPropagation();
            onAddGarage();
          }}
        />
      </div>
    </div>
  );
};

const CardAction = ({
  label,
  icon,
  disabled,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  disabled: boolean;
  onClick: (e: React.MouseEvent) => void;
}) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
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
    {icon}
    <span>{label}</span>
  </button>
);

export default ScooterSelectorSheet;
