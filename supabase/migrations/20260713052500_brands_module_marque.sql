-- Module "Choisis ta marque" : colonnes présentation/monétisation + seed presets 9 marques
alter table public.brands add column if not exists signature_color text;
alter table public.brands add column if not exists showcase_model_id uuid
  references public.scooter_models(id) on delete set null;
alter table public.brands add column if not exists entry_style text
  check (entry_style in ('punch-right','glide-right','slide-left','rise-bottom','dive-top','diag-br','diag-bl'))
  default 'rise-bottom';
alter table public.brands add column if not exists tile_size text
  check (tile_size in ('normal','wide','tall','big')) default 'normal';
alter table public.brands add column if not exists watermark_pos text
  check (watermark_pos in ('tr','bl','cc','tl','br-big')) default 'tr';
alter table public.brands add column if not exists is_star boolean not null default false;
alter table public.brands add column if not exists sponsored boolean not null default false;

update public.brands b
set signature_color = v.signature_color, entry_style = v.entry_style,
    tile_size = v.tile_size, watermark_pos = v.watermark_pos, is_star = v.is_star
from (values
  ('dualtron','#8B1522','punch-right','big','br-big',true),
  ('xiaomi','#EA580C','rise-bottom','normal','tr',true),
  ('pure-electric','#0F766E','dive-top','tall','cc',true),
  ('kaabo','#C2410C','diag-br','wide','bl',false),
  ('kukirin','#CA8A04','diag-bl','normal','tl',false),
  ('ninebot','#059669','slide-left','normal','tr',false),
  ('inokim','#65A30D','glide-right','normal','bl',false),
  ('zero','#B91C1C','diag-br','normal','tr',false),
  ('segway','#1E3A8A','rise-bottom','normal','cc',false)
) as v(slug, signature_color, entry_style, tile_size, watermark_pos, is_star)
where b.slug = v.slug;
