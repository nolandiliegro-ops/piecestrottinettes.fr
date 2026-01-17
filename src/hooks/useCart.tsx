import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { CartItem, CartTotals } from '@/types/cart';

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  saveForLater: () => boolean;
  totals: CartTotals;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'pt-cart';
const SAVED_CONFIG_KEY = 'pt-saved-config';
const TVA_RATE = 0.20; // 20% TVA

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  const [isOpen, setIsOpen] = useState(false);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  // Calculate totals with loyalty points
  const totals = useMemo<CartTotals>(() => {
    const subtotalHT = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tva = subtotalHT * TVA_RATE;
    const totalTTC = subtotalHT + tva;
    return {
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotalHT,
      tva,
      totalTTC,
      loyaltyPoints: Math.floor(totalTTC), // 1€ TTC = 1 point (arrondi inférieur)
    };
  }, [items]);

  // Add item (merge if exists)
  const addItem = useCallback((newItem: Omit<CartItem, 'quantity'>) => {
    setItems((currentItems) => {
      const existingIndex = currentItems.findIndex((item) => item.id === newItem.id);
      
      if (existingIndex >= 0) {
        // Item exists, increment quantity (respect stock limit)
        return currentItems.map((item, index) => {
          if (index === existingIndex) {
            const newQuantity = Math.min(item.quantity + 1, item.stock_quantity);
            return { ...item, quantity: newQuantity };
          }
          return item;
        });
      }
      
      // New item
      return [...currentItems, { ...newItem, quantity: 1 }];
    });
  }, []);

  // Remove item
  const removeItem = useCallback((id: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== id));
  }, []);

  // Update quantity
  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity < 1) {
      removeItem(id);
      return;
    }
    
    setItems((currentItems) =>
      currentItems.map((item) => {
        if (item.id === id) {
          // Respect stock limit
          const validQuantity = Math.min(quantity, item.stock_quantity);
          return { ...item, quantity: validQuantity };
        }
        return item;
      })
    );
  }, [removeItem]);

  // Clear cart
  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  // Save cart for later (returns false if cart is empty)
  const saveForLater = useCallback((): boolean => {
    if (items.length === 0) {
      return false;
    }
    localStorage.setItem(SAVED_CONFIG_KEY, JSON.stringify(items));
    return true;
  }, [items]);

  const value: CartContextType = {
    items,
    isOpen,
    setIsOpen,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    saveForLater,
    totals,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
