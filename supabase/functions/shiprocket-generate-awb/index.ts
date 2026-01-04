import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getShiprocketToken(): Promise<string> {
  const email = Deno.env.get('SHIPROCKET_EMAIL');
  const password = Deno.env.get('SHIPROCKET_PASSWORD');

  const response = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Authentication failed');
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

    console.log('Generating AWB for order:', order_id);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch order to get Shiprocket shipment ID
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('shiprocket_shipment_id, shiprocket_order_id')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      console.error('Order fetch error:', orderError);
      throw new Error('Order not found');
    }

    if (!order.shiprocket_shipment_id) {
      throw new Error('Shiprocket shipment not created yet. Please create Shiprocket order first.');
    }

    console.log('Generating AWB for shipment:', order.shiprocket_shipment_id);

    // Get Shiprocket token
    const token = await getShiprocketToken();

    // Request courier assignment and AWB
    const awbResponse = await fetch('https://apiv2.shiprocket.in/v1/external/courier/assign/awb', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        shipment_id: order.shiprocket_shipment_id,
      }),
    });

    const awbData = await awbResponse.json();

    if (!awbResponse.ok) {
      console.error('AWB generation failed:', awbData);
      throw new Error(awbData.message || 'Failed to generate AWB');
    }

    console.log('AWB generated:', awbData);

    const awbCode = awbData.response?.data?.awb_code || awbData.awb_code;
    const courierName = awbData.response?.data?.courier_name || awbData.courier_name || 'Unknown';
    const trackingUrl = `https://shiprocket.co/tracking/${awbCode}`;

    // Update order with AWB details
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        awb_code: awbCode,
        courier_name: courierName,
        tracking_url: trackingUrl,
        status: 'shipped',
      })
      .eq('id', order_id);

    if (updateError) {
      console.error('Failed to update order:', updateError);
      throw new Error('Failed to update order with AWB details');
    }

    return new Response(
      JSON.stringify({
        success: true,
        awb_code: awbCode,
        courier_name: courierName,
        tracking_url: trackingUrl,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in shiprocket-generate-awb:', error);
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
