-- Add pickup_pincode column to store_settings for Shiprocket rate calculations
ALTER TABLE public.store_settings 
ADD COLUMN IF NOT EXISTS pickup_pincode TEXT DEFAULT '400001';