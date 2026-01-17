// Cart Types - Système E-commerce piècestrottinettes.FR

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string | null;
  stock_quantity: number;
}

export interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

export interface CartTotals {
  itemCount: number;
  subtotalHT: number;
  tva: number;
  totalTTC: number;
}
