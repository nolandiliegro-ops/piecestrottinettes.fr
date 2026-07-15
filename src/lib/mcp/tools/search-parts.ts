import { createClient } from "@supabase/supabase-js";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "search_parts",
  title: "Rechercher des pièces",
  description:
    "Recherche des pièces détachées dans le catalogue par nom, marque ou description. Retourne jusqu'à 20 résultats publiés avec prix TTC, stock et lien produit.",
  inputSchema: {
    query: z.string().trim().min(1).describe("Terme de recherche (nom, marque, mot-clé)."),
    limit: z.number().int().min(1).max(20).optional().describe("Nombre max de résultats (défaut 10)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }) => {
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await sb
      .from("parts")
      .select("name, slug, brand, price_ht, stock_quantity, description")
      .eq("published", true)
      .or(`name.ilike.%${query}%,brand.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(limit ?? 10);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const base = "https://piecestrottinettes.fr/piece/";
    const rows = (data ?? []).map((p: any) => ({
      name: p.name,
      brand: p.brand,
      price_ttc: p.price_ht ? Math.round(p.price_ht * 1.2 * 100) / 100 : null,
      in_stock: (p.stock_quantity ?? 0) > 0,
      url: `${base}${p.slug}`,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
      structuredContent: { results: rows },
    };
  },
});
