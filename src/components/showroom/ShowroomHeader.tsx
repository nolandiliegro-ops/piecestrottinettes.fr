import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Home, ShoppingCart } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useBrandAsset } from "@/hooks/useBrandAssets";
import { useCart } from "@/hooks/useCart";

const FONT = "'Plus Jakarta Sans', sans-serif";

// Premium "curated showroom" header. Logo centered (absolute) + enlarged,
// Retour (left) + Garage (right) flanking it. Transparent → frosted glass on scroll.
const ShowroomHeader = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setIsOpen: openCart, totals } = useCart();
  const logo = useBrandAsset("logo_main_light");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/trottinettes");
  };

  const handleGarage = () => {
    navigate(user ? "/garage" : "/login?returnTo=/garage");
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        backgroundColor: scrolled ? "rgba(255,255,255,0.9)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(26,26,26,0.08)" : "1px solid transparent",
      }}
    >
      <div className="mx-auto max-w-6xl px-4">
        <div className="relative flex items-center justify-between h-20 md:h-24 lg:h-32">
          {/* Retour (gauche) */}
          <button
            type="button"
            onClick={handleBack}
            aria-label="Retour"
            className="relative z-10 inline-flex items-center gap-1.5 min-h-[44px] px-2 -ml-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A1A]"
            style={{ color: "#1A1A1A", fontFamily: FONT }}
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
            <span className="hidden sm:inline text-sm font-bold uppercase tracking-wider">
              Retour
            </span>
          </button>

          {/* Logo — centré (absolute), agrandi */}
          <Link
            to="/"
            aria-label="Accueil piècestrottinettes"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0 rounded-md hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A1A]"
          >
            <img
              src={logo.url}
              alt={logo.alt}
              loading="eager"
              className="h-14 sm:h-16 md:h-20 lg:h-28 w-auto object-contain"
            />
          </Link>

          {/* Actions (droite) : Panier + Garage */}
          <div className="relative z-10 flex items-center gap-2">
            {/* Panier */}
            <button
              type="button"
              onClick={() => openCart(true)}
              aria-label={`Panier${totals.itemCount > 0 ? ` (${totals.itemCount})` : ""}`}
              className="relative inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A1A]"
              style={{
                color: "#1A1A1A",
                borderColor: "rgba(26,26,26,0.15)",
                backgroundColor: "rgba(255,255,255,0.6)",
              }}
            >
              <ShoppingCart className="w-4 h-4" strokeWidth={2.5} />
              {totals.itemCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[11px] font-bold flex items-center justify-center"
                  style={{ backgroundColor: "#4A7C59" }}
                >
                  {totals.itemCount > 99 ? "99+" : totals.itemCount}
                </span>
              )}
            </button>

            {/* Mon Garage */}
            <button
              type="button"
              onClick={handleGarage}
              aria-label="Mon Garage"
              className="inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A1A]"
              style={{
                color: "#1A1A1A",
                borderColor: "rgba(26,26,26,0.15)",
                backgroundColor: "rgba(255,255,255,0.6)",
                fontFamily: FONT,
              }}
            >
              <Home className="w-4 h-4" strokeWidth={2.5} />
              <span className="hidden sm:inline text-sm font-bold uppercase tracking-wider">
                Garage
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default ShowroomHeader;
