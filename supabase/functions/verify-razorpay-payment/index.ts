import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function hmacSha256(key: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const messageData = encoder.encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function getShiprocketToken(): Promise<string | null> {
  const email = Deno.env.get('SHIPROCKET_EMAIL');
  const password = Deno.env.get('SHIPROCKET_PASSWORD');

  if (!email || !password) {
    console.log('Shiprocket credentials not configured');
    return null;
  }

  const response = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error('Shiprocket auth failed:', data);
    return null;
  }
  return data.token;
}

async function createShiprocketOrder(supabase: any, orderId: string): Promise<{
  success: boolean;
  shiprocket_order_id?: string;
  shiprocket_shipment_id?: string;
  error?: string;
}> {
  try {
    // Fetch order with items
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Order fetch error:', orderError);
      return { success: false, error: 'Order not found' };
    }

    console.log('Creating Shiprocket order for:', order.order_number);

    // Get Shiprocket token
    const token = await getShiprocketToken();

    if (!token) {
      console.log('Shiprocket not configured, skipping shipment creation');
      return { success: true, shiprocket_order_id: undefined, shiprocket_shipment_id: undefined };
    }

    // Parse shipping address
    const shippingAddress = order.shipping_address as {
      full_name: string;
      address_line1: string;
      address_line2?: string;
      city: string;
      state: string;
      postal_code: string;
      phone?: string;
    };

    // Fetch product dimensions
    const productIds = order.order_items.map((item: any) => item.product_id).filter(Boolean);
    let productsMap: Record<string, any> = {};
    
    if (productIds.length > 0) {
      const { data: products } = await supabase
        .from('products')
        .select('id, weight, length, breadth, height, sku')
        .in('id', productIds);
      
      if (products) {
        productsMap = products.reduce((acc: any, p: any) => {
          acc[p.id] = p;
          return acc;
        }, {});
      }
    }

    // Calculate dimensions
    let totalWeight = 0;
    let maxLength = 20;
    let maxBreadth = 15;
    let maxHeight = 5;

    for (const item of order.order_items) {
      const product = productsMap[item.product_id] || {};
      const itemWeight = (Number(product.weight) || 0.5) * item.quantity;
      totalWeight += itemWeight;
      
      if (Number(product.length) > maxLength) maxLength = Number(product.length);
      if (Number(product.breadth) > maxBreadth) maxBreadth = Number(product.breadth);
      if (Number(product.height) > maxHeight) maxHeight = Number(product.height);
    }

    if (totalWeight < 0.5) totalWeight = 0.5;

    // Format order items
    const orderItems = order.order_items.map((item: any) => {
      const product = productsMap[item.product_id] || {};
      return {
        name: item.product_name,
        sku: product.sku || `SKU-${item.product_id?.substring(0, 8) || 'ITEM'}`,
        units: item.quantity,
        selling_price: Number(item.unit_price),
        discount: 0,
        tax: 0,
        hsn: '',
      };
    });

    // Create Shiprocket order
    const shiprocketPayload = {
      order_id: order.order_number,
      order_date: new Date(order.created_at).toISOString().split('T')[0],
      pickup_location: 'Primary',
      billing_customer_name: shippingAddress.full_name?.split(' ')[0] || 'Customer',
      billing_last_name: shippingAddress.full_name?.split(' ').slice(1).join(' ') || '',
      billing_address: shippingAddress.address_line1,
      billing_address_2: shippingAddress.address_line2 || '',
      billing_city: shippingAddress.city,
      billing_pincode: shippingAddress.postal_code,
      billing_state: shippingAddress.state,
      billing_country: 'India',
      billing_email: order.email,
      billing_phone: shippingAddress.phone || '9999999999',
      shipping_is_billing: true,
      order_items: orderItems,
      payment_method: 'Prepaid',
      sub_total: Number(order.subtotal),
      length: maxLength,
      breadth: maxBreadth,
      height: maxHeight,
      weight: totalWeight,
    };

    console.log('Sending to Shiprocket with dimensions:', {
      weight: totalWeight,
      length: maxLength,
      breadth: maxBreadth,
      height: maxHeight,
    });

    const shiprocketResponse = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(shiprocketPayload),
    });

    const shiprocketData = await shiprocketResponse.json();

    if (!shiprocketResponse.ok) {
      console.error('Shiprocket create order failed:', shiprocketData);
      return { success: false, error: shiprocketData.message || 'Failed to create Shiprocket order' };
    }

    console.log('Shiprocket order created:', shiprocketData);

    return {
      success: true,
      shiprocket_order_id: String(shiprocketData.order_id),
      shiprocket_shipment_id: String(shiprocketData.shipment_id),
    };
  } catch (error) {
    console.error('Error creating Shiprocket order:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay credentials not configured");
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !order_id) {
      throw new Error("Missing required payment verification parameters");
    }

    console.log('Verifying payment for order:', order_id);

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = await hmacSha256(RAZORPAY_KEY_SECRET, body);

    if (expectedSignature !== razorpay_signature) {
      console.error('Invalid payment signature');
      throw new Error("Invalid payment signature");
    }

    console.log('Payment signature verified successfully');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update order status to paid/confirmed first
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        razorpay_payment_id,
        payment_status: "paid",
        status: "confirmed",
      })
      .eq("id", order_id);

    if (updateError) {
      console.error("Error updating order:", updateError);
      throw new Error("Failed to update order status");
    }

    console.log('Order marked as paid, now creating Shiprocket order...');

    // Automatically create Shiprocket order
    const shiprocketResult = await createShiprocketOrder(supabase, order_id);

    if (shiprocketResult.success && shiprocketResult.shiprocket_order_id) {
      // Update order with Shiprocket details
      const { error: shiprocketUpdateError } = await supabase
        .from("orders")
        .update({
          shiprocket_order_id: shiprocketResult.shiprocket_order_id,
          shiprocket_shipment_id: shiprocketResult.shiprocket_shipment_id,
          status: "processing",
        })
        .eq("id", order_id);

      if (shiprocketUpdateError) {
        console.error("Error updating Shiprocket details:", shiprocketUpdateError);
      } else {
        console.log('Order updated with Shiprocket details');
      }
    } else if (!shiprocketResult.success) {
      console.error('Shiprocket order creation failed:', shiprocketResult.error);
      // Order is still paid, just without Shiprocket integration
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Payment verified successfully",
        shiprocket_order_id: shiprocketResult.shiprocket_order_id || null,
        shiprocket_shipment_id: shiprocketResult.shiprocket_shipment_id || null,
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
