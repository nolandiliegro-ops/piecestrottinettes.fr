import { Link } from "react-router-dom";
import logoImage from "@/assets/logo-pt.png";

const Footer = () => {
  return (
    <footer className="bg-carbon py-12 mt-auto">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Logo */}
        <div className="mb-8">
          <img 
            src={logoImage}
            alt="piècestrottinettes.FR"
            className="h-10 w-auto brightness-0 invert opacity-90"
          />
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-10">
          <div>
            <h4 className="font-display text-sm tracking-wider text-white/90 mb-4">CATALOGUE</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/catalogue" className="text-white/60 hover:text-white transition-colors text-sm">
                Pièces Détachées
              </Link>
              <Link to="/catalogue" className="text-white/60 hover:text-white transition-colors text-sm">
                Par Marque
              </Link>
              <Link to="/catalogue" className="text-white/60 hover:text-white transition-colors text-sm">
                Par Catégorie
              </Link>
            </nav>
          </div>

          <div>
            <h4 className="font-display text-sm tracking-wider text-white/90 mb-4">MON COMPTE</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/garage" className="text-white/60 hover:text-white transition-colors text-sm">
                Mon Garage
              </Link>
              <Link to="/login" className="text-white/60 hover:text-white transition-colors text-sm">
                Connexion
              </Link>
              <Link to="/register" className="text-white/60 hover:text-white transition-colors text-sm">
                Créer un compte
              </Link>
            </nav>
          </div>

          <div>
            <h4 className="font-display text-sm tracking-wider text-white/90 mb-4">RESSOURCES</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/tutos" className="text-white/60 hover:text-white transition-colors text-sm">
                Tutoriels
              </Link>
              <Link to="/pepites" className="text-white/60 hover:text-white transition-colors text-sm">
                Les Pépites
              </Link>
            </nav>
          </div>

          <div>
            <h4 className="font-display text-sm tracking-wider text-white/90 mb-4">CONTACT</h4>
            <nav className="flex flex-col gap-2">
              <a href="mailto:contact@piecestrottinettes.fr" className="text-white/60 hover:text-white transition-colors text-sm">
                contact@piecestrottinettes.fr
              </a>
              <Link to="/contact" className="text-white/60 hover:text-white transition-colors text-sm">
                Formulaire de contact
              </Link>
            </nav>
          </div>

          <div>
            <h4 className="font-display text-sm tracking-wider text-white/90 mb-4">LÉGAL</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/cgv" className="text-white/60 hover:text-white transition-colors text-sm">
                Conditions Générales de Vente
              </Link>
              <Link to="/mentions-legales" className="text-white/60 hover:text-white transition-colors text-sm">
                Mentions Légales
              </Link>
            </nav>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Slogan */}
            <p className="font-display text-lg tracking-widest text-mineral">
              ROULE · RÉPARE · DURE
            </p>

            {/* Copyright + Legal Links */}
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-sm">
              <p className="text-white/40">
                © 2026 piècestrottinettes.FR — Tous droits réservés
              </p>
              <span className="hidden sm:inline text-white/20">|</span>
              <div className="flex gap-3">
                <Link to="/cgv" className="text-white/40 hover:text-white/70 transition-colors">
                  CGV
                </Link>
                <Link to="/mentions-legales" className="text-white/40 hover:text-white/70 transition-colors">
                  Mentions légales
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
