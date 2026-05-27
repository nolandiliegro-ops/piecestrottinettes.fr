export const THEME = {
  // Fonds
  bgMain: '#FAFAF8',           // fond principal home
  bgCapsule: '#F5F0E8',        // fond capsules type Shop By Compatibility
  bgWhite: '#FFFFFF',          // blanc pur (cards, modal, sheets)

  // Accents
  accentSage: '#4A7C59',
  accentSageDark: '#3A6449',
  accentOrange: '#FF6600',
  accentRed: '#DC2626',

  // Textes
  carbon: '#1A1A1A',
  textSecondary: '#6B7280',

  // Borders subtle
  borderSubtle: 'rgba(0,0,0,0.04)',
  borderLight: 'rgba(0,0,0,0.08)',
  borderMedium: 'rgba(0,0,0,0.10)',
};

export function hexToRgba(hex: string, alpha: number): string {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}
