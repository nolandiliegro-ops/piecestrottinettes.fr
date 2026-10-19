import { useState } from 'react';
import { Loader2, Trash2, Pencil, ImageOff, MoreVertical, Copy, Cpu, Eye, Zap, Gauge } from 'lucide-react';
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

/** Sous-ensemble du Scooter de ScootersManager — compatible structurellement. */
export interface GridScooter {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  published: boolean;
  year: number | null;
  power_watts: number | null;
  voltage: number | null;
  max_speed_kmh: number | null;
  brand: { name: string } | null;
}

interface ScootersGridProps {
  scooters: GridScooter[];
  onEdit: (s: GridScooter) => void;
  onTogglePublish: (s: GridScooter) => void;
  onDuplicate: (s: GridScooter) => void;
  onDelete: (s: GridScooter) => void;
  onExpert: (s: GridScooter) => void;
  togglingId: string | null;
  deletingId: string | null;
}

const ScooterCard = ({
  scooter, onEdit, onTogglePublish, onDuplicate, onDelete, onExpert, toggling, deleting,
}: {
  scooter: GridScooter;
  onEdit: (s: GridScooter) => void;
  onTogglePublish: (s: GridScooter) => void;
  onDuplicate: (s: GridScooter) => void;
  onDelete: (s: GridScooter) => void;
  onExpert: (s: GridScooter) => void;
  toggling: boolean;
  deleting: boolean;
}) => {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className={cn(
      'admin-glass-card rounded-2xl overflow-hidden flex flex-col transition-shadow hover:shadow-xl',
      !scooter.published && 'opacity-80'
    )}>
      <button
        onClick={() => onEdit(scooter)}
        className="relative aspect-square bg-white flex items-center justify-center group"
        aria-label={`Modifier ${scooter.name}`}
      >
        {scooter.image_url ? (
          <img
            src={scooter.image_url}
            alt={scooter.name}
            loading="lazy"
            className="w-full h-full object-contain p-3 transition-transform duration-200 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-[hsl(var(--admin-text-muted))]">
            <ImageOff className="w-8 h-8" />
            <span className="text-xs">Pas de photo</span>
          </div>
        )}
        {!scooter.published && (
          <span className="absolute bottom-2 left-2 text-[11px] font-bold px-2 py-1 rounded-full bg-amber-500 text-white">
            Brouillon
          </span>
        )}
        {scooter.year && (
          <span className="absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[hsl(var(--al15))] text-[hsl(var(--admin-text-muted))]">
            {scooter.year}
          </span>
        )}
      </button>

      <div className="flex-1 flex flex-col px-3 pt-2 pb-3 gap-1 border-t border-[hsl(var(--admin-border))]">
        <button onClick={() => onEdit(scooter)} className="text-left">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[hsl(var(--admin-text-muted))]">
            {scooter.brand?.name || '—'}
          </p>
          <p className="text-sm font-bold leading-snug line-clamp-2 text-[hsl(var(--admin-text))]">{scooter.name}</p>
        </button>
        <div className="flex items-center gap-2 text-[11px] text-[hsl(var(--admin-text-muted))]">
          {scooter.power_watts ? <span className="flex items-center gap-0.5"><Zap className="w-3 h-3" />{scooter.power_watts} W</span> : null}
          {scooter.voltage ? <span>{scooter.voltage} V</span> : null}
          {scooter.max_speed_kmh ? <span className="flex items-center gap-0.5"><Gauge className="w-3 h-3" />{scooter.max_speed_kmh} km/h</span> : null}
        </div>
        <div className="mt-auto flex items-center justify-between pt-1">
          <div className="flex items-center gap-1" title={scooter.published ? 'Publiée — cliquer pour dépublier' : 'Brouillon — cliquer pour publier'}>
            {toggling
              ? <Loader2 className="w-4 h-4 animate-spin text-[hsl(var(--admin-text-muted))]" />
              : <Switch
                  checked={scooter.published}
                  onCheckedChange={() => onTogglePublish(scooter)}
                  className="data-[state=checked]:bg-[hsl(var(--admin-accent))]"
                />}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => onEdit(scooter)} aria-label="Modifier">
              <Pencil className="w-4 h-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Plus d'actions">
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoreVertical className="w-4 h-4" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white border-[hsl(var(--admin-border))]">
                <DropdownMenuItem onClick={() => onExpert(scooter)} className="flex items-center gap-2 cursor-pointer">
                  <Cpu className="w-4 h-4" /> Expert Studio
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate(scooter)} className="flex items-center gap-2 cursor-pointer">
                  <Copy className="w-4 h-4" /> Dupliquer
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href={`/scooter/${scooter.slug}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 cursor-pointer">
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
            <AlertDialogTitle>Supprimer « {scooter.name} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le modèle et ses compatibilités seront supprimés. Irréversible.
              Pour le retirer du site sans le perdre, dépublie-le plutôt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDelete(scooter)} className="bg-destructive hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

/** Grille trottinettes : photo en grand, marque/modèle, publié en un geste. */
const ScootersGrid = ({ scooters, onEdit, onTogglePublish, onDuplicate, onDelete, onExpert, togglingId, deletingId }: ScootersGridProps) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3">
    {scooters.map(s => (
      <ScooterCard
        key={s.id}
        scooter={s}
        onEdit={onEdit}
        onTogglePublish={onTogglePublish}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        onExpert={onExpert}
        toggling={togglingId === s.id}
        deleting={deletingId === s.id}
      />
    ))}
  </div>
);

export default ScootersGrid;
