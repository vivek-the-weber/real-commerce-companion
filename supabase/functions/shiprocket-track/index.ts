import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const url = new URL(req.url);
    const awbCode = url.searchParams.get('awb_code');

    if (!awbCode) {
      throw new Error('awb_code is required');
    }

    console.log('Tracking shipment with AWB:', awbCode);

    // Get Shiprocket token
    const token = await getShiprocketToken();

    // Fetch tracking details
    const trackingResponse = await fetch(
      `https://apiv2.shiprocket.in/v1/external/courier/track/awb/${awbCode}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    const trackingData = await trackingResponse.json();

    if (!trackingResponse.ok) {
      console.error('Tracking failed:', trackingData);
      throw new Error(trackingData.message || 'Failed to fetch tracking details');
    }

    console.log('Tracking data:', trackingData);

    // Format tracking response
    const tracking = trackingData.tracking_data || trackingData;
    
    return new Response(
      JSON.stringify({
        success: true,
        current_status: tracking.shipment_status || tracking.current_status,
        tracking_events: tracking.shipment_track || tracking.track_activities || [],
        estimated_delivery: tracking.etd || null,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in shiprocket-track:', error);
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
