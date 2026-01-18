import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface SpotlightContextType {
  isOpen: boolean;
  openSpotlight: () => void;
  closeSpotlight: () => void;
  toggleSpotlight: () => void;
}

const SpotlightContext = createContext<SpotlightContextType | undefined>(undefined);

interface SpotlightProviderProps {
  children: ReactNode;
}

export const SpotlightProvider = ({ children }: SpotlightProviderProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const openSpotlight = useCallback(() => setIsOpen(true), []);
  const closeSpotlight = useCallback(() => setIsOpen(false), []);
  const toggleSpotlight = useCallback(() => setIsOpen((prev) => !prev), []);

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K on Mac or Ctrl+K on Windows/Linux
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleSpotlight();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSpotlight]);

  return (
    <SpotlightContext.Provider value={{
      isOpen,
      openSpotlight,
      closeSpotlight,
      toggleSpotlight,
    }}>
      {children}
    </SpotlightContext.Provider>
  );
};

export const useSpotlight = () => {
  const context = useContext(SpotlightContext);
  if (!context) {
    throw new Error('useSpotlight must be used within a SpotlightProvider');
  }
  return context;
};
