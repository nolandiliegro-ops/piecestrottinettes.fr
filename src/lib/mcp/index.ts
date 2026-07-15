import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchParts from "./tools/search-parts";
import getPart from "./tools/get-part";
import listMyOrders from "./tools/list-my-orders";
import listMyGarage from "./tools/list-my-garage";

// Direct supabase.co issuer (never the .lovable.cloud proxy). Built at build time
// from VITE_SUPABASE_PROJECT_ID; fallback keeps the manifest-extract eval safe.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "piecestrottinettes-mcp",
  title: "Pièces Trottinettes MCP",
  version: "0.1.0",
  instructions:
    "Outils Pièces Trottinettes : rechercher des pièces détachées de trottinettes électriques, consulter le catalogue, et pour l'utilisateur connecté ses commandes et son garage.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [searchParts, getPart, listMyOrders, listMyGarage],
});
