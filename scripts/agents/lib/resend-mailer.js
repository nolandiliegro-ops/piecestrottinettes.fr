/**
 * Le Veilleur — Mailer Resend (rapport hebdomadaire)
 * Envoyé à admin@ndl-agency.com via la passerelle Lovable.
 */

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/resend';
const ADMIN_EMAIL = 'admin@ndl-agency.com';

export async function sendWatcherReport({ runId, stats, scooters, parts, errors, durationSec }) {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  if (!lovableKey || !resendKey) {
    console.warn('[mailer] LOVABLE_API_KEY ou RESEND_API_KEY manquant — email non envoyé');
    return { sent: false, reason: 'missing_keys' };
  }

  const subject = `🦅 Le Veilleur — ${stats.scooters_inserted} trottinettes / ${stats.parts_inserted} pièces ajoutées`;
  const adminLink = 'https://piecestrottinettes.fr/admin?tab=bot-import';

  const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,Helvetica,Arial,sans-serif;background:#f5f0e8;margin:0;padding:24px;color:#1a1a1a">
  <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:16px;padding:32px;box-shadow:0 4px 20px rgba(0,0,0,0.06)">
    <h1 style="margin:0 0 8px;font-size:24px;color:#4A7C59">🦅 Le Veilleur — Rapport hebdomadaire</h1>
    <p style="color:#6B7280;margin:0 0 24px">Run #${String(runId).slice(0,8)} • ${new Date().toLocaleString('fr-FR')} • ${durationSec}s</p>

    <h2 style="font-size:18px;margin:24px 0 12px">📊 KPIs</h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td style="padding:6px 0;color:#6B7280">Trottinettes trouvées</td><td style="text-align:right;font-weight:600">${stats.scooters_found}</td></tr>
      <tr><td style="padding:6px 0;color:#6B7280">Trottinettes insérées (pending)</td><td style="text-align:right;font-weight:600;color:#4A7C59">${stats.scooters_inserted}</td></tr>
      <tr><td style="padding:6px 0;color:#6B7280">Trottinettes skipped (doublon/score)</td><td style="text-align:right">${stats.scooters_skipped}</td></tr>
      <tr><td style="padding:6px 0;color:#6B7280">Pièces trouvées</td><td style="text-align:right;font-weight:600">${stats.parts_found}</td></tr>
      <tr><td style="padding:6px 0;color:#6B7280">Pièces insérées (pending)</td><td style="text-align:right;font-weight:600;color:#4A7C59">${stats.parts_inserted}</td></tr>
      <tr><td style="padding:6px 0;color:#6B7280">Pièces skipped</td><td style="text-align:right">${stats.parts_skipped}</td></tr>
      <tr><td style="padding:6px 0;color:#6B7280">Erreurs</td><td style="text-align:right;color:${stats.errors_count > 0 ? '#dc2626' : '#6B7280'}">${stats.errors_count}</td></tr>
    </table>

    ${scooters.length > 0 ? `
    <h2 style="font-size:18px;margin:24px 0 12px">🛴 Nouvelles trottinettes (top 10)</h2>
    <ul style="padding-left:20px;font-size:14px;line-height:1.6">
      ${scooters.slice(0, 10).map((s) => `<li><strong>${s.brand} ${s.name}</strong> — score ${s.score}/100</li>`).join('')}
    </ul>` : ''}

    ${parts.length > 0 ? `
    <h2 style="font-size:18px;margin:24px 0 12px">🔧 Nouvelles pièces (top 10)</h2>
    <ul style="padding-left:20px;font-size:14px;line-height:1.6">
      ${parts.slice(0, 10).map((p) => `<li><strong>${p.name}</strong> ${p.brand ? `— ${p.brand}` : ''} (${p.supplier}) — score ${p.score}/100</li>`).join('')}
    </ul>` : ''}

    ${errors.length > 0 ? `
    <h2 style="font-size:18px;margin:24px 0 12px;color:#dc2626">⚠️ Erreurs</h2>
    <ul style="padding-left:20px;font-size:13px;line-height:1.6;color:#991b1b">
      ${errors.slice(0, 20).map((e) => `<li>${e}</li>`).join('')}
    </ul>` : ''}

    <div style="margin-top:32px;text-align:center">
      <a href="${adminLink}" style="display:inline-block;background:#4A7C59;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600">Valider dans Bot Import →</a>
    </div>

    <p style="margin-top:32px;font-size:12px;color:#9ca3af;text-align:center">Le Veilleur — Agent autonome de veille hebdomadaire piecestrottinettes.fr</p>
  </div>
</body></html>`;

  const res = await fetch(`${GATEWAY_URL}/emails`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${lovableKey}`,
      'X-Connection-Api-Key': resendKey,
    },
    body: JSON.stringify({
      from: 'Le Veilleur <onboarding@resend.dev>',
      to: [ADMIN_EMAIL],
      subject,
      html,
    }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('[mailer] Resend error:', res.status, json);
    return { sent: false, reason: `resend_${res.status}`, detail: json };
  }
  return { sent: true, id: json.id };
}
