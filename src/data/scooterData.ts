// Mock data for scooters and brands

export interface Brand {
  id: string;
  name: string;
  logo: string;
}

export interface ScooterModel {
  id: string;
  name: string;
  brandId: string;
  brand: string;
  image: string;
  compatibleParts: number;
  voltage?: number;
  amperage?: number;
  specs: {
    power: string;
    range: string;
    maxSpeed: string;
  };
}

// Options disponibles pour les sélecteurs interactifs
export const voltageOptions = [36, 48, 52, 60, 72];
export const amperageOptions = [7, 10, 12, 15, 18, 20, 24, 30, 35, 40];

export interface Category {
  id: string;
  name: string;
  productCount: number;
  icon: string;
}

export const brands: Brand[] = [
  { id: "xiaomi", name: "Xiaomi", logo: "🛴" },
  { id: "ninebot", name: "Ninebot", logo: "🛴" },
  { id: "segway", name: "Segway", logo: "🛴" },
  { id: "dualtron", name: "Dualtron", logo: "🛴" },
  { id: "kaabo", name: "Kaabo", logo: "🛴" },
];

export const scooterModels: ScooterModel[] = [
  {
    id: "mi-pro-2",
    name: "Mi Pro 2",
    brandId: "xiaomi",
    brand: "Xiaomi",
    image: "/placeholder.svg",
    compatibleParts: 89,
    specs: { power: "300W", range: "45km", maxSpeed: "25km/h" },
  },
  {
    id: "mi-essential",
    name: "Mi Essential",
    brandId: "xiaomi",
    brand: "Xiaomi",
    image: "/placeholder.svg",
    compatibleParts: 67,
    specs: { power: "250W", range: "20km", maxSpeed: "20km/h" },
  },
  {
    id: "mi-3",
    name: "Mi 3",
    brandId: "xiaomi",
    brand: "Xiaomi",
    image: "/placeholder.svg",
    compatibleParts: 78,
    specs: { power: "300W", range: "30km", maxSpeed: "25km/h" },
  },
  {
    id: "g30-max",
    name: "G30 Max",
    brandId: "ninebot",
    brand: "Ninebot",
    image: "/placeholder.svg",
    compatibleParts: 124,
    specs: { power: "350W", range: "65km", maxSpeed: "25km/h" },
  },
  {
    id: "f40",
    name: "F40",
    brandId: "ninebot",
    brand: "Ninebot",
    image: "/placeholder.svg",
    compatibleParts: 56,
    specs: { power: "350W", range: "40km", maxSpeed: "25km/h" },
  },
  {
    id: "p100s",
    name: "P100S",
    brandId: "segway",
    brand: "Segway",
    image: "/placeholder.svg",
    compatibleParts: 92,
    specs: { power: "650W", range: "100km", maxSpeed: "30km/h" },
  },
  {
    id: "ninebot-max-g2",
    name: "Ninebot Max G2",
    brandId: "segway",
    brand: "Segway",
    image: "/placeholder.svg",
    compatibleParts: 88,
    specs: { power: "450W", range: "70km", maxSpeed: "25km/h" },
  },
  {
    id: "thunder",
    name: "Thunder",
    brandId: "dualtron",
    brand: "Dualtron",
    image: "/placeholder.svg",
    compatibleParts: 156,
    specs: { power: "5400W", range: "120km", maxSpeed: "85km/h" },
  },
  {
    id: "victor",
    name: "Victor",
    brandId: "dualtron",
    brand: "Dualtron",
    image: "/placeholder.svg",
    compatibleParts: 134,
    specs: { power: "4000W", range: "100km", maxSpeed: "80km/h" },
  },
  {
    id: "mantis-pro",
    name: "Mantis Pro",
    brandId: "kaabo",
    brand: "Kaabo",
    image: "/placeholder.svg",
    compatibleParts: 78,
    specs: { power: "2000W", range: "60km", maxSpeed: "60km/h" },
  },
  {
    id: "wolf-warrior",
    name: "Wolf Warrior",
    brandId: "kaabo",
    brand: "Kaabo",
    image: "/placeholder.svg",
    compatibleParts: 112,
    specs: { power: "2400W", range: "80km", maxSpeed: "80km/h" },
  },
];

export const categories: Category[] = [
  { id: "pneus", name: "Pneus", productCount: 156, icon: "🔘" },
  { id: "chambres-air", name: "Chambres à Air", productCount: 89, icon: "⭕" },
  { id: "disques-plaquettes", name: "Disques & Plaquettes", productCount: 124, icon: "🛑" },
  { id: "chargeurs", name: "Chargeurs", productCount: 78, icon: "🔌" },
  { id: "batteries", name: "Batteries", productCount: 45, icon: "🔋" },
  { id: "accessoires", name: "Accessoires", productCount: 234, icon: "🎒" },
];
