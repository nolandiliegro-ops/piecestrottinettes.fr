// Lance le backfill compatible_parts_count (EF backfill-compatible-parts-count).
// Lit ADMIN_BULK_SECRET depuis .env — ne l'affiche JAMAIS.
// Usage : node scripts/_run-backfill-count.mjs
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.trimStart().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    }),
);

const secret = env.ADMIN_BULK_SECRET;
if (!secret) {
  console.error("ADMIN_BULK_SECRET absent du .env");
  process.exit(1);
}

const res = await fetch(
  "https://kqsxscjtlipregkrmucg.supabase.co/functions/v1/backfill-compatible-parts-count",
  {
    method: "POST",
    headers: { "x-admin-secret": secret, "Content-Type": "application/json" },
  },
);

const body = await res.json();
if (!res.ok || !body.success) {
  console.error(`HTTP ${res.status}:`, JSON.stringify(body));
  process.exit(1);
}

console.log(
  `OK — ${body.scooters_updated}/${body.scooters_total} trottes corrigées, total_corrections=${body.total_corrections}`,
);
for (const r of body.before_after) {
  const sign = r.diff >= 0 ? "+" : "";
  console.log(`  ${r.name} (${r.slug}) : ${r.old_count} → ${r.new_count} (${sign}${r.diff})`);
}
if (body.errors?.length) {
  console.log("ERREURS :");
  for (const e of body.errors) console.log(`  ${e.slug} : ${e.error}`);
}
