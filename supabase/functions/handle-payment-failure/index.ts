import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_id, razorpay_order_id, razorpay_payment_id, failure_reason } = await req.json();

    if (!order_id) {
      throw new Error("order_id is required");
    }

    console.log('Handling payment failure for order:', order_id);
    console.log('Failure reason:', failure_reason);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Build update object
    const updateData: Record<string, any> = {
      payment_status: "failed",
      status: "cancelled",
      notes: failure_reason || "Payment failed or cancelled",
    };

    // Store razorpay_payment_id if available
    if (razorpay_payment_id) {
      updateData.razorpay_payment_id = razorpay_payment_id;
    }

    // Update order status to failed
    const { error: updateError } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", order_id);

    if (updateError) {
      console.error("Error updating order:", updateError);
      throw new Error("Failed to update order status");
    }

    console.log('Order marked as failed/cancelled');

    return new Response(
      JSON.stringify({
        success: true,
        message: "Order marked as failed",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
