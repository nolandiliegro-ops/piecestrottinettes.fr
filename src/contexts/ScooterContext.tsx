import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ============ BRAND COLOR SYSTEM - Neon High-End ============
export interface BrandColorConfig {
  accent: string;      // HEX color
  bgClass: string;     // Tailwind bg class with 15% opacity
  textClass: string;   // Tailwind text class
  borderClass: string; // Tailwind border class
  glowColor: string;   // CSS box-shadow color
}

export const BRAND_COLORS: Record<string, BrandColorConfig> = {
  dualtron: {
    accent: '#DC2626',
    bgClass: 'bg-[#DC2626]/15',
    textClass: 'text-[#DC2626]',
    borderClass: 'border-[#DC2626]/30',
    glowColor: 'rgba(220, 38, 38, 0.4)',
  },
  ninebot: {
    accent: '#4A7C59',
    bgClass: 'bg-[#4A7C59]/15',
    textClass: 'text-[#4A7C59]',
    borderClass: 'border-[#4A7C59]/30',
    glowColor: 'rgba(74, 124, 89, 0.4)',
  },
  segway: {
    accent: '#1E3A8A',
    bgClass: 'bg-[#1E3A8A]/15',
    textClass: 'text-[#1E3A8A]',
    borderClass: 'border-[#1E3A8A]/30',
    glowColor: 'rgba(30, 58, 138, 0.4)',
  },
  xiaomi: {
    accent: '#0066CC',
    bgClass: 'bg-[#0066CC]/15',
    textClass: 'text-[#0066CC]',
    borderClass: 'border-[#0066CC]/30',
    glowColor: 'rgba(0, 102, 204, 0.4)',
  },
  kaabo: {
    accent: '#FF6600',
    bgClass: 'bg-[#FF6600]/15',
    textClass: 'text-[#FF6600]',
    borderClass: 'border-[#FF6600]/30',
    glowColor: 'rgba(255, 102, 0, 0.4)',
  },
  kukirin: {
    accent: '#1A1A1A',
    bgClass: 'bg-[#1A1A1A]/15',
    textClass: 'text-[#1A1A1A]',
    borderClass: 'border-[#1A1A1A]/30',
    glowColor: 'rgba(26, 26, 26, 0.4)',
  },
};

// Default fallback color (mineral)
const DEFAULT_BRAND_COLOR: BrandColorConfig = {
  accent: '#6B8E89',
  bgClass: 'bg-mineral/15',
  textClass: 'text-mineral',
  borderClass: 'border-mineral/30',
  glowColor: 'rgba(107, 142, 137, 0.4)',
};

// Helper to normalize brand slug for lookup
const normalizeBrandSlug = (brandName: string): string => {
  if (!brandName) return '';
  const lower = brandName.toLowerCase();
  // "Segway-Ninebot" / "Segway Ninebot" → Segway prend la priorité
  // (Segway et Ninebot ont désormais des couleurs distinctes)
  if (lower.includes('segway')) return 'segway';
  if (lower.includes('ninebot')) return 'ninebot';
  return lower.replace(/[^a-z0-9]/g, '');
};

// Get brand colors by brand name
export const getBrandColors = (brandName?: string | null): BrandColorConfig => {
  if (!brandName) return DEFAULT_BRAND_COLOR;
  const slug = normalizeBrandSlug(brandName);
  return BRAND_COLORS[slug] || DEFAULT_BRAND_COLOR;
};

// ============ SCOOTER CONTEXT ============
export interface SelectedScooter {
  id: string;
  name: string;
  slug: string;
  brandName: string;
  imageUrl?: string | null;
}

interface ScooterContextType {
  selectedScooter: SelectedScooter | null;
  setSelectedScooter: (scooter: SelectedScooter | null) => void;
  clearSelection: () => void;
  allScooters: ScooterOption[];
  isLoading: boolean;
  // Brand color helpers
  getBrandColors: (brandName?: string | null) => BrandColorConfig;
  selectedBrandColors: BrandColorConfig;
}

export interface ScooterOption {
  id: string;
  name: string;
  slug: string;
  brandName: string;
  imageUrl?: string | null;
}

const STORAGE_KEY = 'pt-selected-scooter';

const ScooterContext = createContext<ScooterContextType | null>(null);

export const ScooterProvider = ({ children }: { children: ReactNode }) => {
  const [selectedScooter, setSelectedScooterState] = useState<SelectedScooter | null>(null);
  const [allScooters, setAllScooters] = useState<ScooterOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSelectedScooterState(parsed);
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Fetch all scooters for dropdown (fallback, but garage-first preferred)
  useEffect(() => {
    const fetchScooters = async () => {
      try {
        const { data, error } = await supabase
          .from('scooter_models')
          .select(`
            id,
            name,
            slug,
            image_url,
            brand:brands!scooter_models_brand_id_fkey(name)
          `)
          .eq('published', true)
          .order('name');

        if (error) throw error;

        const options: ScooterOption[] = (data || []).map((s) => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
          brandName: (s.brand as { name: string } | null)?.name || 'Unknown',
          imageUrl: s.image_url,
        }));

        setAllScooters(options);
      } catch (error) {
        console.error('Error fetching scooters:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchScooters();
  }, []);

  const setSelectedScooter = (scooter: SelectedScooter | null) => {
    setSelectedScooterState(scooter);
    if (scooter) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scooter));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const clearSelection = () => {
    setSelectedScooterState(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Memoize selected brand colors
  const selectedBrandColors = useMemo(() => {
    return getBrandColors(selectedScooter?.brandName);
  }, [selectedScooter?.brandName]);

  return (
    <ScooterContext.Provider
      value={{
        selectedScooter,
        setSelectedScooter,
        clearSelection,
        allScooters,
        isLoading,
        getBrandColors,
        selectedBrandColors,
      }}
    >
      {children}
    </ScooterContext.Provider>
  );
};

export const useSelectedScooter = () => {
  const context = useContext(ScooterContext);
  if (!context) {
    throw new Error('useSelectedScooter must be used within a ScooterProvider');
  }
  return context;
};
