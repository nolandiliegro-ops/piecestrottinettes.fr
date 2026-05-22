import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useBrandAsset } from "@/hooks/useBrandAssets";

const FONT = "'Plus Jakarta Sans', sans-serif";

// Minimal floating header for the editorial brand page.
// Transparent at top → frosted glass on scroll (backdrop-blur only here, never on scrolling content).
const BrandHeader = () => {
  const logo = useBrandAsset("logo_main_light");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
        <div className="flex items-center justify-between h-16 lg:h-20">
          <Link
            to="/"
            aria-label="Accueil piècestrottinettes"
            className="flex items-center hover:opacity-90 transition-opacity"
          >
            <img src={logo.url} alt={logo.alt} className="h-10 sm:h-12 lg:h-14 w-auto object-contain" />
          </Link>

          <Link
            to="/catalogue"
            aria-label="Voir le catalogue"
            className="group inline-flex items-center gap-2 min-h-[44px] pl-4 pr-2 rounded-full border transition-colors"
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
