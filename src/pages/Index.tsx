import { useState, useCallback } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import BentoDiscoverySection from "@/components/BentoDiscoverySection";

const Index = () => {
  const [activeModelSlug, setActiveModelSlug] = useState<string | null>(null);
  const [activeModelName, setActiveModelName] = useState<string | null>(null);

  const handleActiveModelChange = useCallback((slug: string | null, name: string | null) => {
    setActiveModelSlug(slug);
    setActiveModelName(name);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection onActiveModelChange={handleActiveModelChange} />
        <BentoDiscoverySection 
          activeModelSlug={activeModelSlug} 
          activeModelName={activeModelName || undefined}
        />
      </main>
    </div>
  );
};

export default Index;
