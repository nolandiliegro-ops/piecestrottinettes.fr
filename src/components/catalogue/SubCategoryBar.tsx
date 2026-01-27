import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface SubCategory {
  id: string;
  name: string;
  slug: string;
}

interface SubCategoryBarProps {
  subCategories: SubCategory[];
  activeSubCategory: string | null;
  onSubCategoryChange: (subCategoryId: string | null) => void;
  parentName?: string;
}

const SubCategoryBar = ({
  subCategories,
  activeSubCategory,
  onSubCategoryChange,
  parentName,
}: SubCategoryBarProps) => {
  if (subCategories.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
        animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden"
      >
        <div className="flex flex-wrap items-center gap-2 py-3 px-4 bg-white/60 backdrop-blur-md rounded-2xl border border-white/30">
          {/* Parent indicator */}
          {parentName && (
            <span className="text-xs font-montserrat font-semibold text-muted-foreground uppercase tracking-wide mr-2">
              {parentName} :
            </span>
          )}

          {/* "Tous" button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.3 }}
            onClick={() => onSubCategoryChange(null)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-montserrat font-medium transition-all duration-300",
              activeSubCategory === null
                ? "bg-mineral text-white shadow-[0_0_16px_rgba(147,181,161,0.5)]"
                : "bg-white/80 text-carbon hover:bg-white hover:shadow-sm border border-white/50"
            )}
          >
            Tous
          </motion.button>

          {/* Sub-category buttons */}
          {subCategories.map((subCat, index) => (
            <motion.button
              key={subCat.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSubCategoryChange(subCat.id)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-montserrat font-medium transition-all duration-300",
                activeSubCategory === subCat.id
                  ? "bg-mineral text-white shadow-[0_0_16px_rgba(147,181,161,0.5)]"
                  : "bg-white/80 text-carbon hover:bg-white hover:shadow-sm border border-white/50"
              )}
            >
              {subCat.name}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SubCategoryBar;
