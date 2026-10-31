// 31/10/2026 — resynchronisation de publication (aucun changement de comportement).
// Config de lancement — sync 25/10 recette garage (3087622)
/**
 * Interrupteur de pré-lancement de la boutique.
 *
 * false = boutique fermée : le site reste visitable, mais aucun ajout au
 * panier, /panier et /checkout renvoient vers la pop-up « carte Rider ».
 * true  = boutique ouverte (comportement normal).
 *
 * Pour ouvrir le shop : passer à true, commit, publier.
 * Le garde-fou serveur (create-checkout-session) lit le secret SHOP_OPEN :
 * le passer aussi à "true" côté Supabase au même moment.
 */
/** Ouverture publique de la boutique. Passer à true le jour J (avec le secret serveur SHOP_OPEN). */
export const SHOP_OPEN_PUBLIC = false;

/**
 * Mode recette (lot livraison M1, 24/10/2026) : `?boutique=test` dans l'adresse ouvre le
 * parcours d'achat pour CET onglet (sessionStorage) ; `?boutique=fermee` le referme.
 * Sans risque : le serveur (create-checkout-session) refuse toute commande d'un compte
 * non admin tant que le secret SHOP_OPEN n'est pas "true".
 */
function readShopTestMode(): boolean {
  if (SHOP_OPEN_PUBLIC || typeof window === 'undefined') return false;
  try {
    const flag = new URLSearchParams(window.location.search).get('boutique');
    if (flag === 'test') window.sessionStorage.setItem('pt-shop-test', '1');
    if (flag === 'fermee') window.sessionStorage.removeItem('pt-shop-test');
    return window.sessionStorage.getItem('pt-shop-test') === '1';
  } catch {
    return false;
  }
}

export const SHOP_TEST_MODE = readShopTestMode();

/** Parcours d'achat ouvert pour ce visiteur (public, ou mode recette de l'onglet). */
export const SHOP_OPEN = SHOP_OPEN_PUBLIC || SHOP_TEST_MODE;

/** Remise offerte aux Riders inscrits avant l'ouverture. */
export const RIDER_LAUNCH_OFFER = {
  percent: 20,
  maxEuros: 30,
  validityDays: 60,
} as const;

/** Événement global pour ouvrir la pop-up de pré-lancement. */
export const PRELAUNCH_EVENT = 'pt:prelaunch-open';

export const openPrelaunch = () => {
  window.dispatchEvent(new Event(PRELAUNCH_EVENT));
};

// relance publication 25/10 C8
// relance publication 25/10 textes d'aide 320 px
// relance publication 25/10 stock boutique
// relance publication 25/10 stock boutique v3
// relance publication 25/10 stock boutique v4
// relance publication 25/10 filtre trott plaque
// relance publication 26/10 photos
// 26/10 : republication connexion carte vivante + onglets accueil (commit a4adb57)
// relance publication 26/10 hero sélecteur
// relance publication 26/10 clavier iPhone
// 28/10 loupe photos
// 29/10 loupe 220 px
// 29/10 visuels menu
// 29/10 visuels tour 2
// 29/10 visuels catalogue en ligne
