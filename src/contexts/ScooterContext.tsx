import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Selected scooter structure
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

  // Fetch all scooters for dropdown
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

  return (
    <ScooterContext.Provider
      value={{
        selectedScooter,
        setSelectedScooter,
        clearSelection,
        allScooters,
        isLoading,
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
