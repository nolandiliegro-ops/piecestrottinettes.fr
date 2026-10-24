import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Mail, MessageCircle, ExternalLink, Link2, FileText, Send, StickyNote, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { lienProfil, numeroWhatsApp, MODELES_MESSAGE, remplirModele, STATUTS_JURIDIQUES, SITE_AMB } from '@/lib/ambassadorKit';

/* 24/10/2026 — plateforme créateurs (claude/PT-lot-plateforme-createurs.md) : contact, messages, coordonnées,
   contrat et journal dans la fiche d'un ambassadeur. */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as { from: (t: string) => any; rpc: (f: string, a?: Record<string, unknown>) => any };

export interface FicheRow {
  ambassador_id: string; nom: string; handle: string | null; reseau: string | null; email: string | null; telephone: string | null;
  adresse: string | null; pays_residence: string | null; statut_juridique: string | null; siret: string | null;
  produits_offerts_eur: number; contrat_signe_le: string | null; contrat_version: string | null; espace_active: boolean;
  remuneration_annee: number; codes_actifs: string | null;
}

export const SEUIL_CONTRAT = 1000;
export const alerteLegale = (r: Pick<FicheRow, 'remuneration_annee' | 'contrat_signe_le'>): string | null => {
  const m = Number(r.remuneration_annee || 0);
  if (r.contrat_signe_le) return null;
  if (m >= SEUIL_CONTRAT) return `Contrat obligatoire : ${Math.round(m)} € cette année, aucun contrat signé`;
  if (m >= SEUIL_CONTRAT * 0.8) return `Contrat bientôt obligatoire (${Math.round(m)} € / 1 000 € cette année)`;
  return null;
};

const lbl = 'text-sm font-semibold text-[hsl(var(--admin-text))]';
const Btn = ({ onClick, icon: Icon, children, disabled, tone = 'base', href }: { onClick?: () => void; icon: typeof Mail; children: React.ReactNode; disabled?: boolean; tone?: 'base' | 'accent' | 'wa'; href?: string }) => {
  const cls = cn('inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-xl border text-sm font-semibold disabled:opacity-50',
    tone === 'accent' ? 'bg-[hsl(var(--admin-accent))] border-transparent text-white'
      : tone === 'wa' ? 'bg-[#1F8F4E] border-transparent text-white'
      : 'border-[hsl(var(--admin-border))] bg-white text-[hsl(var(--admin-text))] hover:bg-[hsl(var(--aov03))]');
  if (href) return <a href={href} target="_blank" rel="noopener noreferrer" className={cls}><Icon className="w-4 h-4" />{children}</a>;
  return <button type="button" onClick={onClick} disabled={disabled} className={cls}><Icon className={cn('w-4 h-4', Icon === Loader2 && 'animate-spin')} />{children}</button>;
};

const ajouterEvenement = async (ambassador_id: string, type: string, titre: string, detail?: string) => {
  await db.from('ambassador_events').insert({ ambassador_id, type, titre, detail: detail ?? null, auteur: 'admin' });
};

/* ── Barre de contact + rédaction (mail via le site, WhatsApp via l'appli) ── */
export const Contact = ({ r }: { r: FicheRow }) => {
  const qc = useQueryClient();
  const [mode, setMode] = useState<'mail' | 'whatsapp' | null>(null);
  const [modele, setModele] = useState(MODELES_MESSAGE[0].id);
  const code = (r.codes_actifs ?? '').split(',')[0]?.trim() || '';
  const vars = { prenom: r.nom, code };
  const m0 = MODELES_MESSAGE.find((m) => m.id === modele)!;
  const [sujet, setSujet] = useState(remplirModele(m0.sujet, vars));
  const [corps, setCorps] = useState(remplirModele(m0.corps, vars));
  const profil = lienProfil(r.handle, r.reseau);
  const wa = numeroWhatsApp(r.telephone);

  const choisir = (id: string) => {
    const m = MODELES_MESSAGE.find((x) => x.id === id)!;
    setModele(id); setSujet(remplirModele(m.sujet, vars)); setCorps(remplirModele(m.corps, vars));
  };

  const envoyer = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('send-ambassador-email', { body: { action: 'envoyer', ambassador_id: r.ambassador_id, sujet, corps } });
      if (error) {
        let msg = error.message;
        try { const ctx = (error as { context?: Response }).context; if (ctx) msg = (await ctx.json())?.error ?? msg; } catch { /* message brut */ }
        throw new Error(msg);
      }
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => { toast.success(`Mail envoyé à ${r.email}`); setMode(null); qc.invalidateQueries({ queryKey: ['ambassador-events', r.ambassador_id] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const ouvrirWhatsApp = async () => {
    window.open(`https://wa.me/${wa}?text=${encodeURIComponent(corps)}`, '_blank', 'noopener');
    await ajouterEvenement(r.ambassador_id, 'whatsapp', `WhatsApp ouvert : ${m0.label}`, corps.slice(0, 2000));
    qc.invalidateQueries({ queryKey: ['ambassador-events', r.ambassador_id] });
    setMode(null);
  };

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Btn icon={Mail} tone="accent" disabled={!r.email} onClick={() => setMode(mode === 'mail' ? null : 'mail')}>Mail</Btn>
        <Btn icon={MessageCircle} tone="wa" disabled={!wa} onClick={() => setMode(mode === 'whatsapp' ? null : 'whatsapp')}>WhatsApp</Btn>
        {profil && <Btn icon={ExternalLink} href={profil}>Profil</Btn>}
        <Btn icon={Link2} onClick={async () => { try { await navigator.clipboard.writeText(`${SITE_AMB}/ambassadeur`); toast.success('Lien de son espace copié'); } catch { toast.error('Copie impossible'); } }}>Son espace</Btn>
      </div>
      {(!r.email || !wa) && (
        <p className="text-sm text-[hsl(var(--admin-text-muted))]">
          {!r.email && 'Ajoute son email pour lui écrire depuis ici. '}{!wa && 'Ajoute son téléphone pour WhatsApp.'}
        </p>
      )}
      {mode && (
        <div className="rounded-2xl border border-[hsl(var(--admin-border))] bg-[hsl(var(--aov03,40_20%_96%))] p-3 space-y-3">
          <div className="flex flex-wrap gap-2">
            {MODELES_MESSAGE.map((m) => (
              <button key={m.id} type="button" onClick={() => choisir(m.id)}
                className={cn('min-h-[44px] px-3 rounded-xl text-sm font-semibold border',
                  modele === m.id ? 'bg-[hsl(var(--admin-text))] text-white border-transparent' : 'bg-white border-[hsl(var(--admin-border))] text-[hsl(var(--admin-text-muted))]')}>
                {m.label}
              </button>
            ))}
          </div>
          {mode === 'mail' && (
            <div className="space-y-1">
              <label htmlFor="amb-mail-sujet" className={lbl}>Objet</label>
              <Input id="amb-mail-sujet" value={sujet} onChange={(e) => setSujet(e.target.value)} className="min-h-[44px] text-base" />
            </div>
          )}
          <div className="space-y-1">
            <label htmlFor="amb-mail-corps" className={lbl}>Message</label>
            <textarea id="amb-mail-corps" value={corps} onChange={(e) => setCorps(e.target.value)} rows={9}
              className="w-full rounded-md border border-[hsl(var(--admin-border))] bg-white p-3 text-base leading-relaxed" />
          </div>
          {mode === 'mail'
            ? <Btn icon={envoyer.isPending ? Loader2 : Send} tone="accent" disabled={!sujet.trim() || !corps.trim() || envoyer.isPending} onClick={() => envoyer.mutate()}>Envoyer à {r.email}</Btn>
            : <Btn icon={MessageCircle} tone="wa" disabled={!corps.trim()} onClick={ouvrirWhatsApp}>Ouvrir WhatsApp avec ce message</Btn>}
          <p className="text-sm text-[hsl(var(--admin-text-muted))]">
            {mode === 'mail' ? 'Part de contact@piecestrottinettes.fr ; sa réponse arrive dans cette boîte. Le message est gardé dans le journal.'
              : 'WhatsApp s\'ouvre avec le message prêt : c\'est toi qui appuies sur Envoyer. Le message est noté dans le journal.'}
          </p>
        </div>
      )}
    </section>
  );
};

/* ── Coordonnées (mentions du contrat) ── */
export const Coordonnees = ({ r, onSave }: { r: FicheRow; onSave: (patch: Record<string, unknown>) => void }) => {
  const champ = (k: 'email' | 'telephone' | 'adresse' | 'pays_residence' | 'siret', titre: string, type = 'text') => (
    <div className="space-y-1">
      <label htmlFor={`amb-c-${k}`} className={lbl}>{titre}</label>
      <Input id={`amb-c-${k}`} type={type} defaultValue={r[k] ?? ''}
        onBlur={(e) => { const v = e.target.value.trim() || null; if (v !== (r[k] ?? null)) onSave({ [k]: k === 'email' && v ? v.toLowerCase() : v }); }}
        className="min-h-[44px] text-base" />
    </div>
  );
  return (
    <section className="space-y-3">
      <p className={lbl}>Coordonnées</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {champ('email', 'Email de contact', 'email')}
        {champ('telephone', 'Téléphone (WhatsApp)', 'tel')}
      </div>
      {champ('adresse', 'Adresse postale')}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="amb-c-statut" className={lbl}>Statut</label>
          <select id="amb-c-statut" defaultValue={r.statut_juridique ?? ''} onChange={(e) => onSave({ statut_juridique: e.target.value || null })}
            className="w-full min-h-[44px] rounded-md border border-[hsl(var(--admin-border))] bg-white px-3 text-base">
            <option value="">Non renseigné</option>
            {STATUTS_JURIDIQUES.map((s) => <option key={s.k} value={s.k}>{s.label}</option>)}
          </select>
        </div>
        {champ('pays_residence', 'Pays de résidence fiscale')}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {champ('siret', 'SIRET')}
        <div className="space-y-1">
          <label htmlFor="amb-c-offerts" className={lbl}>Produits offerts (€, cette année)</label>
          <Input id="amb-c-offerts" type="number" min={0} step={1} defaultValue={r.produits_offerts_eur ?? 0}
            onBlur={(e) => { const v = Math.max(0, Number(e.target.value) || 0); if (v !== Number(r.produits_offerts_eur || 0)) onSave({ produits_offerts_eur: v }); }}
            className="min-h-[44px] text-base" />
        </div>
      </div>
      <p className="text-sm text-[hsl(var(--admin-text-muted))]">Le créateur peut aussi les remplir lui-même depuis son espace. L'email de contact ouvre son espace créateur.</p>
    </section>
  );
};

/* ── Contrat : statut, seuil légal, texte (archivé s'il est signé) ── */
export const Contrat = ({ r }: { r: FicheRow }) => {
  const [ouvert, setOuvert] = useState(false);
  const alerte = alerteLegale(r);
  const { data: texte, isLoading } = useQuery({
    queryKey: ['ambassador-contrat', r.ambassador_id, r.contrat_signe_le],
    enabled: ouvert,
    queryFn: async (): Promise<string> => {
      if (r.contrat_signe_le) {
        const { data } = await db.from('ambassador_contracts').select('texte, signataire, signe_le, ip, texte_sha256').eq('ambassador_id', r.ambassador_id).order('signe_le', { ascending: false }).limit(1).maybeSingle();
        if (data) return `${data.texte}\n\n— Signé électroniquement par ${data.signataire} le ${new Date(data.signe_le).toLocaleString('fr-FR')} (IP ${data.ip ?? 'inconnue'}) · empreinte ${data.texte_sha256.slice(0, 16)}…`;
      }
      const { data, error } = await db.rpc('ambassador_contract_text', { p_amb: r.ambassador_id });
      if (error) throw error;
      return data as string;
    },
  });
  return (
    <section className="space-y-2">
      <p className={lbl}>Contrat</p>
      {r.contrat_signe_le
        ? <p className="flex gap-2 text-sm text-[hsl(var(--admin-text))]"><CheckCircle2 className="w-4 h-4 shrink-0 text-[hsl(var(--admin-accent))] mt-0.5" />Signé le {new Date(r.contrat_signe_le).toLocaleDateString('fr-FR')} ({r.contrat_version})</p>
        : <p className="text-sm text-[hsl(var(--admin-text-muted))]">Pas encore signé. {r.espace_active ? 'Son espace est activé : il peut signer en ligne.' : 'Il signe depuis son espace créateur (envoie-lui le mail « Bienvenue + kit »).'}</p>}
      {alerte && <p className="flex gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-800"><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />{alerte} (loi du 9 juin 2023 : contrat écrit dès 1 000 € HT par an).</p>}
      <Btn icon={FileText} onClick={() => setOuvert(!ouvert)}>{ouvert ? 'Masquer le contrat' : r.contrat_signe_le ? 'Voir le contrat signé' : 'Voir le contrat'}</Btn>
      {ouvert && <div className="rounded-xl border border-[hsl(var(--admin-border))] p-3 whitespace-pre-wrap text-sm leading-relaxed">{isLoading ? 'Chargement…' : texte}</div>}
    </section>
  );
};

/* ── Journal : tout ce qui s'est passé avec ce créateur ── */
const ICONES: Record<string, string> = { creation: '＋', candidature: '✉', etape: '→', mail: '✉', whatsapp: '☏', note: '✎', versement: '€', contrat: '✓', profil: '◉', code: '#', releve: '▤' };

export const Journal = ({ ambassadorId }: { ambassadorId: string }) => {
  const qc = useQueryClient();
  const [note, setNote] = useState('');
  const { data: evts = [], isLoading } = useQuery({
    queryKey: ['ambassador-events', ambassadorId],
    queryFn: async () => {
      const { data, error } = await db.from('ambassador_events').select('id, type, titre, detail, auteur, created_at').eq('ambassador_id', ambassadorId).order('created_at', { ascending: false }).limit(100);
      if (error) throw error;
      return (data || []) as { id: string; type: string; titre: string; detail: string | null; auteur: string; created_at: string }[];
    },
  });
  const ajouter = useMutation({
    mutationFn: async () => { await ajouterEvenement(ambassadorId, 'note', note.trim()); },
    onSuccess: () => { setNote(''); qc.invalidateQueries({ queryKey: ['ambassador-events', ambassadorId] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <section className="space-y-2">
      <p className={lbl}>Journal</p>
      <div className="flex gap-2">
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ajouter une note (appel, DM, accord…)" aria-label="Nouvelle note" className="min-h-[44px] text-base"
          onKeyDown={(e) => { if (e.key === 'Enter' && note.trim()) ajouter.mutate(); }} />
        <Btn icon={StickyNote} disabled={!note.trim() || ajouter.isPending} onClick={() => ajouter.mutate()}>Noter</Btn>
      </div>
      {isLoading ? <p className="text-sm text-[hsl(var(--admin-text-muted))]">Chargement…</p> : (
        <ol className="space-y-2">
          {evts.map((e) => (
            <li key={e.id} className="flex gap-3">
              <span className="w-8 h-8 shrink-0 rounded-full bg-[hsl(var(--aov03,40_20%_94%))] grid place-items-center text-sm font-bold text-[hsl(var(--admin-text))]" aria-hidden="true">{ICONES[e.type] ?? '•'}</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[hsl(var(--admin-text))]">{e.titre}</p>
                <p className="text-sm text-[hsl(var(--admin-text-muted))]">{new Date(e.created_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}{e.auteur !== 'admin' ? ` · ${e.auteur === 'createur' ? 'par le créateur' : 'automatique'}` : ''}</p>
                {e.detail && <details className="text-sm"><summary className="cursor-pointer text-[hsl(var(--admin-text-muted))]">Voir</summary><p className="whitespace-pre-wrap mt-1">{e.detail}</p></details>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
};
