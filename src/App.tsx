import { lazy, Suspense, useState } from "react";
import SmartSearch, { readRechercheVariant } from "@/components/search/SmartSearch";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/hooks/useCart";
import { ScooterProvider } from "@/contexts/ScooterContext";
import { SpotlightProvider } from "@/contexts/SpotlightContext";
import { HeaderScooterDropdownProvider } from "@/contexts/HeaderScooterDropdownContext";
import CartSidebar from "@/components/cart/CartSidebar";
import MobileNav from "@/components/navigation/MobileNav";
import SkotWidget from "@/components/skot/SkotWidget";
import SpotlightCommand from "@/components/search/SpotlightCommand";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PrelaunchModal from "./components/launch/PrelaunchModal";
import ShopGate from "./components/launch/ShopGate";
import GarageErrorBoundary from "./components/garage/GarageErrorBoundary";
import BrandHelmet from "./components/BrandHelmet";
import { useDesignTokens } from "@/hooks/useDesignTokens";
import { DesignTokensPreviewBootstrap } from "@/hooks/useDesignTokensPreview";

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
const PriceAlertStop = lazy(() => import("./pages/PriceAlertStop"));
const GoOffer = lazy(() => import("./pages/GoOffer"));
const Showroom = lazy(() => import("./pages/Showroom"));
const Brand = lazy(() => import("./pages/Brand"));
const Brands = lazy(() => import("./pages/Brands"));
const Categorie = lazy(() => import("./pages/Categorie"));
const CartPage = lazy(() => import("./pages/CartPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const OrderSuccessPage = lazy(() => import("./pages/OrderSuccessPage"));
const PaymentSuccessPage = lazy(() => import("./pages/PaymentSuccessPage"));
const Pepites = lazy(() => import("./pages/Pepites"));
const Tutos = lazy(() => import("./pages/Tutos"));
const Atelier = lazy(() => import("./pages/Atelier"));
const AtelierQuestion = lazy(() => import("./pages/AtelierQuestion"));
const AtelierVideos = lazy(() => import("./pages/AtelierVideos"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogArticle = lazy(() => import("./pages/BlogArticle"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Profile = lazy(() => import("./pages/Profile"));
const ExpertStudio = lazy(() => import("./pages/ExpertStudio"));
const CGV = lazy(() => import("./pages/CGV"));
const MentionsLegales = lazy(() => import("./pages/MentionsLegales"));
const Contact = lazy(() => import("./pages/Contact"));
const OAuthConsent = lazy(() => import("./pages/OAuthConsent"));
const RiderPublicCard = lazy(() => import("./pages/RiderPublicCard"));


const queryClient = new QueryClient();

/** 24/10 : recherche « Vitrine » par défaut (SmartSearch) ; ?recherche=0 = ancienne SpotlightCommand. */
const SearchOverlay = () => {
  const [v] = useState(readRechercheVariant);
  return v ? <SmartSearch variant={v} /> : <SpotlightCommand />;
};

// Minimal loading fallback
// 24/10 (Nolan) : pendant les chargements, le logo centré plutôt qu'une roue qui tourne. Respire doucement (opacité seule).
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background" role="status" aria-label="Chargement">
    <img src="/brand/logo-pt-2026.svg" alt="" width={937} height={268} className="w-[220px] sm:w-[280px] h-auto animate-pulse motion-reduce:animate-none" />
  </div>
);

function DesignTokensBootstrap() {
  useDesignTokens();
  return null;
}

function App() {
  return (
  <QueryClientProvider client={queryClient}>
    <DesignTokensBootstrap />
    <DesignTokensPreviewBootstrap />
    <AuthProvider>
      <CartProvider>
        <ScooterProvider>
          <HeaderScooterDropdownProvider>
          <SpotlightProvider>
            <TooltipProvider>
              <BrandHelmet />
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <SearchOverlay />
                <CartSidebar />
                <MobileNav />
                <PrelaunchModal />
                <SkotWidget />
            <Suspense fallback={<PageLoader />}>
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/catalogue" element={<Catalogue />} />
            <Route path="/trottinettes" element={<Scooters />} />
            <Route path="/pepites" element={<Pepites />} />
            <Route path="/tutos" element={<Tutos />} />
            <Route path="/atelier" element={<Atelier />} />
            <Route path="/atelier/videos" element={<AtelierVideos />} />
            <Route path="/atelier/questions/:slug" element={<AtelierQuestion />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogArticle />} />
            <Route path="/piece/:slug" element={<PartDetail />} />
            <Route path="/scooter/:slug" element={<ScooterDetail />} />
            <Route path="/alerte-prix/stop" element={<PriceAlertStop />} />
            <Route path="/go/:id" element={<GoOffer />} />
            <Route path="/showroom/:slug" element={<Showroom />} />
            <Route path="/marque/:slug" element={<Brand />} />
            <Route path="/marques" element={<Brands />} />
            <Route path="/categorie/:slug" element={<Categorie />} />
            <Route path="/rider/:username" element={<RiderPublicCard />} />
            <Route path="/login" element={<Login />} />

            <Route path="/register" element={<Register />} />
            <Route path="/panier" element={<ShopGate><CartPage /></ShopGate>} />
            <Route path="/checkout" element={<ShopGate><CheckoutPage /></ShopGate>} />
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
            <Route path="/admin/*" element={
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
            <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </SpotlightProvider>
          </HeaderScooterDropdownProvider>
        </ScooterProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
  );
}

export default App;
