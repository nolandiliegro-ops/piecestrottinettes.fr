// Edge Function temporaire — à SUPPRIMER immédiatement après récupération de la clé.
// Protégée par x-admin-secret == ADMIN_BULK_SECRET.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve((req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const provided = req.headers.get('x-admin-secret');
  const expected = Deno.env.get('ADMIN_BULK_SECRET');

  if (!expected || !provided || provided !== expected) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!key) {
    return new Response(JSON.stringify({ error: 'SUPABASE_SERVICE_ROLE_KEY not set' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Pas de log de la valeur. Réponse one-shot.
  return new Response(JSON.stringify({ service_role_key: key }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
