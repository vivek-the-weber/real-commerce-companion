import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CartItem {
  product_id: string;
  quantity: number;
  product?: {
    weight?: number | null;
  } | null;
}

interface CourierRate {
  courier_company_id: number;
  courier_name: string;
  rate: number;
  estimated_delivery_days: string;
}

interface ShippingRatesResult {
  success: boolean;
  serviceable: boolean;
  rates: CourierRate[];
  cheapest_rate: number | null;
  fastest_option: CourierRate | null;
  fallback?: boolean;
  message?: string;
  error?: string;
}

interface UseShippingRatesReturn {
  rates: CourierRate[];
  cheapestRate: number | null;
  fastestOption: CourierRate | null;
  isLoading: boolean;
  error: string | null;
  isServiceable: boolean;
  isFallback: boolean;
}

export function useShippingRates(
  pincode: string,
  cartItems: CartItem[],
  enabled: boolean = true
): UseShippingRatesReturn {
  const [rates, setRates] = useState<CourierRate[]>([]);
  const [cheapestRate, setCheapestRate] = useState<number | null>(null);
  const [fastestOption, setFastestOption] = useState<CourierRate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isServiceable, setIsServiceable] = useState(true);
  const [isFallback, setIsFallback] = useState(false);
  
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastPincodeRef = useRef<string>('');

  useEffect(() => {
    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Reset state if pincode is invalid
    if (!enabled || !pincode || pincode.length !== 6 || !/^\d{6}$/.test(pincode)) {
      setRates([]);
      setCheapestRate(null);
      setFastestOption(null);
      setError(null);
      setIsServiceable(true);
      setIsFallback(false);
      lastPincodeRef.current = ''; // Reset to allow re-fetch when pincode becomes valid again
      return;
    }

    // Skip if same pincode
    if (pincode === lastPincodeRef.current) {
      return;
    }

    // Calculate total weight from cart items
    const totalWeight = cartItems.reduce((sum, item) => {
      const productWeight = item.product?.weight ?? 0.5; // Default 0.5kg
      return sum + (productWeight * item.quantity);
    }, 0);

    // Minimum weight 0.5kg
    const weight = Math.max(totalWeight, 0.5);

    // Debounce API call
    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      lastPincodeRef.current = pincode;

      try {
        const { data, error: invokeError } = await supabase.functions.invoke<ShippingRatesResult>(
          'shiprocket-check-rates',
          {
            body: {
              delivery_pincode: pincode,
              weight,
              cod: false,
            },
          }
        );

        if (invokeError) {
          throw new Error(invokeError.message || 'Failed to fetch shipping rates');
        }

        if (!data?.success) {
          throw new Error(data?.error || 'Failed to fetch shipping rates');
        }

        setRates(data.rates || []);
        setCheapestRate(data.cheapest_rate);
        setFastestOption(data.fastest_option);
        setIsServiceable(data.serviceable);
        setIsFallback(data.fallback || false);

        if (!data.serviceable) {
          setError(data.message || 'Delivery not available to this pincode');
        }
      } catch (err) {
        console.error('Error fetching shipping rates:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch shipping rates');
        setRates([]);
        setCheapestRate(null);
        setFastestOption(null);
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [pincode, cartItems, enabled]);

  return {
    rates,
    cheapestRate,
    fastestOption,
    isLoading,
    error,
    isServiceable,
    isFallback,
  };
}
