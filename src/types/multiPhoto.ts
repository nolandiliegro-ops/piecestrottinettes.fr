export type EntityType = "scooter" | "part";

export interface ProcessedImage {
  url: string;
  position: number;
  is_primary: boolean;
  alt: string;
}
