import { useSearchParams } from "react-router-dom";
import SEO from "@/components/SEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BrandWallSection from "@/components/home/BrandWallSection";
import AtelierBrands from "@/components/listing/AtelierBrands";

const Brands = () => {
  // 17/10 : maquette « Atelier » (même squelette que /catalogue) sur ?vue=atelier ; sans paramètre, page actuelle.
  const [sp] = useSearchParams();
  const atelier = sp.get("vue") === "atelier";
  return (
    <div className="min-h-screen" style={{ backgroundColor: atelier ? "#FAFAF8" : "#F5F0E8" }}>
      <SEO
        title="Toutes les marques de trottinettes électriques | piècestrottinettes.fr"
        description="Découvre toutes les marques de trottinettes électriques et leurs pièces 100 % compatibles."
        canonical="https://piecestrottinettes.fr/marques"
      />
      <Header />
      <main className="pt-16 lg:pt-20 pb-24 md:pb-0">
        {atelier ? <AtelierBrands /> : <BrandWallSection limited={false} />}
        <Footer />
      </main>
    </div>
  );
};

export default Brands;
