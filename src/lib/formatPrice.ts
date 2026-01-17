/**
 * Format price in French format with non-breaking space
 * Example: 25.00 € (with non-breaking space before €)
 */
export const formatPrice = (price: number): string => {
  // \u00A0 is the non-breaking space character
  return `${price.toFixed(2)}\u00A0€`;
};

/**
 * Format price for display in components (returns parts separately)
 */
export const formatPriceParts = (price: number): { amount: string; currency: string } => {
  return {
    amount: price.toFixed(2),
    currency: '€',
  };
};
