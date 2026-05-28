import { useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { RotateCcw } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface Props {
  label: string;
  value: string;
  publishedValue: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  disabledReason?: string;
}

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

export const ColorPickerInput = ({
  label,
  value,
  publishedValue,
  onChange,
  disabled,
  disabledReason,
}: Props) => {
  const [draft, setDraft] = useState(value);
  const isDirty = value !== publishedValue;
  const validDraft = HEX_RE.test(draft);

  if (draft !== value && HEX_RE.test(value) && draft.toLowerCase() !== value.toLowerCase()) {
    setDraft(value);
  }

  const commit = (next: string) => {
    setDraft(next);
    if (HEX_RE.test(next)) onChange(next.toUpperCase());
  };

  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm text-foreground truncate">{label}</span>
        {isDirty && !disabled && (
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-500" aria-label="modifié" />
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {disabled ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <div
                    className="w-10 h-10 rounded-md border border-border opacity-50"
                    style={{ background: value }}
                  />
                  <Badge variant="secondary" className="text-[10px]">V2</Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-[220px] text-xs">{disabledReason}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="w-10 h-10 rounded-md border border-border hover:scale-105 transition-transform"
                  style={{ background: value }}
                  aria-label={`Choisir couleur ${label}`}
                />
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3" align="end">
                <HexColorPicker color={value} onChange={(c) => commit(c.toUpperCase())} />
              </PopoverContent>
            </Popover>
            <Input
              value={draft}
              onChange={(e) => commit(e.target.value)}
              className={cn('w-[110px] font-mono text-xs uppercase', !validDraft && 'border-destructive')}
              maxLength={7}
            />
            {isDirty && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => commit(publishedValue)}
                title="Annuler ce changement"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
