import { useState, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface ScooterSearchSelectProps {
  onSelect: (modelId: string, modelName: string) => void;
}

interface ScooterResult {
  id: string;
  name: string;
  brand_name: string;
}

const ScooterSearchSelect = ({ onSelect }: ScooterSearchSelectProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ScooterResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from("scooter_models")
          .select("id, name, brand:brands!scooter_models_brand_id_fkey(name)")
          .eq("published", true)
          .or(`name.ilike.%${query}%,search_terms.ilike.%${query}%`)
          .limit(8);

        if (data) {
          setResults(
            data.map((d: any) => ({
              id: d.id,
              name: d.name,
              brand_name: (d.brand as any)?.name || "",
            }))
          );
        }
      } catch (e) {
        console.error("Search error:", e);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un modèle..."
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-white/30 text-sm font-display focus:outline-none focus:border-white/30 transition-colors"
          autoFocus
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 animate-spin" />
        )}
      </div>

      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="max-h-48 overflow-y-auto rounded-xl bg-white/10 backdrop-blur-xl border border-white/10 divide-y divide-white/5"
          >
            {results.map((r) => (
              <motion.button
                key={r.id}
                whileHover={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                onClick={() => onSelect(r.id, `${r.brand_name} ${r.name}`)}
                className="w-full text-left px-4 py-3 transition-colors"
              >
                <span className="text-white/40 text-xs">{r.brand_name}</span>
                <span className="block text-white text-sm font-display">{r.name}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {query.length >= 2 && !loading && results.length === 0 && (
        <p className="text-white/30 text-xs text-center py-2">
          Aucun modèle trouvé
        </p>
      )}
    </div>
  );
};

export default ScooterSearchSelect;
