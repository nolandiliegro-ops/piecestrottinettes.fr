import SEO from "@/components/SEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BrandWallSection from "@/components/home/BrandWallSection";

const Brands = () => (
  <div className="min-h-screen" style={{ backgroundColor: "#F5F0E8" }}>
    <SEO
      title="Toutes les marques de trottinettes électriques | piècestrottinettes.fr"
      description="Découvre toutes les marques de trottinettes électriques et leurs pièces 100 % compatibles."
      canonical="https://piecestrottinettes.fr/marques"
    />
    <Header />
    <main className="pt-16 lg:pt-20 pb-24 md:pb-0">
      <BrandWallSection limited={false} />
      <Footer />
    </main>
  </div>
);

export default Brands;
