import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation helpers
function isValidUUID(str: string): boolean {
  if (typeof str !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

function isValidAmount(amount: unknown): boolean {
  if (typeof amount !== 'number') return false;
  if (!Number.isFinite(amount)) return false;
  if (amount <= 0) return false;
  if (amount > 100000000) return false; // Max 10 lakh rupees in paise
  return true;
}

function isValidCurrency(currency: unknown): boolean {
  if (typeof currency !== 'string') return false;
  const validCurrencies = ['INR', 'USD', 'EUR', 'GBP'];
  return validCurrencies.includes(currency.toUpperCase());
}

function sanitizeString(str: string, maxLength: number = 255): string {
  if (typeof str !== 'string') return '';
  // Remove any control characters and trim
  return str.replace(/[\x00-\x1F\x7F]/g, '').trim().substring(0, maxLength);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID");
    const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      console.error("Razorpay credentials not configured");
      throw new Error("Payment gateway not configured");
    }

    // Parse request body with error handling
    let body;
    try {
      body = await req.json();
    } catch {
      console.error("Invalid JSON in request body");
      throw new Error("Invalid request format");
    }

    const { order_id, amount, currency = "INR" } = body;

    // Validate order_id
    if (!order_id) {
      console.error("Missing order_id");
      throw new Error("Order ID is required");
    }
    if (!isValidUUID(order_id)) {
      console.error("Invalid order_id format:", order_id);
      throw new Error("Invalid order ID format");
    }

    // Validate amount
    if (!isValidAmount(amount)) {
      console.error("Invalid amount:", amount);
      throw new Error("Invalid payment amount");
    }

    // Validate currency
    if (!isValidCurrency(currency)) {
      console.error("Invalid currency:", currency);
      throw new Error("Invalid currency");
    }

    const sanitizedCurrency = sanitizeString(currency, 3).toUpperCase();

    console.log(`Creating Razorpay order for order: ${order_id}, amount: ${amount} ${sanitizedCurrency}`);

    // Verify the order exists in our database before proceeding
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: existingOrder, error: orderCheckError } = await supabase
      .from("orders")
      .select("id, total, payment_status")
      .eq("id", order_id)
      .single();

    if (orderCheckError || !existingOrder) {
      console.error("Order not found:", order_id, orderCheckError);
      throw new Error("Order not found");
    }

    // Prevent duplicate payments
    if (existingOrder.payment_status === 'paid') {
      console.error("Order already paid:", order_id);
      throw new Error("Order has already been paid");
    }

    // Verify amount matches order total (within tolerance for paise conversion)
    const expectedAmountInPaise = Math.round(existingOrder.total * 100);
    if (Math.abs(amount - expectedAmountInPaise) > 100) { // Allow 1 rupee tolerance
      console.error(`Amount mismatch: received ${amount}, expected ${expectedAmountInPaise}`);
      throw new Error("Payment amount does not match order total");
    }

    // Create Razorpay order
    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`),
      },
      body: JSON.stringify({
        amount: Math.round(amount),
        currency: sanitizedCurrency,
        receipt: order_id,
        notes: {
          order_id,
        },
      }),
    });

    if (!razorpayResponse.ok) {
      const error = await razorpayResponse.text();
      console.error("Razorpay API error:", error);
      throw new Error("Failed to create payment order");
    }

    const razorpayOrder = await razorpayResponse.json();

    // Update our order with Razorpay order ID
    const { error: updateError } = await supabase
      .from("orders")
      .update({ razorpay_order_id: razorpayOrder.id })
      .eq("id", order_id);

    if (updateError) {
      console.error("Error updating order with Razorpay ID:", updateError);
      // Don't fail the request, payment can still proceed
    }

    console.log(`Razorpay order created successfully: ${razorpayOrder.id}`);

    return new Response(
      JSON.stringify({
        razorpay_order_id: razorpayOrder.id,
        razorpay_key_id: RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Payment processing error";
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});