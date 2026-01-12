import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import GarageScooterCarousel from '@/components/garage/GarageScooterCarousel';
import ProductsUsed from '@/components/garage/ProductsUsed';
import MaintenanceLog from '@/components/garage/MaintenanceLog';
import PerformanceWidget from '@/components/garage/PerformanceWidget';
import { useGarageScooters } from '@/hooks/useGarageScooters';
import { useCompatibleParts } from '@/hooks/useCompatibleParts';

const Garage = () => {
  const { profile, loading: authLoading } = useAuth();
  const { scooters, loading: scootersLoading } = useGarageScooters();
  const [selectedScooter, setSelectedScooter] = useState<any>(null);
  
  // Fetch compatible parts for selected scooter
  const { parts, loading: partsLoading } = useCompatibleParts(
    selectedScooter?.scooter_model?.id
  );

  // Set initial selected scooter when scooters load
  useEffect(() => {
    if (scooters && scooters.length > 0 && !selectedScooter) {
      setSelectedScooter(scooters[0]);
    }
  }, [scooters, selectedScooter]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-greige flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-mineral" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-greige">
      <Header />
      
      <main className="pt-20 lg:pt-24 px-4 lg:px-8 pb-8">
        <div className="container mx-auto max-w-7xl">
          
          {/* Welcome Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="font-display text-4xl lg:text-5xl text-carbon tracking-wide mb-2">
              MON GARAGE
            </h1>
            <p className="text-carbon/60 text-lg">
              Bienvenue, <span className="text-mineral font-medium">{profile?.display_name || 'Rider'}</span>
            </p>
          </motion.div>

          {/* Performance Widget - Top */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-8"
          >
            <PerformanceWidget 
              points={profile?.performance_points || 0}
              displayName={profile?.display_name || 'Rider'}
            />
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Carousel (2 columns) */}
            <div className="lg:col-span-2 space-y-8">
              {/* Scooter Carousel */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {scootersLoading ? (
                  <div className="flex items-center justify-center h-96 bg-white/40 rounded-2xl">
                    <Loader2 className="w-8 h-8 animate-spin text-mineral" />
                  </div>
                ) : (
                  <GarageScooterCarousel 
                    scooters={scooters || []}
                    onScooterChange={setSelectedScooter}
                  />
                )}
              </motion.div>

              {/* Products Used Section */}
              {selectedScooter && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <ProductsUsed
                    scooterId={selectedScooter.id}
                    scooterName={selectedScooter.nickname || `${selectedScooter.scooter_model.brand} ${selectedScooter.scooter_model.name}`}
                    parts={parts || []}
                    loading={partsLoading}
                  />
                </motion.div>
              )}
            </div>

            {/* Right Column: Maintenance (1 column) */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="sticky top-24"
              >
                <MaintenanceLog scooters={scooters || []} />
              </motion.div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
};

export default Garage;
