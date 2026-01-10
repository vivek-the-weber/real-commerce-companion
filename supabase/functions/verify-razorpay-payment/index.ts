import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation helpers
function isValidUUID(str: unknown): boolean {
  if (typeof str !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

function isValidRazorpayId(str: unknown, prefix: string): boolean {
  if (typeof str !== 'string') return false;
  if (str.length < 10 || str.length > 50) return false;
  // Razorpay IDs start with specific prefixes
  if (!str.startsWith(prefix)) return false;
  // Only allow alphanumeric characters and underscores
  return /^[a-zA-Z0-9_]+$/.test(str);
}

function isValidSignature(str: unknown): boolean {
  if (typeof str !== 'string') return false;
  // Razorpay signatures are 64-character hex strings (SHA256)
  return /^[a-f0-9]{64}$/i.test(str);
}

function sanitizeString(str: string, maxLength: number = 255): string {
  if (typeof str !== 'string') return '';
  return str.replace(/[\x00-\x1F\x7F]/g, '').trim().substring(0, maxLength);
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

function isValidPostalCode(code: string): boolean {
  // Indian postal codes are 6 digits
  return /^\d{6}$/.test(code);
}

function isValidPhone(phone: string): boolean {
  // Allow digits, spaces, plus, hyphens, and parentheses
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  return /^\+?\d{10,15}$/.test(cleaned);
}

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

    // Parse and validate shipping address
    const shippingAddress = order.shipping_address as {
      full_name: string;
      address_line1: string;
      address_line2?: string;
      city: string;
      state: string;
      postal_code: string;
      phone?: string;
    };

    // Validate shipping address fields
    if (!shippingAddress.full_name || !shippingAddress.address_line1 || 
        !shippingAddress.city || !shippingAddress.state || !shippingAddress.postal_code) {
      console.error('Invalid shipping address data');
      return { success: false, error: 'Invalid shipping address' };
    }

    if (!isValidPostalCode(shippingAddress.postal_code)) {
      console.error('Invalid postal code:', shippingAddress.postal_code);
      return { success: false, error: 'Invalid postal code' };
    }

    if (!isValidEmail(order.email)) {
      console.error('Invalid email:', order.email);
      return { success: false, error: 'Invalid email address' };
    }

    // Fetch product dimensions
    const productIds = order.order_items.map((item: { product_id: string | null }) => item.product_id).filter(Boolean);
    let productsMap: Record<string, { id: string; weight: number; length: number; breadth: number; height: number; sku: string }> = {};
    
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

    // Format order items with sanitized data
    const orderItems = order.order_items.map((item: { product_name: string; product_id: string; quantity: number; unit_price: number }) => {
      const product = productsMap[item.product_id] || {};
      return {
        name: sanitizeString(item.product_name, 200),
        sku: sanitizeString(product.sku || `SKU-${item.product_id?.substring(0, 8) || 'ITEM'}`, 50),
        units: Math.min(Math.max(1, Math.round(item.quantity)), 1000), // Limit quantity
        selling_price: Math.min(Math.max(0, Number(item.unit_price)), 10000000), // Limit price
        discount: 0,
        tax: 0,
        hsn: '',
      };
    });

    // Create Shiprocket order with sanitized data
    const shiprocketPayload = {
      order_id: sanitizeString(order.order_number, 50),
      order_date: new Date(order.created_at).toISOString().split('T')[0],
      pickup_location: 'Primary',
      billing_customer_name: sanitizeString(shippingAddress.full_name?.split(' ')[0] || 'Customer', 50),
      billing_last_name: sanitizeString(shippingAddress.full_name?.split(' ').slice(1).join(' ') || '', 50),
      billing_address: sanitizeString(shippingAddress.address_line1, 200),
      billing_address_2: sanitizeString(shippingAddress.address_line2 || '', 200),
      billing_city: sanitizeString(shippingAddress.city, 100),
      billing_pincode: shippingAddress.postal_code, // Already validated
      billing_state: sanitizeString(shippingAddress.state, 100),
      billing_country: 'India',
      billing_email: order.email, // Already validated
      billing_phone: shippingAddress.phone && isValidPhone(shippingAddress.phone) 
        ? sanitizeString(shippingAddress.phone, 15) 
        : '9999999999',
      shipping_is_billing: true,
      order_items: orderItems,
      payment_method: 'Prepaid',
      sub_total: Math.min(Math.max(0, Number(order.subtotal)), 10000000),
      length: Math.min(maxLength, 150),
      breadth: Math.min(maxBreadth, 150),
      height: Math.min(maxHeight, 150),
      weight: Math.min(totalWeight, 50),
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

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = body;

    // Validate order_id
    if (!isValidUUID(order_id)) {
      console.error("Invalid order_id format:", order_id);
      throw new Error("Invalid order ID");
    }

    // Validate Razorpay order ID
    if (!isValidRazorpayId(razorpay_order_id, 'order_')) {
      console.error("Invalid razorpay_order_id format:", razorpay_order_id);
      throw new Error("Invalid payment order ID");
    }

    // Validate Razorpay payment ID
    if (!isValidRazorpayId(razorpay_payment_id, 'pay_')) {
      console.error("Invalid razorpay_payment_id format:", razorpay_payment_id);
      throw new Error("Invalid payment ID");
    }

    // Validate signature format
    if (!isValidSignature(razorpay_signature)) {
      console.error("Invalid signature format");
      throw new Error("Invalid payment signature format");
    }

    console.log('Verifying payment for order:', order_id);

    // Verify signature using HMAC SHA-256
    const signatureBody = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = await hmacSha256(RAZORPAY_KEY_SECRET, signatureBody);

    if (expectedSignature !== razorpay_signature) {
      console.error('Payment signature verification failed');
      throw new Error("Payment verification failed");
    }

    console.log('Payment signature verified successfully');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the order exists and matches the Razorpay order ID
    const { data: existingOrder, error: orderCheckError } = await supabase
      .from("orders")
      .select("id, razorpay_order_id, payment_status")
      .eq("id", order_id)
      .single();

    if (orderCheckError || !existingOrder) {
      console.error("Order not found:", order_id);
      throw new Error("Order not found");
    }

    // Verify Razorpay order ID matches
    if (existingOrder.razorpay_order_id !== razorpay_order_id) {
      console.error("Razorpay order ID mismatch:", existingOrder.razorpay_order_id, razorpay_order_id);
      throw new Error("Payment order mismatch");
    }

    // Prevent duplicate payment processing
    if (existingOrder.payment_status === 'paid') {
      console.log("Order already paid, returning success:", order_id);
      return new Response(
        JSON.stringify({
          success: true,
          message: "Payment already verified",
          already_processed: true,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update order status to paid/confirmed
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
    const message = error instanceof Error ? error.message : "Payment verification error";
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});