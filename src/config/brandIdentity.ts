/**
 * Identité visuelle des marques (17/10/2026).
 * Une couleur par marque, lue dans son logo (pixel dominant saturé) ou reprise de la base
 * (brands.accent_color, déjà posée sur 10 marques). Logo noir ou gris = pas de couleur :
 * la marque prend la scène carbone du site (vert #4A7C59 en accent).
 * Priorité : brands.accent_color > cette table > neutre. Une nouvelle marque sans entrée ici
 * reçoit automatiquement la scène neutre ; il suffit d'ajouter sa couleur pour l'habiller.
 */
export const BRAND_COLORS: Record<string, string> = {
  aprilia: "#D7191F",
  cecotec: "#24849C",
  "e-twow": "#3C84CC",
  engwe: "#E46C24",
  "halo-knight": "#D7191F",
  hiboy: "#16457A",
  hikerboy: "#F29A1F",
  inmotion: "#E46C24",
  iscooter: "#D7191F",
  kingsong: "#E46C24",
  kuickwheel: "#16457A",
  laotie: "#C4122A",
  niu: "#D7192A",
  smartgyro: "#16457A",
  soflow: "#3C9C9C",
  urbanglide: "#B42424",
  weped: "#F2D21B",
  zwheel: "#C83A3A",
  micro: "#2BACE2",
  langfeite: "#B58647",
  wispeed: "#3FBF88",
};

/**
 * Photos de marque générées (17/10/2026, Higgsfield, vraie photo du modèle phare en référence,
 * décors variés dont Marseille, cadrages variés, échelle réaliste ; contrôlées une à une contre la photo
 * du modèle). Servies depuis public/brand-heroes.
 * Priorité (17/10) : cette table > brands.hero_image_url > mise en scène automatique.
 */
export const BRAND_PHOTOS: Record<string, string> = {
  "apollo": "/brand-heroes/apollo.webp",
  "aprilia": "/brand-heroes/aprilia.webp",
  "beaster": "/brand-heroes/beaster.webp",
  "bogist": "/brand-heroes/bogist.webp",
  "cecotec": "/brand-heroes/cecotec.webp",
  "dualtron": "/brand-heroes/dualtron.webp",
  "ducati": "/brand-heroes/ducati.webp",
  "dyu": "/brand-heroes/dyu.webp",
  "e-twow": "/brand-heroes/e-twow.webp",
  "engwe": "/brand-heroes/engwe.webp",
  "halo-knight": "/brand-heroes/halo-knight.webp",
  "hiboy": "/brand-heroes/hiboy.webp",
  "hikerboy": "/brand-heroes/hikerboy.webp",
  "hitway": "/brand-heroes/hitway.webp",
  "inmotion": "/brand-heroes/inmotion.webp",
  "inokim": "/brand-heroes/inokim.webp",
  "iscooter": "/brand-heroes/iscooter.webp",
  "isinwheel": "/brand-heroes/isinwheel.webp",
  "jeep": "/brand-heroes/jeep.webp",
  "joyor": "/brand-heroes/joyor.webp",
  "kaabo": "/brand-heroes/kaabo.webp",
  "kingsong": "/brand-heroes/kingsong.webp",
  "kugoo": "/brand-heroes/kugoo.webp",
  "kuickwheel": "/brand-heroes/kuickwheel.webp",
  "kukirin": "/brand-heroes/kukirin.webp",
  "langfeite": "/brand-heroes/langfeite.webp",
  "laotie": "/brand-heroes/laotie.webp",
  "micro": "/brand-heroes/micro.webp",
  "nami": "/brand-heroes/nami.webp",
  "navee": "/brand-heroes/navee.webp",
  "ninebot": "/brand-heroes/ninebot.webp",
  "niu": "/brand-heroes/niu.webp",
  "ootd": "/brand-heroes/ootd.webp",
  "oxelo": "/brand-heroes/oxelo.webp",
  "punk": "/brand-heroes/punk.webp",
  "pure-electric": "/brand-heroes/pure-electric.webp",
  "segway": "/brand-heroes/segway.webp",
  "smartgyro": "/brand-heroes/smartgyro.webp",
  "soflow": "/brand-heroes/soflow.webp",
  "speedway": "/brand-heroes/speedway.webp",
  "teverun": "/brand-heroes/teverun.webp",
  "urbanglide": "/brand-heroes/urbanglide.webp",
  "velity": "/brand-heroes/velity.webp",
  "vsett": "/brand-heroes/vsett.webp",
  "weped": "/brand-heroes/weped.webp",
  "wispeed": "/brand-heroes/wispeed.webp",
  "xiaomi": "/brand-heroes/xiaomi.webp",
  "yeep-me": "/brand-heroes/yeep-me.webp",
  "zero": "/brand-heroes/zero.webp",
  "zwheel": "/brand-heroes/zwheel.webp",
};

export const NEUTRAL = "#4A7C59";

export interface BrandIdentity {
  /** Couleur de la marque, ou null si son logo est noir/gris. */
  color: string | null;
  /** Couleur d'accent effective (vert du site si la marque n'en a pas). */
  accent: string;
  /** Texte lisible posé sur la couleur pleine. */
  onAccent: string;
}

const luminance = (hex: string) => {
  const n = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const brandIdentity = (slug: string, accentFromDb?: string | null): BrandIdentity => {
  const color = (accentFromDb && /^#[0-9a-f]{6}$/i.test(accentFromDb) ? accentFromDb : null) ?? BRAND_COLORS[slug] ?? null;
  const accent = color ?? NEUTRAL;
  return { color, accent, onAccent: luminance(accent) > 0.45 ? "#1A1A1A" : "#FFFFFF" };
};

/** Modèle phare : le plus puissant qui a une photo (c'est lui qui « a de la gueule »). */
export const flagshipOf = <T extends { image_url: string | null; power_watts: number | null }>(models: T[]): T | null =>
  models.filter((m) => m.image_url).sort((a, b) => (b.power_watts ?? 0) - (a.power_watts ?? 0))[0] ?? null;
