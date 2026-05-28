import { useEffect, useRef } from 'react';

/**
 * Live preview des design tokens via window.postMessage.
 *
 * Reçoit des messages depuis l'admin Design Global Manager pendant qu'un
 * utilisateur édite des couleurs, et override les CSS vars `--token-*` sur
 * :root en temps réel sans round-trip BDD.
 *
 * Sécurité :
 * - event.origin === window.location.origin (strict, même origine uniquement)
 * - event.data.type === 'design-tokens-preview'
 * - Whitelist des 12 keys autorisées
 * - Regex hex strict /^#[0-9A-Fa-f]{6}$/
 * - Aucun eval, aucun innerHTML, uniquement setProperty/removeProperty
 *
 * Priorité CSS :
 * 1. useDesignTokens injecte les valeurs publiées (BDD + Realtime)
 * 2. useDesignTokensPreview override pendant édition admin
 * 3. removeProperty quand une key sort du set preview → la valeur publiée
 *    (step 1) redevient active automatiquement
 */

const VALID_KEYS = new Set<string>([
  'global.background',
  'global.text-primary',
  'global.text-secondary',
  'header.background',
  'header.text',
  'footer.background',
  'footer.text',
  'hero.background',
  'brands.card-background',
  'brands.card-surround',
  'popular.card-background',
  'popular.section-background',
  'module.background',
]);

const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;

function toCssVar(key: string): string {
  return `--token-${key.replace(/\./g, '-')}`;
}

export function useDesignTokensPreview() {
  const previewKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      // Filtres de sécurité
      if (event.origin !== window.location.origin) return;
      const data = event.data;
      if (!data || typeof data !== 'object') return;
      if (data.type !== 'design-tokens-preview') return;

      const tokens = data.tokens;
      if (!tokens || typeof tokens !== 'object' || Array.isArray(tokens)) return;

      const root = document.documentElement;
      const nextKeys = new Set<string>();

      // Apply / override
      for (const [key, value] of Object.entries(tokens)) {
        if (!VALID_KEYS.has(key)) continue;
        if (typeof value !== 'string') continue;
        if (!HEX_REGEX.test(value)) continue;
        root.style.setProperty(toCssVar(key), value);
        nextKeys.add(key);
      }

      // Reset des keys qui étaient en preview mais ne le sont plus
      for (const oldKey of previewKeysRef.current) {
        if (!nextKeys.has(oldKey)) {
          root.style.removeProperty(toCssVar(oldKey));
        }
      }

      previewKeysRef.current = nextKeys;
    };

    window.addEventListener('message', handler);
    return () => {
      window.removeEventListener('message', handler);
      // Purge des CSS vars résiduelles au unmount
      const root = document.documentElement;
      for (const key of previewKeysRef.current) {
        root.style.removeProperty(toCssVar(key));
      }
      previewKeysRef.current = new Set();
    };
  }, []);
}

/**
 * Composant racine à monter dans App.tsx pour activer la réception
 * des previews live sur toute l'app (y compris dans les iframes).
 */
export function DesignTokensPreviewBootstrap() {
  useDesignTokensPreview();
  return null;
}
