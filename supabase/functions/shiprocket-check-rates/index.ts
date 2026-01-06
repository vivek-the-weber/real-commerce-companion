import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShippingRateRequest {
  delivery_pincode: string;
  weight: number; // in kg
  cod?: boolean;
}

interface CourierRate {
  courier_company_id: number;
  courier_name: string;
  rate: number;
  estimated_delivery_days: string;
  etd: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { delivery_pincode, weight, cod = false }: ShippingRateRequest = await req.json();

    if (!delivery_pincode || !weight) {
      throw new Error('delivery_pincode and weight are required');
    }

    // Validate pincode format (6 digits for India)
    if (!/^\d{6}$/.test(delivery_pincode)) {
      throw new Error('Invalid pincode format. Must be 6 digits.');
    }

    // Get store settings for pickup pincode
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: settings, error: settingsError } = await supabase
      .from('store_settings')
      .select('pickup_pincode, flat_shipping_rate')
      .limit(1)
      .maybeSingle();

    if (settingsError) {
      console.error('Error fetching store settings:', settingsError);
      throw new Error('Failed to fetch store settings');
    }

    const pickupPincode = settings?.pickup_pincode || '400001';
    const fallbackRate = settings?.flat_shipping_rate || 50;

    console.log(`Checking rates: ${pickupPincode} -> ${delivery_pincode}, weight: ${weight}kg`);

    // Authenticate with Shiprocket
    const email = Deno.env.get('SHIPROCKET_EMAIL');
    const password = Deno.env.get('SHIPROCKET_PASSWORD');

    if (!email || !password) {
      console.warn('Shiprocket credentials not configured, using fallback rate');
      return new Response(
        JSON.stringify({
          success: true,
          serviceable: true,
          rates: [],
          cheapest_rate: fallbackRate,
          fastest_option: null,
          fallback: true,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authResponse = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const authData = await authResponse.json();
    if (!authResponse.ok || !authData.token) {
      console.error('Shiprocket auth failed:', authData);
      throw new Error('Shiprocket authentication failed');
    }

    const token = authData.token;

    // Check courier serviceability
    const params = new URLSearchParams({
      pickup_postcode: pickupPincode,
      delivery_postcode: delivery_pincode,
      weight: weight.toString(),
      cod: cod ? '1' : '0',
    });

    console.log(`Calling Shiprocket serviceability API with params: ${params.toString()}`);

    const ratesResponse = await fetch(
      `https://apiv2.shiprocket.in/v1/external/courier/serviceability/?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const ratesData = await ratesResponse.json();
    console.log('Shiprocket rates response:', JSON.stringify(ratesData));

    if (!ratesResponse.ok) {
      console.error('Shiprocket rates API error:', ratesData);
      // Return fallback rate on API error
      return new Response(
        JSON.stringify({
          success: true,
          serviceable: true,
          rates: [],
          cheapest_rate: fallbackRate,
          fastest_option: null,
          fallback: true,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if pincode is serviceable
    const availableCouriers = ratesData.data?.available_courier_companies || [];
    
    if (availableCouriers.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          serviceable: false,
          rates: [],
          cheapest_rate: null,
          fastest_option: null,
          message: 'Delivery not available to this pincode',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse courier rates
    const rates: CourierRate[] = availableCouriers.map((courier: any) => ({
      courier_company_id: courier.courier_company_id,
      courier_name: courier.courier_name,
      rate: courier.rate || courier.freight_charge || 0,
      estimated_delivery_days: courier.estimated_delivery_days || courier.etd || 'N/A',
      etd: courier.etd || '',
    }));

    // Sort by rate to find cheapest
    const sortedByRate = [...rates].sort((a, b) => a.rate - b.rate);
    const cheapestRate = sortedByRate[0]?.rate || fallbackRate;

    // Sort by ETD to find fastest
    const sortedByEtd = [...rates].sort((a, b) => {
      const aDays = parseInt(a.estimated_delivery_days) || 99;
      const bDays = parseInt(b.estimated_delivery_days) || 99;
      return aDays - bDays;
    });
    const fastestOption = sortedByEtd[0] || null;

    console.log(`Found ${rates.length} couriers, cheapest: ₹${cheapestRate}`);

    return new Response(
      JSON.stringify({
        success: true,
        serviceable: true,
        rates: sortedByRate,
        cheapest_rate: cheapestRate,
        fastest_option: fastestOption,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in shiprocket-check-rates:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
