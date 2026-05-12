export interface ImageEntry {
  url: string;
  position?: number;
  is_primary?: boolean;
  alt?: string;
}

const isImageEntryArray = (val: unknown): val is ImageEntry[] =>
  Array.isArray(val) && val.length > 0 && typeof (val[0] as ImageEntry)?.url === "string";

export const getPrimaryImage = (
  images: unknown,
  imageUrl: string | null | undefined,
  fallback = "/placeholder.svg"
): string => {
  if (isImageEntryArray(images)) {
    const primary = images.find((i) => i.is_primary);
    return primary?.url ?? images[0].url ?? fallback;
  }
  return imageUrl ?? fallback;
};

export const getAllImages = (
  images: unknown,
  imageUrl: string | null | undefined
): ImageEntry[] => {
  if (isImageEntryArray(images)) {
    return [...images].sort((a, b) => {
      if (a.is_primary && !b.is_primary) return -1;
      if (!a.is_primary && b.is_primary) return 1;
      return (a.position ?? 0) - (b.position ?? 0);
    });
  }
  if (imageUrl) return [{ url: imageUrl, is_primary: true, position: 0 }];
  return [];
};
