-- Create a public view for store settings that excludes sensitive fields
CREATE OR REPLACE VIEW public.public_store_settings AS
SELECT 
  id,
  store_name,
  store_email,
  store_phone,
  currency,
  flat_shipping_rate,
  free_shipping_threshold,
  pickup_pincode,
  created_at,
  updated_at
FROM public.store_settings;

-- Grant SELECT on the view to authenticated and anon users
GRANT SELECT ON public.public_store_settings TO anon;
GRANT SELECT ON public.public_store_settings TO authenticated;

-- Drop the overly permissive public SELECT policy on store_settings
DROP POLICY IF EXISTS "Anyone can view store settings" ON public.store_settings;

-- Create a new policy that only allows admins to view store_settings directly
-- (which includes the sensitive razorpay_key_id)
CREATE POLICY "Only admins can view store settings" 
ON public.store_settings 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));