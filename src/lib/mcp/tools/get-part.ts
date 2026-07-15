import { createClient } from "@supabase/supabase-js";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "get_part",
  title: "Détails d'une pièce",
  description: "Retourne les détails complets d'une pièce (par slug) : prix TTC, stock, description, marque.",
  inputSchema: {
    slug: z.string().trim().min(1).describe("Slug de la pièce, ex: 'batterie-dualtron-thunder-3'."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ slug }) => {
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await sb
      .from("parts")
      .select("name, slug, brand, price_ht, stock_quantity, description, images")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) return { content: [{ type: "text", text: "Pièce introuvable." }], isError: true };
    const part = {
      name: data.name,
      brand: data.brand,
      price_ttc: data.price_ht ? Math.round(data.price_ht * 1.2 * 100) / 100 : null,
      in_stock: (data.stock_quantity ?? 0) > 0,
      stock_quantity: data.stock_quantity,
      description: data.description,
      url: `https://piecestrottinettes.fr/piece/${data.slug}`,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(part, null, 2) }],
      structuredContent: { part },
    };
  },
});
