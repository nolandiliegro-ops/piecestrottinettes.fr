/**
 * Le Veilleur — Scoring qualité /100
 * Décide si un item découvert mérite l'insertion (seuil par défaut : 60).
 */

export function scoreScooter(item, weights, fullSpecsMinFields) {
  let score = 0;
  const reasons = [];

  if (item.price && Number(item.price) > 0) {
    score += weights.has_price;
    reasons.push('+price');
  }
  if (item.official_url && /^https?:\/\//.test(item.official_url)) {
    score += weights.has_official_url;
    reasons.push('+official_url');
  }
  if (Array.isArray(item.images) && item.images.length > 0) {
    score += weights.has_images;
    reasons.push('+images');
  }

  // Specs : compte des champs techniques renseignés
  const specs = item.specs || {};
  const specFields = [
    'voltage', 'motor_power', 'torque', 'max_speed', 'autonomy',
    'battery_wh', 'tire_size', 'tire_type', 'suspension', 'brakes',
    'weight', 'max_load', 'ip_rating', 'foldable',
  ];
  const filled = specFields.filter((f) => specs[f] != null && specs[f] !== '').length;
  if (filled >= fullSpecsMinFields) {
    score += weights.has_full_specs;
    reasons.push(`+specs(${filled})`);
  }

  if (item.description && String(item.description).trim().length > 200) {
    score += weights.has_marketing_description;
    reasons.push('+description');
  }

  return { score, reasons };
}

export function scorePart(item, weights, fullSpecsMinFields) {
  let score = 0;
  const reasons = [];

  if (item.price && Number(item.price) > 0) {
    score += weights.has_price;
    reasons.push('+price');
  }
  if (item.official_url && /^https?:\/\//.test(item.official_url)) {
    score += weights.has_official_url;
    reasons.push('+official_url');
  }
  if (Array.isArray(item.images) && item.images.length > 0) {
    score += weights.has_images;
    reasons.push('+images');
  }

  const specs = item.technical_metadata || {};
  const filled = Object.keys(specs).filter((k) => specs[k] != null && specs[k] !== '').length;
  if (filled >= fullSpecsMinFields) {
    score += weights.has_full_specs;
    reasons.push(`+specs(${filled})`);
  }

  if (item.description && String(item.description).trim().length > 150) {
    score += weights.has_marketing_description;
    reasons.push('+description');
  }

  return { score, reasons };
}
