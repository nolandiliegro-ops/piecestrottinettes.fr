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
    accent: '#E63946',
    bgClass: 'bg-[#E63946]/15',
    textClass: 'text-[#E63946]',
    borderClass: 'border-[#E63946]/30',
    glowColor: 'rgba(230, 57, 70, 0.4)',
  },
  ninebot: {
    accent: '#10B981',
    bgClass: 'bg-[#10B981]/15',
    textClass: 'text-[#10B981]',
    borderClass: 'border-[#10B981]/30',
    glowColor: 'rgba(16, 185, 129, 0.4)',
  },
  segway: {
    accent: '#10B981',
    bgClass: 'bg-[#10B981]/15',
    textClass: 'text-[#10B981]',
    borderClass: 'border-[#10B981]/30',
    glowColor: 'rgba(16, 185, 129, 0.4)',
  },
  xiaomi: {
    accent: '#3B82F6',
    bgClass: 'bg-[#3B82F6]/15',
    textClass: 'text-[#3B82F6]',
    borderClass: 'border-[#3B82F6]/30',
    glowColor: 'rgba(59, 130, 246, 0.4)',
  },
  kaabo: {
    accent: '#F97316',
    bgClass: 'bg-[#F97316]/15',
    textClass: 'text-[#F97316]',
    borderClass: 'border-[#F97316]/30',
    glowColor: 'rgba(249, 115, 22, 0.4)',
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
  // Handle "Segway-Ninebot" or "Segway Ninebot" variations
  if (lower.includes('segway') || lower.includes('ninebot')) {
    return 'ninebot';
  }
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
  // Enhanced fields for sync
  modelName?: string;
  nickname?: string | null;
  garageItemId?: string;
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
            brand:brands(name)
          `)
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
