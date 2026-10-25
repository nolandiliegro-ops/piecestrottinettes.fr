/* État de l'invitation badge IA (25/10/2026) — module minuscule, importé partout sans charger le dialogue IA. */

export type ContexteInvite = 'ambassadeur' | 'rider';

const cle = (c: ContexteInvite) => `pt-badge-invite-${c}`;

/** En cas de stockage inaccessible (navigation privée stricte), on considère l'invitation déjà vue : jamais d'insistance. */
export const inviteDejaVue = (c: ContexteInvite) => { try { return !!localStorage.getItem(cle(c)); } catch { return true; } };
export const marquerInviteVue = (c: ContexteInvite) => { try { localStorage.setItem(cle(c), new Date().toISOString()); } catch { /* navigation privée */ } };

/** Un badge IA est stocké dans le bucket rider-avatars ; une photo Google ou importée ne compte pas. */
export const aUnBadgeIa = (avatar: string | null | undefined) => !!avatar && avatar.includes('/rider-avatars/');
