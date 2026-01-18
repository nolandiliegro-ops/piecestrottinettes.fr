import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'pt-search-history';
const MAX_HISTORY_ITEMS = 5;

export interface SearchHistoryItem {
  id: string;
  type: 'scooter' | 'part' | 'tutorial';
  slug: string;
  name: string;
  imageUrl?: string;
  meta?: string;
  visitedAt: number;
}

export const useSearchHistory = () => {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }
  }, [history]);

  // Add item to history (deduplicates and limits to 5)
  const addToHistory = useCallback((item: Omit<SearchHistoryItem, 'id' | 'visitedAt'>) => {
    setHistory(prev => {
      const filtered = prev.filter(h => !(h.type === item.type && h.slug === item.slug));
      const newItem: SearchHistoryItem = { 
        ...item, 
        id: Date.now().toString(), 
        visitedAt: Date.now() 
      };
      return [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    });
  }, []);

  // Clear all history
  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Remove single item
  const removeFromHistory = useCallback((id: string) => {
    setHistory(prev => {
      const updated = prev.filter(item => item.id !== id);
      if (updated.length === 0) {
        localStorage.removeItem(STORAGE_KEY);
      }
      return updated;
    });
  }, []);

  return { history, addToHistory, clearHistory, removeFromHistory };
};
