import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useBrandAsset } from "@/hooks/useBrandAssets";

const ShowroomHeader = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Retour */}
          <button
            type="button"
            onClick={handleBack}
            aria-label="Retour"
            className="inline-flex items-center gap-1.5 min-h-[44px] px-2 -ml-2 rounded-lg transition-colors"
            style={{ color: "#1A1A1A", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
            <span className="hidden sm:inline text-sm font-bold uppercase tracking-wider">
              Retour
            </span>
          </button>

          {/* Logo */}
          <Link
            to="/"
            aria-label="Accueil piècestrottinettes"
            className="flex items-center hover:opacity-90 transition-opacity"
          >
            <img
              src={logo.url}
              alt={logo.alt}
              className="h-12 sm:h-14 lg:h-16 w-auto object-contain"
            />
          </Link>

          {/* Mon Garage */}
          <button
            type="button"
            onClick={handleGarage}
            aria-label="Mon Garage"
            className="inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-full border transition-colors"
            style={{
              color: "#1A1A1A",
              borderColor: "rgba(26,26,26,0.15)",
              backgroundColor: "rgba(255,255,255,0.6)",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            <Home className="w-4 h-4" strokeWidth={2.5} />
            <span className="hidden sm:inline text-sm font-bold uppercase tracking-wider">
              Garage
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default ShowroomHeader;
