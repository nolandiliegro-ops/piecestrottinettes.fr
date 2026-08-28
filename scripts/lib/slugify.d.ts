export interface SlugifyOptions {
  /** Tronque le slug puis supprime un éventuel tiret final. */
  maxLength?: number;
}

export declare function slugify(input: unknown, options?: SlugifyOptions): string;
