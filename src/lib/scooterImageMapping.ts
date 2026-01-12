// Centralized scooter image mapping for Hero and Garage consistency
import xiaomiMiPro2 from "@/assets/scooters/xiaomi-mi-pro-2.png";
import xiaomiMiEssential from "@/assets/scooters/xiaomi-mi-essential.png";
import xiaomiMi3 from "@/assets/scooters/xiaomi-mi-3.png";
import ninebotG30Max from "@/assets/scooters/ninebot-g30-max.png";
import ninebotF40 from "@/assets/scooters/ninebot-f40.png";
import segwayP100s from "@/assets/scooters/segway-p100s.png";
import segwayNinebotMaxG2 from "@/assets/scooters/segway-ninebot-max-g2.png";
import dualtronThunder from "@/assets/scooters/dualtron-thunder.png";
import dualtronVictor from "@/assets/scooters/dualtron-victor.png";
import kaaboMantisPro from "@/assets/scooters/kaabo-mantis-pro.png";
import kaaboWolfWarrior from "@/assets/scooters/kaabo-wolf-warrior.png";

// Mapping scooter slugs to imported images
export const scooterImages: Record<string, string> = {
  // Xiaomi
  "mi-pro-2": xiaomiMiPro2,
  "mi-essential": xiaomiMiEssential,
  "mi-3": xiaomiMi3,
  // Ninebot / Segway
  "g30-max": ninebotG30Max,
  "f40": ninebotF40,
  "p100s": segwayP100s,
  "ninebot-max-g2": segwayNinebotMaxG2,
  // Dualtron
  "thunder": dualtronThunder,
  "victor": dualtronVictor,
  // Kaabo
  "mantis-pro": kaaboMantisPro,
  "wolf-warrior": kaaboWolfWarrior,
};

/**
 * Get the HD image for a scooter model by its slug.
 * Priority: local mapping (always reliable) > database image_url > null
 */
export const getScooterImage = (slug: string | undefined | null, dbImageUrl?: string | null): string | null => {
  // Priority 1: Use local mapping if available (always reliable)
  if (slug && scooterImages[slug]) {
    return scooterImages[slug];
  }
  // Priority 2: Fallback to database image URL
  if (dbImageUrl) return dbImageUrl;
  // No image available
  return null;
};
