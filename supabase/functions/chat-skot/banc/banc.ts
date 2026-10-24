// Banc d'essai + mine de nuit de SKOT — skill skot-amelioration-continue (24/10/2026).
// - runBanc : rejoue le corpus (cas.ts) dans la VRAIE chaîne (vrais outils, vraie base, vrai modèle), sans écriture réelle
//   (escalade simulée, aucun anti-spam : ip_hash null), puis vérifie chaque réponse par code ET par un juge (Haiku).
// - runNuit : une fois par jour (index unique en base), banc complet + lecture des conversations réelles des dernières 26 h
//   → signaux dans skot_flags.
// Les messages du banc sont stockés avec page_type = 'banc' : exclus du plafond journalier, de la mine et des mesures de coût.
import { CORPUS, type CasSkot } from "./cas.ts";

const JUDGE_MODEL = "claude-haiku-5-5";
const CONCURRENCY = 3;
const MAX_JUDGED_CONVERSATIONS = 12;

type Db = any;
interface Deps {
  db: Db;
  apiKey: string;
  converse: (inp: any) => Promise<any>;
  callClaude: (apiKey: string, payload: Record<string, unknown>) => Promise<any>;
  version: string;
  judgeRules: string;
}

const countWords = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
/** Réponse coupée : se termine sur une lettre, un chiffre ou une virgule (pas de ponctuation finale, pas d'emoji). */
export const looksCut = (s: string) => /[\p{L}\p{N},;:'’-]$/u.test(s.trim());

async function pool<T, R>(items: T[], n: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k]); }
  }));
  return out;
}

function checkAssertions(c: CasSkot, r: any): string[] {
  const fails: string[] = [];
  const reply: string = r.reply ?? "";
  const rx = (p: string) => new RegExp(p, "iu");
  const a = c.attendu;
  for (const p of a.doit ?? []) if (!rx(p).test(reply)) fails.push(`doit contenir /${p}/`);
  if (a.un_de?.length && !a.un_de.some((p) => rx(p).test(reply))) fails.push(`doit contenir l'un de ${a.un_de.map((p) => `/${p}/`).join(" ")}`);
  for (const p of a.ne_doit_pas ?? []) { const m = reply.match(rx(p)); if (m) fails.push(`interdit /${p}/ → « ${m[0]} »`); }
  const cards: any[] = r.cards ?? [];
  if (a.cartes === "aucune" && cards.length) fails.push(`0 carte attendue, ${cards.length} affichée(s)`);
  if (a.cartes === "avec" && !cards.length) fails.push("au moins 1 carte attendue");
  if (a.cartes === "verified" && (!cards.length || cards.some((x) => x.compat !== "verified"))) fails.push(`cartes ✓ attendues : ${cards.map((x) => x.compat ?? "sans statut").join(",") || "aucune"}`);
  if (a.cartes === "unverified" && (!cards.length || cards.some((x) => x.compat === "verified") || cards.some((x) => !x.compat))) fails.push(`cartes ◐ attendues : ${cards.map((x) => x.compat ?? "sans statut").join(",") || "aucune"}`);
  const used = new Set((r.toolLog ?? []).map((t: any) => t.name));
  for (const t of a.outil ?? []) if (!used.has(t)) fails.push(`outil ${t} non appelé`);
  for (const t of a.outil_interdit ?? []) if (used.has(t)) fails.push(`outil ${t} appelé à tort`);
  if (a.escalade === true && !r.escalated) fails.push("escalade attendue, non faite");
  if (a.escalade === false && r.escalated) fails.push("escalade faite à tort");
  const max = a.mots_max ?? 140;
  if (countWords(reply) > max) fails.push(`trop long : ${countWords(reply)} mots > ${max}`);
  if (looksCut(reply)) fails.push("réponse coupée (pas de fin de phrase)");
  if (r.cut) fails.push("réponse coupée à la source (garde-fou appliqué) — voir le log stop_reason");
  return fails;
}

const JUDGE_SYSTEM = (rules: string) => `Tu es le contrôleur qualité de SKOT, l'assistant client d'une boutique de pièces de trottinettes.
Voici SES consignes complètes (persona, RÈGLES ABSOLUES numérotées, FICHE BOUTIQUE) :
<<<
${rules}
>>>
On te donne une conversation, et pour la dernière réponse les résultats bruts des outils qu'il a consultés.
Signale UNIQUEMENT les violations nettes et vérifiables : une règle absolue enfreinte, une information contraire à la FICHE BOUTIQUE ou aux résultats d'outils, une compatibilité affirmée sans statut "verified", une invention (prix, délai, garantie, caractéristique absente des outils), une promesse d'action qu'il ne peut pas faire.
Le ton, le style, les vannes et l'ordre des infos ne sont PAS des violations. Dans le doute, ce n'est pas une violation.
Sont CONFORMES (ne jamais les signaler) : répondre en français à un client qui écrit dans une autre langue ; donner le prix d'une pièce citée ; demander au client de confirmer son modèle exact ; proposer l'atelier ; une formule générique « vérifie le numéro et l'email » quand une commande est introuvable.
Cite la règle par son numéro tel qu'écrit dans les consignes, et ne signale une règle que si la citation fautive la contredit directement.
Réponds UNIQUEMENT par un objet JSON, sans texte autour :
{"conforme": true|false, "violations": [{"regle": "numéro de règle ou FICHE ou OUTILS", "citation": "extrait exact fautif (max 120 caractères)", "explication": "une phrase"}]}`;

/** Juge. Un juge illisible n'est JAMAIS compté comme « conforme » : le silence n'est pas un succès (24/10 : 7/26 avis illisibles comptés verts). */
async function judge(d: Deps, transcript: string, toolResults: unknown): Promise<{ conforme: boolean; violations: any[]; tokens: number; error?: string; brut?: string }> {
  let tokens = 0, brut = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const r = await d.callClaude(d.apiKey, {
      model: JUDGE_MODEL,
      max_tokens: 1500,
      system: [{ type: "text", text: JUDGE_SYSTEM(d.judgeRules), cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: `CONVERSATION :\n${transcript}\n\nRÉSULTATS D'OUTILS (dernière réponse, tronqués) :\n${JSON.stringify(toolResults ?? []).slice(0, 4000)}\n\nRappel : réponds UNIQUEMENT par l'objet JSON, explications d'une phrase.` }],
    });
    if (!r.ok) return { conforme: false, violations: [], tokens, error: `juge HTTP ${r.status}` };
    tokens += (r.out.usage?.input_tokens ?? 0) + (r.out.usage?.cache_read_input_tokens ?? 0) + (r.out.usage?.cache_creation_input_tokens ?? 0) + (r.out.usage?.output_tokens ?? 0);
    brut = (r.out.content ?? []).filter((c: any) => c.type === "text").map((c: any) => c.text).join("");
    const j = parseJudge(brut);
    if (j) {
      const violations = Array.isArray(j.violations) ? j.violations.slice(0, 5) : [];
      return { conforme: j.conforme !== false && !violations.length, violations, tokens };
    }
  }
  return { conforme: false, violations: [], tokens, error: "juge : JSON illisible", brut: brut.slice(0, 400) };
}

/** Extrait l'objet JSON d'une réponse (bloc ```json, texte autour, accolades équilibrées). */
export function parseJudge(text: string): any | null {
  const t = text.replace(/```(?:json)?/gi, "");
  const start = t.indexOf("{");
  if (start < 0) return null;
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < t.length; i++) {
    const ch = t[i];
    if (inStr) { if (esc) esc = false; else if (ch === "\\") esc = true; else if (ch === '"') inStr = false; continue; }
    if (ch === '"') inStr = true;
    else if (ch === "{") depth++;
    else if (ch === "}") { depth--; if (depth === 0) { try { return JSON.parse(t.slice(start, i + 1)); } catch { return null; } } }
  }
  return null;
}

async function resolveAdmin(db: Db) {
  const { data } = await db.from("user_roles").select("user_id").eq("role", "admin").limit(1).maybeSingle();
  if (!data?.user_id) return null;
  const { data: u } = await db.auth.admin.getUserById(data.user_id);
  return { id: data.user_id as string, email: (u?.user?.email ?? null) as string | null };
}

async function playCase(d: Deps, c: CasSkot, admin: { id: string; email: string | null } | null) {
  const conversationId = crypto.randomUUID();
  const userId = c.connecte ? admin?.id ?? null : null;
  const userEmail = c.connecte ? admin?.email ?? null : null;
  const t0 = Date.now();
  await d.db.from("skot_messages").insert({ conversation_id: conversationId, role: "user", content: c.message, user_id: userId, page_type: "banc", page_slug: c.id });
  const r = await d.converse({ db: d.db, apiKey: d.apiKey, message: c.message, page: c.page ? { type: c.page.type, slug: c.page.slug ?? "" } : undefined,
    conversationId, history: [], userId, userEmail, ipHash: null, ip: "", dryRun: true });
  const ms = Date.now() - t0;
  await d.db.from("skot_messages").insert({ conversation_id: conversationId, role: "assistant", content: String(r.reply).slice(0, 6000), user_id: userId,
    tool_calls: r.toolLog?.length ? r.toolLog : null, page_type: "banc", page_slug: c.id, escalated: !!r.escalated,
    tokens_in: (r.tokensIn ?? 0) + (r.cacheRead ?? 0) + (r.cacheWrite ?? 0), tokens_out: r.tokensOut ?? 0, tokens_cache_read: r.cacheRead ?? 0, tokens_cache_write: r.cacheWrite ?? 0,
    model: r.ok ? "banc" : `fallback:${r.error}` });
  const fails = r.ok ? checkAssertions(c, r) : [`erreur ${r.error}`];
  const j = r.ok ? await judge(d, `CLIENT : ${c.message}${c.page ? `\n(page : ${c.page.type} ${c.page.slug ?? ""})` : ""}\nSKOT : ${r.reply}\n(cartes affichées : ${(r.cards ?? []).map((x: any) => `${x.name} [${x.compat ?? "sans statut"}]`).join(" ; ") || "aucune"})`, r.toolResults)
    : { conforme: false, violations: [], tokens: 0 };
  return {
    id: c.id, origine: c.origine, vert: !fails.length && j.conforme, fails, juge: j.violations, juge_erreur: (j as any).error ?? null, juge_brut: (j as any).brut ?? null,
    reponse: String(r.reply).slice(0, 700), cartes: (r.cards ?? []).map((x: any) => `${x.name} [${x.compat ?? "-"}]`), outils: (r.toolLog ?? []).map((t: any) => t.name),
    ms, tokens: (r.tokensIn ?? 0) + (r.cacheRead ?? 0) + (r.cacheWrite ?? 0) + (r.tokensOut ?? 0) + j.tokens, error: r.ok ? null : r.error,
  };
}

async function playCorpus(d: Deps, admin: any, ids: string[] | null) {
  const cases = CORPUS.filter((c) => !c.retire && (!ids || ids.includes(c.id)));
  const results = await pool(cases, CONCURRENCY, (c) => playCase(d, c, admin));
  return {
    n_cas: results.length,
    n_vert: results.filter((x) => x.vert).length,
    n_rouge: results.filter((x) => !x.vert).length,
    n_juge_rouge: results.filter((x) => x.juge?.length || x.juge_erreur).length,
    tokens: results.reduce((s, x) => s + (x.tokens ?? 0), 0),
    upstream: results.filter((x) => x.error === "UPSTREAM").length,
    results,
  };
}

export async function runBanc(d: Deps & { admin: { id: string; email: string | null }; ids: string[] | null; kind: "banc" }) {
  const { data: run, error } = await d.db.from("skot_eval_runs").insert({ kind: "banc", version: d.version }).select("id").single();
  if (error) return { ok: false, error: `run: ${error.message}` };
  const b = await playCorpus(d, d.admin, d.ids);
  await d.db.from("skot_eval_runs").update({ finished_at: new Date().toISOString(), n_cas: b.n_cas, n_vert: b.n_vert, n_rouge: b.n_rouge, n_juge_rouge: b.n_juge_rouge, tokens: b.tokens, detail: { banc: b.results } }).eq("id", run.id);
  return { ok: true, run_id: run.id, version: d.version, n_cas: b.n_cas, n_vert: b.n_vert, n_rouge: b.n_rouge, n_juge_rouge: b.n_juge_rouge, tokens: b.tokens, upstream: b.upstream, rouges: b.results.filter((x) => !x.vert), verts: b.results.filter((x) => x.vert).map((x) => x.id) };
}

// ───────────────────────── Nuit : banc + mine des vraies conversations ─────────────────────────
export async function runNuit(d: Deps) {
  const today = new Date().toISOString().slice(0, 10);
  const { data: run, error } = await d.db.from("skot_eval_runs").insert({ kind: "nuit", run_day: today, version: d.version }).select("id").single();
  if (error) return { ok: false, error: /duplicate|unique/i.test(error.message) ? "ALREADY_DONE" : `run: ${error.message}` };

  const admin = await resolveAdmin(d.db);
  const b = await playCorpus(d, admin, null);

  // Mine : réponses réelles des 26 dernières heures (hors banc)
  const since = new Date(Date.now() - 26 * 3600_000).toISOString();
  const { data: rows } = await d.db.from("skot_messages")
    .select("id, conversation_id, role, content, model, feedback, escalated, page_type, created_at")
    .gte("created_at", since).order("created_at", { ascending: true }).limit(3000);
  const real = (rows ?? []).filter((m: any) => m.page_type !== "banc" && m.model !== "banc");
  const bancConvs = new Set((rows ?? []).filter((m: any) => m.page_type === "banc").map((m: any) => m.conversation_id));
  const msgs = real.filter((m: any) => !bancConvs.has(m.conversation_id));
  const flags: any[] = [];
  for (const m of msgs.filter((x: any) => x.role === "assistant")) {
    const base = { conversation_id: m.conversation_id, message_id: m.id, source: "detecteur", extrait: String(m.content).slice(0, 300) };
    if (String(m.model ?? "").startsWith("fallback:")) flags.push({ ...base, type: `repli_${String(m.model).slice(9).toLowerCase()}` });
    else if (looksCut(String(m.content))) flags.push({ ...base, type: "reponse_coupee" });
    if (countWords(String(m.content)) > 170) flags.push({ ...base, type: "trop_long" });
    if (m.escalated) flags.push({ ...base, type: "escalade" });
    if (m.feedback === -1) flags.push({ ...base, type: "client_pouce_bas", source: "client" });
  }
  // Juge : conversations signalées (hors simple escalade) d'abord, puis un échantillon des autres
  const byConv = new Map<string, any[]>();
  for (const m of msgs) { if (!byConv.has(m.conversation_id)) byConv.set(m.conversation_id, []); byConv.get(m.conversation_id)!.push(m); }
  const flagged = new Set(flags.filter((f) => f.type !== "escalade").map((f) => f.conversation_id));
  const others = [...byConv.keys()].filter((k) => !flagged.has(k)).sort(() => Math.random() - 0.5);
  const toJudge = [...flagged, ...others].slice(0, MAX_JUDGED_CONVERSATIONS);
  let judgeTokens = 0;
  await pool(toJudge, CONCURRENCY, async (conv) => {
    const ms = byConv.get(conv) ?? [];
    const last = [...ms].reverse().find((m: any) => m.role === "assistant");
    if (!last) return;
    const transcript = ms.map((m: any) => `${m.role === "user" ? "CLIENT" : "SKOT"} : ${m.content}`).join("\n");
    const j = await judge(d, transcript, "(non conservés pour les conversations réelles : juge sur le texte seul)");
    judgeTokens += j.tokens;
    for (const v of j.violations) flags.push({ conversation_id: conv, message_id: last.id, source: "juge", type: `regle_${String(v.regle ?? "?").toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 30)}`, extrait: `${String(v.citation ?? "").slice(0, 160)} — ${String(v.explication ?? "").slice(0, 200)}` });
  });
  if (flags.length) await d.db.from("skot_flags").upsert(flags, { onConflict: "message_id,type", ignoreDuplicates: true });

  const parType: Record<string, number> = {};
  for (const f of flags) parType[f.type] = (parType[f.type] ?? 0) + 1;
  const mine = { conversations: byConv.size, reponses: msgs.filter((x: any) => x.role === "assistant").length, jugees: toJudge.length, flags: flags.length, par_type: parType };
  await d.db.from("skot_eval_runs").update({
    finished_at: new Date().toISOString(), n_cas: b.n_cas, n_vert: b.n_vert, n_rouge: b.n_rouge, n_juge_rouge: b.n_juge_rouge,
    tokens: b.tokens + judgeTokens, detail: { banc: b.results, mine, upstream: b.upstream },
  }).eq("id", run.id);
  return { ok: true, run_id: run.id, n_cas: b.n_cas, n_vert: b.n_vert, n_rouge: b.n_rouge, mine };
}
