import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Search, ArrowLeft } from "lucide-react";
import SEO from "@/components/SEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useSpotlight } from "@/contexts/SpotlightContext";

const NotFound = () => {
  const location = useLocation();
  const { openSpotlight } = useSpotlight();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <SEO noindex title="Page introuvable" description="Cette page n'existe pas ou a été déplacée." />
      <Header />
      <main className="pt-24 pb-24 px-4">
        <div className="max-w-xl mx-auto text-center">
          <p className="font-display text-6xl md:text-7xl text-carbon tracking-tight">404</p>
          <h1 className="font-display text-2xl md:text-3xl text-carbon tracking-wide mt-4 mb-4">
            PAGE INTROUVABLE
          </h1>
          <p className="text-muted-foreground mb-10">
            Cette pièce du site n'existe plus ou a changé d'adresse. Le catalogue, lui, est toujours là.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg">
              <Link to="/catalogue">Voir le catalogue</Link>
            </Button>
            <Button variant="outline" size="lg" onClick={openSpotlight}>
              <Search className="w-4 h-4" />
              Rechercher une pièce
            </Button>
          </div>

          <Link
            to="/"
            className="inline-flex items-center gap-2 mt-8 text-sm text-muted-foreground hover:text-carbon transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
