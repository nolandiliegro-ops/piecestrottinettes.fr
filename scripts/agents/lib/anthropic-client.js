/**
 * Le Veilleur — Client Anthropic avec tool_use web_search
 * Force du JSON structuré via tool_use.
 */

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

const SYSTEM_SCOOTERS = `Tu es un expert en trottinettes électriques chargé de veiller le marché 2025-2026.

RÈGLES :
- Tu peux retourner les modèles même avec informations partielles. Mets null pour les champs incertains mais retourne TOUJOURS le produit si son existence est plausible.
- Privilégier les modèles 2024+, mais accepter aussi les modèles plus anciens s'ils sont toujours vendus / pertinents commercialement.
- Retourne au minimum 3-5 modèles connus de la marque, même s'ils ne sont pas neufs.
- Privilégie les sources officielles (site fabricant) puis les revendeurs reconnus.
- Pour chaque modèle : cite l'URL source dans official_url quand tu la connais.
- Réponds UNIQUEMENT en appelant le tool 'submit_scooters' avec un tableau JSON valide.`;

const SYSTEM_PARTS = `Tu es un expert en pièces détachées trottinettes électriques.

RÈGLES :
- Tu peux retourner les pièces même avec informations partielles. Mets null pour les champs incertains mais retourne TOUJOURS la pièce si son existence est plausible.
- Vérifie quand c'est possible chaque référence sur le site officiel du fournisseur.
- Si une référence n'est plus en stock, marque stock_status='out_of_stock' mais inclus-la quand même.
- Si elle est disponible, marque stock_status='available'. Si tu ne sais pas, mets 'unknown'.
- Retourne au minimum 3-5 références connues du fournisseur, même si tu n'as pas tous les détails.
- Pour chaque pièce : nom exact, marque (ex: Wattiz, Hota, Minimotors), prix EUR TTC, URL produit quand disponibles.
- Réponds UNIQUEMENT en appelant le tool 'submit_parts' avec un tableau JSON valide.`;

const TOOLS_SCOOTERS = [{
  name: 'submit_scooters',
  description: 'Soumet la liste des nouveaux modèles de trottinettes trouvés.',
  input_schema: {
    type: 'object',
    properties: {
      scooters: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            brand: { type: 'string' },
            name: { type: 'string' },
            variant: { type: ['string', 'null'] },
            release_year: { type: ['number', 'null'] },
            price: { type: ['number', 'null'] },
            official_url: { type: ['string', 'null'] },
            images: { type: 'array', items: { type: 'string' } },
            specs: {
              type: 'object',
              properties: {
                voltage: { type: ['number', 'null'] },
                motor_power: { type: ['number', 'null'] },
                torque: { type: ['number', 'null'] },
                max_speed: { type: ['number', 'null'] },
                autonomy: { type: ['number', 'null'] },
                battery_wh: { type: ['number', 'null'] },
                tire_size: { type: ['string', 'null'] },
                tire_type: { type: ['string', 'null'] },
                suspension: { type: ['string', 'null'] },
                brakes: { type: ['string', 'null'] },
                weight: { type: ['number', 'null'] },
                max_load: { type: ['number', 'null'] },
                ip_rating: { type: ['string', 'null'] },
                foldable: { type: ['boolean', 'null'] },
              },
            },
            description: { type: ['string', 'null'] },
          },
          required: ['brand', 'name'],
        },
      },
    },
    required: ['scooters'],
  },
}];

const TOOLS_PARTS = [{
  name: 'submit_parts',
  description: 'Soumet la liste des nouvelles pièces détachées trouvées.',
  input_schema: {
    type: 'object',
    properties: {
      parts: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            brand: { type: ['string', 'null'] },
            sku: { type: ['string', 'null'] },
            category: { type: 'string' },
            price: { type: ['number', 'null'] },
            stock_status: { type: 'string', enum: ['available', 'out_of_stock', 'unknown'] },
            official_url: { type: ['string', 'null'] },
            images: { type: 'array', items: { type: 'string' } },
            description: { type: ['string', 'null'] },
            technical_metadata: { type: 'object' },
            compatible_brands: { type: 'array', items: { type: 'string' } },
          },
          required: ['name', 'category'],
        },
      },
    },
    required: ['parts'],
  },
}];

async function callAnthropic({ system, userPrompt, tools, model, maxTokens, webSearchMaxUses = 8 }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY manquant');

  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system,
      tools: [
        ...tools,
        { type: 'web_search_20250305', name: 'web_search', max_uses: webSearchMaxUses },
      ],
      tool_choice: { type: 'any' },
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Anthropic ${res.status}: ${txt.slice(0, 500)}`);
  }
  const data = await res.json();
  const toolUse = (data.content || []).find((c) => c.type === 'tool_use');
  if (!toolUse) throw new Error('Pas de tool_use dans la réponse Anthropic');
  console.log(`[anthropic] tool_use input:`, JSON.stringify(toolUse.input, null, 2));
  console.log(`[anthropic] usage:`, data.usage);
  console.log(`[anthropic] web_search count:`, data.usage?.server_tool_use?.web_search_requests ?? data.usage?.web_search_requests_count ?? 'N/A');
  return toolUse.input;
}

export async function searchNewScooters({ brand, officialUrl, since, model, maxTokens }) {
  const userPrompt = `Cherche sur le web (utilise web_search jusqu'à 8 fois) tous les nouveaux modèles de trottinettes électriques de la marque "${brand}" sortis depuis le ${since}.

Site officiel : ${officialUrl}

Pour chaque modèle trouvé, renseigne TOUS les champs suivants en interrogeant le site officiel et les revendeurs :
- Nom officiel + variants (Pro, Limited, Ultra, etc.)
- Voltage (V), Puissance moteur(s) (W), Couple (Nm)
- Vitesse max (km/h), Autonomie (km), Batterie (Wh)
- Tire size (pouces), Type de pneu (gonflable/plein)
- Suspension avant/arrière, Freins (disque hydraulique, tambour, électronique)
- Poids (kg), Charge max (kg), Indice IP
- Pliable oui/non
- Description marketing complète (3-5 paragraphes)
- Prix EUR TTC, URL officielle, 1-3 images haute qualité

Si tu ne trouves pas une donnée précise, mets null. N'invente rien.`;

  const out = await callAnthropic({
    system: SYSTEM_SCOOTERS,
    userPrompt,
    tools: TOOLS_SCOOTERS,
    model,
    maxTokens,
  });
  return out.scooters || [];
}

export async function searchNewParts({ supplier, supplierUrl, categories, since, model, maxTokens }) {
  const userPrompt = `Cherche sur le web (utilise web_search jusqu'à 8 fois) TOUTES les références de pièces détachées trottinettes électriques disponibles ou nouvelles chez le fournisseur "${supplier}" (site officiel : ${supplierUrl}) ajoutées, mises à jour ou disponibles depuis le ${since}.

Catégories ciblées : ${categories.join(', ')}.

Pour chaque référence trouvée, renseigne :
- Nom exact de la pièce
- Marque de la pièce (ex: Wattiz, Hota, Minimotors, EY3, NAMI)
- SKU/référence si visible
- Catégorie (parmi : ${categories.join(', ')})
- Prix EUR TTC actuel
- stock_status : 'available' si en stock, 'out_of_stock' si rupture, 'unknown' si incertain
- URL produit officielle
- 1-3 images
- Description technique complète
- technical_metadata : objet JSON libre avec les specs (voltage, ampérage, dimensions, type, matériau...)
- compatible_brands : marques de trottinettes annoncées comme compatibles (ex: ['Dualtron', 'Vsett'])

Vérifie chaque référence sur le site officiel. Marque les ruptures comme out_of_stock mais inclus-les. N'invente rien.`;

  const out = await callAnthropic({
    system: SYSTEM_PARTS,
    userPrompt,
    tools: TOOLS_PARTS,
    model,
    maxTokens,
    webSearchMaxUses: 15,
  });
  return out.parts || [];
}

export async function fetchCompetitorPrice({ productName, competitorName, competitorUrl, model }) {
  const userPrompt = `Cherche sur ${competitorUrl} (site ${competitorName}) si le produit "${productName}" est vendu, et à quel prix EUR TTC. Réponds UNIQUEMENT en JSON : {"found": true|false, "price": number|null, "url": string|null}. Une seule recherche web maximum.`;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 500,
      tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 1 }],
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });
  if (!res.ok) return { found: false, price: null, url: null };
  const data = await res.json();
  const text = (data.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('');
  const match = text.match(/\{[\s\S]*?\}/);
  if (!match) return { found: false, price: null, url: null };
  try { return JSON.parse(match[0]); } catch { return { found: false, price: null, url: null }; }
}
