import { z } from "zod";

export const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const optionalUrl = z
  .string()
  .trim()
  .max(2048)
  .url({ message: "URL invalide" })
  .optional()
  .or(z.literal("").transform(() => undefined));

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal("").transform(() => undefined));

export const brandSchema = z.object({
  name: z.string().trim().min(1, "Nom requis").max(80, "Max 80 caractères"),
  slug: z
    .string()
    .trim()
    .min(1, "Slug requis")
    .max(80)
    .regex(slugRegex, "Slug invalide (a-z, 0-9, tirets)"),
  logo_url: optionalText(2048),
  hero_image_url: optionalText(2048),
  tagline: optionalText(160),
  description: optionalText(2000),
  expert_note: optionalText(2000),
  country: optionalText(80),
  founded_year: z
    .number()
    .int()
    .min(1900, "Min 1900")
    .max(2026, "Max 2026")
    .optional(),
  website_url: optionalUrl,
  youtube_video_id: z
    .string()
    .trim()
    .length(11, "ID YouTube = 11 caractères")
    .regex(/^[A-Za-z0-9_-]{11}$/, "Format ID YouTube invalide")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  accent_color: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{6})$/, "Format hex #RRGGBB requis")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  display_order: z.number().int().min(0).max(9999),
  published: z.boolean(),
});

export type BrandFormValues = z.infer<typeof brandSchema>;

export const COUNTRIES = [
  "Chine",
  "Corée du Sud",
  "France",
  "États-Unis",
  "Allemagne",
  "Italie",
  "Espagne",
  "Royaume-Uni",
  "Japon",
  "Taïwan",
  "Pologne",
  "Autre",
];
