import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://piecestrottinettes.fr";

const STATIC_PAGES = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/catalogue", priority: "0.9", changefreq: "daily" },
  { path: "/scooters", priority: "0.9", changefreq: "weekly" },
  { path: "/tutos", priority: "0.8", changefreq: "weekly" },
  { path: "/pepites", priority: "0.7", changefreq: "weekly" },
  { path: "/contact", priority: "0.5", changefreq: "monthly" },
  { path: "/cgv", priority: "0.3", changefreq: "yearly" },
  { path: "/mentions-legales", priority: "0.3", changefreq: "yearly" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch parts and scooter models in parallel
    const [partsRes, scootersRes] = await Promise.all([
      supabase.from("parts").select("slug, updated_at"),
      supabase.from("scooter_models").select("slug, created_at").eq("published", true).order("created_at", { ascending: false }),
    ]);

    const parts = partsRes.data || [];
    const scooters = scootersRes.data || [];

    const today = new Date().toISOString().split("T")[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    // Static pages
    for (const page of STATIC_PAGES) {
      xml += `  <url>
    <loc>${SITE_URL}${page.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
    }

    // Dynamic part pages
    for (const part of parts) {
      const lastmod = part.updated_at ? part.updated_at.split("T")[0] : today;
      xml += `  <url>
    <loc>${SITE_URL}/pieces/${part.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
    }

    // Dynamic scooter pages
    for (const scooter of scooters) {
      const lastmod = scooter.created_at ? scooter.created_at.split("T")[0] : today;
      xml += `  <url>
    <loc>${SITE_URL}/scooters/${scooter.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
    }

    xml += `</urlset>`;

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return new Response("Internal Server Error", { status: 500, headers: corsHeaders });
  }
});
