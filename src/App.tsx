import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/hooks/useCart";
import { ScooterProvider } from "@/contexts/ScooterContext";
import CartSidebar from "@/components/cart/CartSidebar";
import Index from "./pages/Index";
import Catalogue from "./pages/Catalogue";
import Scooters from "./pages/Scooters";
import PartDetail from "./pages/PartDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Garage from "./pages/Garage";
import Admin from "./pages/Admin";
import ScooterDetail from "./pages/ScooterDetail";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import Pepites from "./pages/Pepites";
import Tutos from "./pages/Tutos";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import GarageErrorBoundary from "./components/garage/GarageErrorBoundary";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <ScooterProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <CartSidebar />
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/catalogue" element={<Catalogue />} />
            <Route path="/trottinettes" element={<Scooters />} />
            <Route path="/pepites" element={<Pepites />} />
            <Route path="/tutos" element={<Tutos />} />
            <Route path="/piece/:slug" element={<PartDetail />} />
            <Route path="/scooter/:slug" element={<ScooterDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/panier" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-success" element={<OrderSuccessPage />} />
            <Route path="/garage" element={
              <ProtectedRoute>
                <GarageErrorBoundary>
                  <Garage />
                </GarageErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
        </ScooterProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
