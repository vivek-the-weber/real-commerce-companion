-- Recreate the view with SECURITY INVOKER (explicitly set, which is the default)
DROP VIEW IF EXISTS public.public_store_settings;

CREATE VIEW public.public_store_settings 
WITH (security_invoker = true)
AS
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