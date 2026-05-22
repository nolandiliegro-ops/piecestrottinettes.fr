import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/hooks/useCart";
import { ScooterProvider } from "@/contexts/ScooterContext";
import { SpotlightProvider } from "@/contexts/SpotlightContext";
import CartSidebar from "@/components/cart/CartSidebar";
import MobileNav from "@/components/navigation/MobileNav";
import SpotlightCommand from "@/components/search/SpotlightCommand";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import GarageErrorBoundary from "./components/garage/GarageErrorBoundary";
import BrandHelmet from "./components/BrandHelmet";

// Lazy-loaded pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const Catalogue = lazy(() => import("./pages/Catalogue"));
const Scooters = lazy(() => import("./pages/Scooters"));
const PartDetail = lazy(() => import("./pages/PartDetail"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Garage = lazy(() => import("./pages/Garage"));
const Admin = lazy(() => import("./pages/Admin"));
const ScooterDetail = lazy(() => import("./pages/ScooterDetail"));
const Showroom = lazy(() => import("./pages/Showroom"));
const Brand = lazy(() => import("./pages/Brand"));
const CartPage = lazy(() => import("./pages/CartPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const OrderSuccessPage = lazy(() => import("./pages/OrderSuccessPage"));
const PaymentSuccessPage = lazy(() => import("./pages/PaymentSuccessPage"));
const Pepites = lazy(() => import("./pages/Pepites"));
const Tutos = lazy(() => import("./pages/Tutos"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Profile = lazy(() => import("./pages/Profile"));
const ExpertStudio = lazy(() => import("./pages/ExpertStudio"));
const CGV = lazy(() => import("./pages/CGV"));
const MentionsLegales = lazy(() => import("./pages/MentionsLegales"));
const Contact = lazy(() => import("./pages/Contact"));

const queryClient = new QueryClient();

// Minimal loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

function App() {
  return (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <ScooterProvider>
          <SpotlightProvider>
            <TooltipProvider>
              <BrandHelmet />
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <SpotlightCommand />
                <CartSidebar />
                <MobileNav />
            <Suspense fallback={<PageLoader />}>
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/catalogue" element={<Catalogue />} />
            <Route path="/trottinettes" element={<Scooters />} />
            <Route path="/pepites" element={<Pepites />} />
            <Route path="/tutos" element={<Tutos />} />
            <Route path="/piece/:slug" element={<PartDetail />} />
            <Route path="/scooter/:slug" element={<ScooterDetail />} />
            <Route path="/showroom/:slug" element={<Showroom />} />
            <Route path="/marque/:slug" element={<Brand />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/panier" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-success" element={<OrderSuccessPage />} />
            <Route path="/payment-success" element={<PaymentSuccessPage />} />
            <Route path="/garage" element={
              <ProtectedRoute>
                <GarageErrorBoundary>
                  <Garage />
                </GarageErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            } />
            <Route path="/admin/scooter/:id/expert" element={
              <ProtectedRoute>
                <ExpertStudio />
              </ProtectedRoute>
            } />
            <Route path="/cgv" element={<CGV />} />
            <Route path="/mentions-legales" element={<MentionsLegales />} />
            <Route path="/contact" element={<Contact />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </SpotlightProvider>
        </ScooterProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
  );
}

export default App;
