// Rendu des propositions visuelles (24/10/2026) : captures téléphone + ordinateur du build de la branche,
// contre la vraie base (lecture publique). Lancé par .github/workflows/rendu-propositions.yml.
// Usage : node scripts/rendu-propositions.mjs config/rendu/<lot>.json out/<lot>
import { readFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(process.env.PW_REQUIRE || import.meta.url);
const { chromium } = require("playwright");

const [cfgPath, outDir] = process.argv.slice(2);
const cfg = JSON.parse(readFileSync(cfgPath, "utf8"));
mkdirSync(outDir, { recursive: true });
const base = cfg.base || "http://127.0.0.1:4173";
const sizes = { tel: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, pc: { width: 1280, height: 900, deviceScaleFactor: 1 } };

const browser = await chromium.launch();
let ok = 0;
for (const shot of cfg.shots) {
  for (const sz of shot.sizes || ["tel", "pc"]) {
    const ctx = await browser.newContext({ viewport: { width: sizes[sz].width, height: sizes[sz].height }, deviceScaleFactor: sizes[sz].deviceScaleFactor, isMobile: !!sizes[sz].isMobile, hasTouch: !!sizes[sz].hasTouch, locale: "fr-FR" });
    await ctx.addInitScript(() => { try { sessionStorage.setItem("pt-prelaunch-seen", "1"); localStorage.setItem("pt-prelaunch-seen", "1"); } catch (e) { /* ignore */ } });
    const page = await ctx.newPage();
    try {
      await page.goto(base + shot.path, { waitUntil: "networkidle", timeout: 60000 });
      await page.waitForTimeout(1500);
      // Images paresseuses : on les force et on fait défiler une fois.
      await page.evaluate(async () => {
        document.querySelectorAll("img[loading=lazy]").forEach((i) => i.setAttribute("loading", "eager"));
        for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
        window.scrollTo(0, 0);
      });
      if (shot.scrollTo) {
        await page.evaluate(({ sel, off }) => { const el = document.querySelector(sel); if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY + off); }, { sel: shot.scrollTo, off: shot.offset ?? -90 });
      }
      await page.waitForTimeout(1800);
      await page.screenshot({ path: `${outDir}/${shot.name}-${sz}.jpg`, type: "jpeg", quality: 80 });
      ok++;
    } catch (e) {
      console.log(`::warning title=${shot.name}-${sz}::${String(e).slice(0, 200)}`);
    }
    await ctx.close();
  }
}
await browser.close();
console.log(`::notice title=rendu::${ok} captures`);
