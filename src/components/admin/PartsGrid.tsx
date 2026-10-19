import { useState } from 'react';
import { Loader2, Trash2, Pencil, ImageOff, AlertTriangle, MoreVertical, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

/** Sous-ensemble de Part dont la grille a besoin — structurellement compatible avec le Part de PartsManager. */
export interface GridPart {
  id: string;
  name: string;
  slug: string;
  published?: boolean;
  price: number | null;
  stock_quantity: number | null;
  min_stock_alert: number | null;
  image_url: string | null;
  sku: string | null;
  description: string | null;
  meta_title: string | null;
  meta_description: string | null;
  category: { name: string } | null;
}

interface PartsGridProps {
  parts: GridPart[];
  isPlaceholder: (url: string | null) => boolean;
  onEdit: (part: GridPart) => void;
  onTogglePublish: (part: GridPart) => void;
  onDelete: (part: GridPart) => void;
  togglingId: string | null;
  deletingId: string | null;
}

/** Complétude d'une fiche : ce qui manque pour qu'elle vende et référence bien. */
export const ficheChecklist = (p: GridPart, isPlaceholder: (u: string | null) => boolean) => {
  const checks: { label: string; ok: boolean }[] = [
    { label: 'Photo', ok: !!p.image_url && !isPlaceholder(p.image_url) },
    { label: 'Description (≥300 car.)', ok: (p.description?.replace(/<[^>]*>/g, '').length ?? 0) >= 300 },
    { label: 'Meta title', ok: !!p.meta_title },
    { label: 'Meta description', ok: !!p.meta_description },
    { label: 'Prix', ok: (p.price ?? 0) > 0 },
    { label: 'SKU', ok: !!p.sku },
  ];
  return { checks, done: checks.filter(c => c.ok).length, total: checks.length };
};

const stockState = (p: GridPart): 'out' | 'low' | 'ok' => {
  const stock = p.stock_quantity ?? 0;
  if (stock === 0) return 'out';
  if (stock <= (p.min_stock_alert ?? 5)) return 'low';
  return 'ok';
};

const PartCard = ({
  part, isPlaceholder, onEdit, onTogglePublish, onDelete, toggling, deleting,
}: {
  part: GridPart;
  isPlaceholder: (u: string | null) => boolean;
  onEdit: (p: GridPart) => void;
  onTogglePublish: (p: GridPart) => void;
  onDelete: (p: GridPart) => void;
  toggling: boolean;
  deleting: boolean;
}) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const hasImage = part.image_url && !isPlaceholder(part.image_url);
  const stock = stockState(part);
  const seo = ficheChecklist(part, isPlaceholder);
  const seoTone = seo.done >= 5 ? 'bg-[hsl(var(--admin-accent))]' : seo.done >= 3 ? 'bg-amber-500' : 'bg-red-500';
  const missing = seo.checks.filter(c => !c.ok).map(c => c.label).join(' · ');

  return (
    <div className={cn(
      'admin-glass-card rounded-2xl overflow-hidden flex flex-col transition-shadow hover:shadow-xl',
      !part.published && 'opacity-80'
    )}>
      {/* Photo — grande, cliquable */}
      <button
        onClick={() => onEdit(part)}
        className="relative aspect-square bg-white flex items-center justify-center group"
        aria-label={`Modifier ${part.name}`}
      >
        {hasImage ? (
          <img
            src={part.image_url as string}
            alt={part.name}
            loading="lazy"
            className="w-full h-full object-contain p-3 transition-transform duration-200 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-[hsl(var(--admin-text-muted))]">
            <ImageOff className="w-8 h-8" />
            <span className="text-xs">Pas de photo</span>
          </div>
        )}

        {/* Badge stock */}
        {stock !== 'ok' && (
          <span className={cn(
            'absolute top-2 left-2 flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full text-white',
            stock === 'out' ? 'bg-red-600' : 'bg-amber-500'
          )}>
            <AlertTriangle className="w-3 h-3" />
            {stock === 'out' ? 'Rupture' : `Stock ${part.stock_quantity}`}
          </span>
        )}

        {/* Statut publication */}
        {!part.published && (
          <span className="absolute bottom-2 left-2 text-[11px] font-bold px-2 py-1 rounded-full bg-[hsl(var(--al20))] text-[hsl(var(--admin-text-muted))]">
            Dépubliée
          </span>
        )}

        {/* Fiche complète — pastille */}
        <span
          title={seo.done === seo.total ? 'Fiche complète' : `Manque : ${missing}`}
          className={cn('absolute top-2 right-2 text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full', seoTone)}
        >
          {seo.done}/{seo.total}
        </span>
      </button>

      {/* Infos */}
      <div className="flex-1 flex flex-col px-3 pt-2 pb-3 gap-1 border-t border-[hsl(var(--admin-border))]">
        <button onClick={() => onEdit(part)} className="text-left">
          <p className="text-sm font-semibold leading-snug line-clamp-2 text-[hsl(var(--admin-text))]">{part.name}</p>
        </button>
        <p className="text-[11px] text-[hsl(var(--admin-text-muted))] truncate">
          {part.category?.name || 'Sans catégorie'}{part.sku ? ` · ${part.sku}` : ''}
        </p>
        <div className="mt-auto flex items-center justify-between pt-1">
          <p className="text-base font-black text-[hsl(var(--admin-text))]">
            {part.price != null ? `${part.price} €` : '—'}
          </p>
          <div className="flex items-center gap-1.5">
            {/* Publier / dépublier en un geste */}
            <div className="flex items-center gap-1" title={part.published ? 'Publiée — cliquer pour dépublier' : 'Dépubliée — cliquer pour publier'}>
              {toggling
                ? <Loader2 className="w-4 h-4 animate-spin text-[hsl(var(--admin-text-muted))]" />
                : <Switch
                    checked={part.published ?? false}
                    onCheckedChange={() => onTogglePublish(part)}
                    className="data-[state=checked]:bg-[hsl(var(--admin-accent))]"
                  />}
            </div>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => onEdit(part)} aria-label="Modifier">
              <Pencil className="w-4 h-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Plus d'actions">
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoreVertical className="w-4 h-4" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white border-[hsl(var(--admin-border))]">
                <DropdownMenuItem asChild>
                  <a href={`/piece/${part.slug}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 cursor-pointer">
                    <Eye className="w-4 h-4" /> Voir sur le site
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setConfirmOpen(true)}
                  className="text-red-600 focus:text-red-600 flex items-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" /> Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer « {part.name} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              La pièce, son image et toutes ses compatibilités seront supprimées. Irréversible.
              Pour la retirer du site sans la perdre, dépublie-la plutôt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDelete(part)} className="bg-destructive hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

/** Grille catalogue : grandes photos, actions directes — plus besoin d'ouvrir la fiche pour publier ou juger. */
const PartsGrid = ({ parts, isPlaceholder, onEdit, onTogglePublish, onDelete, togglingId, deletingId }: PartsGridProps) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3">
    {parts.map(part => (
      <PartCard
        key={part.id}
        part={part}
        isPlaceholder={isPlaceholder}
        onEdit={onEdit}
        onTogglePublish={onTogglePublish}
        onDelete={onDelete}
        toggling={togglingId === part.id}
        deleting={deletingId === part.id}
      />
    ))}
  </div>
);

export default PartsGrid;
