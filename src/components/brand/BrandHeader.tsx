import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowUpRight, ChevronLeft } from "lucide-react";
import { useBrandAsset } from "@/hooks/useBrandAssets";

const FONT = "'Plus Jakarta Sans', sans-serif";

// Premium "curated showroom" header for the editorial brand page.
// Logo centered + enlarged ; Retour (left) + Catalogue (right) flanking it.
// Transparent at top → frosted glass on scroll (backdrop-blur only here, never on scrolling content).
const BrandHeader = () => {
  const navigate = useNavigate();
  const logo = useBrandAsset("logo_main_light");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  };

  return (
    <header
      className="fixed top-0 inset-x-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
      style={{
        backgroundColor: scrolled ? "rgba(245,240,232,0.8)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(26,26,26,0.08)" : "1px solid transparent",
      }}
    >
      <div className="mx-auto max-w-6xl px-4 lg:px-8">
        <div className="relative flex items-center justify-between h-20 md:h-24 lg:h-32">
          {/* Retour (gauche) */}
          <button
            type="button"
            onClick={handleBack}
            aria-label="Retour"
            className="relative z-10 inline-flex items-center gap-1.5 min-h-[44px] px-2 -ml-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A1A]"
            style={{ color: "#1A1A1A", fontFamily: FONT }}
          >
            <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
            <span className="hidden sm:inline text-sm font-bold uppercase tracking-wider">Retour</span>
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

          {/* Catalogue (droite) */}
          <Link
            to="/catalogue"
            aria-label="Voir le catalogue"
            className="group relative z-10 inline-flex items-center gap-2 min-h-[44px] pl-4 pr-2 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A1A]"
            style={{
              color: "#1A1A1A",
              borderColor: "rgba(26,26,26,0.15)",
              backgroundColor: "rgba(255,255,255,0.6)",
              fontFamily: FONT,
            }}
          >
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">Catalogue</span>
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              style={{ backgroundColor: "rgba(26,26,26,0.06)" }}
            >
              <ArrowUpRight className="w-4 h-4" strokeWidth={1.5} />
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default BrandHeader;
