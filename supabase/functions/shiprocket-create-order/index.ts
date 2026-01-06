import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getShiprocketToken(): Promise<string | null> {
  const email = Deno.env.get('SHIPROCKET_EMAIL');
  const password = Deno.env.get('SHIPROCKET_PASSWORD');

  if (!email || !password) {
    console.error('Shiprocket credentials not configured');
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_id } = await req.json();

    if (!order_id) {
      throw new Error('order_id is required');
    }

    console.log('Creating Shiprocket order for:', order_id);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch order with items
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      console.error('Order fetch error:', orderError);
      throw new Error('Order not found');
    }

    console.log('Order fetched:', order.order_number);

    // Get Shiprocket token
    const token = await getShiprocketToken();

    // If Shiprocket auth fails, still mark order as processing but skip Shiprocket
    if (!token) {
      console.log('Shiprocket auth failed, updating order status without Shiprocket integration');
      
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'processing' })
        .eq('id', order_id);

      if (updateError) {
        console.error('Failed to update order status:', updateError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          shiprocket_order_id: null,
          shiprocket_shipment_id: null,
          message: 'Order processed without Shiprocket - credentials not configured or invalid',
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
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

    // Fetch product dimensions for the order items
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

    // Calculate total dimensions (use largest item's dimensions, sum weights)
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

    // Ensure minimum weight
    if (totalWeight < 0.5) totalWeight = 0.5;

    // Format order items for Shiprocket
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

    // Create Shiprocket order payload
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

    // Create order in Shiprocket
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
      throw new Error(shiprocketData.message || 'Failed to create Shiprocket order');
    }

    console.log('Shiprocket order created:', shiprocketData);

    // Update order with Shiprocket IDs
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        shiprocket_order_id: String(shiprocketData.order_id),
        shiprocket_shipment_id: String(shiprocketData.shipment_id),
        status: 'processing',
      })
      .eq('id', order_id);

    if (updateError) {
      console.error('Failed to update order:', updateError);
      throw new Error('Failed to update order with Shiprocket details');
    }

    return new Response(
      JSON.stringify({
        success: true,
        shiprocket_order_id: shiprocketData.order_id,
        shiprocket_shipment_id: shiprocketData.shipment_id,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in shiprocket-create-order:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
