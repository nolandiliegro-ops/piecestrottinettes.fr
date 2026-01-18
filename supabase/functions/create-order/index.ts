import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Server-side validation schema (mirrors client-side but enforced here)
interface OrderItem {
  id: string;
  name: string;
  image_url: string | null;
  price: number;
  quantity: number;
}

interface CheckoutData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  address: string;
  postalCode: string;
  city: string;
  items: OrderItem[];
}

// Validation functions
function validateString(value: unknown, field: string, minLength: number, maxLength: number): string {
  if (typeof value !== "string") {
    throw new Error(`${field} doit être une chaîne de caractères`);
  }
  const trimmed = value.trim();
  if (trimmed.length < minLength) {
    throw new Error(`${field} requis (min ${minLength} caractères)`);
  }
  if (trimmed.length > maxLength) {
    throw new Error(`${field} trop long (max ${maxLength} caractères)`);
  }
  // Sanitize: remove potentially dangerous characters
  return trimmed.replace(/[<>]/g, "");
}

function validateEmail(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error("Email invalide");
  }
  const trimmed = value.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed) || trimmed.length > 255) {
    throw new Error("Email invalide");
  }
  return trimmed;
}

function validatePostalCode(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error("Code postal invalide");
  }
  const trimmed = value.trim();
  if (!/^\d{5}$/.test(trimmed)) {
    throw new Error("Code postal invalide (5 chiffres requis)");
  }
  return trimmed;
}

function validatePhone(value: unknown): string | null {
  if (!value || value === "") return null;
  if (typeof value !== "string") {
    throw new Error("Téléphone invalide");
  }
  const cleaned = value.replace(/\s/g, "").trim();
  if (cleaned.length > 0 && (cleaned.length < 10 || cleaned.length > 15)) {
    throw new Error("Téléphone invalide");
  }
  return cleaned || null;
}

function validateItems(items: unknown): OrderItem[] {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Le panier est vide");
  }
  if (items.length > 100) {
    throw new Error("Trop d'articles dans le panier");
  }
  
  return items.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new Error(`Article ${index + 1} invalide`);
    }
    const { id, name, image_url, price, quantity } = item as Record<string, unknown>;
    
    if (typeof id !== "string" || !id.trim()) {
      throw new Error(`ID de l'article ${index + 1} invalide`);
    }
    if (typeof name !== "string" || !name.trim()) {
      throw new Error(`Nom de l'article ${index + 1} invalide`);
    }
    if (typeof quantity !== "number" || quantity < 1 || quantity > 99 || !Number.isInteger(quantity)) {
      throw new Error(`Quantité de l'article ${index + 1} invalide`);
    }
    if (typeof price !== "number" || price < 0) {
      throw new Error(`Prix de l'article ${index + 1} invalide`);
    }
    
    return {
      id: id.trim(),
      name: name.trim().substring(0, 200),
      image_url: typeof image_url === "string" ? image_url.trim() : null,
      price,
      quantity,
    };
  });
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // =============================================
    // SECURITY: Verify authentication
    // =============================================
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("Missing or invalid Authorization header");
      return new Response(
        JSON.stringify({ error: "Authentification requise pour passer commande" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create client with user's auth token for validation
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user authentication
    const { data: userData, error: userError } = await supabaseAuth.auth.getUser();

    if (userError || !userData?.user) {
      console.error("Failed to verify user:", userError);
      return new Response(
        JSON.stringify({ error: "Session invalide - veuillez vous reconnecter" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = userData.user.id;
    console.log(`Order request from authenticated user: ${userId}`);

    // =============================================
    // Parse and validate input
    // =============================================
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Format de données invalide" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!body || typeof body !== "object") {
      return new Response(
        JSON.stringify({ error: "Données manquantes" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const input = body as Record<string, unknown>;

    // Validate all fields server-side
    let validatedData: CheckoutData;
    try {
      validatedData = {
        firstName: validateString(input.firstName, "Prénom", 2, 100),
        lastName: validateString(input.lastName, "Nom", 2, 100),
        email: validateEmail(input.email),
        phone: validatePhone(input.phone),
        address: validateString(input.address, "Adresse", 5, 500),
        postalCode: validatePostalCode(input.postalCode),
        city: validateString(input.city, "Ville", 2, 100),
        items: validateItems(input.items),
      };
    } catch (validationError) {
      console.error("Validation error:", validationError);
      return new Response(
        JSON.stringify({ error: validationError instanceof Error ? validationError.message : "Données invalides" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // =============================================
    // Verify prices against database (CRITICAL)
    // =============================================
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const partIds = validatedData.items.map(item => item.id);
    const { data: partsData, error: partsError } = await supabaseAdmin
      .from("parts")
      .select("id, price, name, stock_quantity")
      .in("id", partIds);

    if (partsError) {
      console.error("Error fetching parts:", partsError);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la vérification des articles" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!partsData || partsData.length !== partIds.length) {
      console.error("Some parts not found:", { requested: partIds.length, found: partsData?.length });
      return new Response(
        JSON.stringify({ error: "Certains articles ne sont plus disponibles" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create price lookup map
    const priceMap = new Map(partsData.map(p => [p.id, { price: p.price, name: p.name, stock: p.stock_quantity }]));

    // Verify each item's price matches database
    for (const item of validatedData.items) {
      const dbPart = priceMap.get(item.id);
      if (!dbPart) {
        return new Response(
          JSON.stringify({ error: `Article "${item.name}" non trouvé` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Price mismatch detection (allow small floating point differences)
      if (Math.abs(dbPart.price - item.price) > 0.01) {
        console.error(`Price mismatch for ${item.id}: client=${item.price}, db=${dbPart.price}`);
        return new Response(
          JSON.stringify({ error: `Le prix de "${item.name}" a changé. Veuillez rafraîchir votre panier.` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Stock check
      if (dbPart.stock !== null && dbPart.stock < item.quantity) {
        return new Response(
          JSON.stringify({ error: `Stock insuffisant pour "${item.name}" (${dbPart.stock} disponible)` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // =============================================
    // Calculate totals SERVER-SIDE (never trust client)
    // =============================================
    const subtotalHT = validatedData.items.reduce((sum, item) => {
      const dbPrice = priceMap.get(item.id)?.price ?? 0;
      return sum + (dbPrice * item.quantity);
    }, 0);
    
    const tvaRate = 0.20;
    const tvaAmount = Math.round(subtotalHT * tvaRate * 100) / 100;
    const totalTTC = Math.round((subtotalHT + tvaAmount) * 100) / 100;
    const loyaltyPoints = Math.floor(totalTTC);

    // Generate secure order number
    const orderNumber = `PT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    console.log(`Creating order ${orderNumber} for user ${userId}: ${subtotalHT} HT, ${totalTTC} TTC`);

    // =============================================
    // Create order using service role (bypasses RLS)
    // =============================================
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        order_number: orderNumber,
        user_id: userId, // Always set to authenticated user
        customer_first_name: validatedData.firstName,
        customer_last_name: validatedData.lastName,
        customer_email: validatedData.email,
        customer_phone: validatedData.phone,
        address: validatedData.address,
        postal_code: validatedData.postalCode,
        city: validatedData.city,
        subtotal_ht: subtotalHT,
        tva_amount: tvaAmount,
        total_ttc: totalTTC,
        loyalty_points_earned: loyaltyPoints,
        status: "pending",
      })
      .select("id")
      .single();

    if (orderError) {
      console.error("Order creation error:", orderError);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la création de la commande" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create order items
    const orderItems = validatedData.items.map(item => {
      const dbPrice = priceMap.get(item.id)?.price ?? item.price;
      return {
        order_id: order.id,
        part_id: item.id,
        part_name: item.name,
        part_image_url: item.image_url,
        unit_price: dbPrice,
        quantity: item.quantity,
        line_total: dbPrice * item.quantity,
      };
    });

    const { error: itemsError } = await supabaseAdmin
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Order items error:", itemsError);
      // Rollback: delete the order
      await supabaseAdmin.from("orders").delete().eq("id", order.id);
      return new Response(
        JSON.stringify({ error: "Erreur lors de l'ajout des articles" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Order ${orderNumber} created successfully with ${orderItems.length} items`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        orderNumber,
        orderId: order.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error in create-order:", error);
    return new Response(
      JSON.stringify({ error: "Une erreur inattendue s'est produite" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
