import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

interface TrysyProduct {
  product_name: string;
  size?: string;
  quantity: number;
  price: number;
}

const TRYSY_SDK_URL = 'https://trysy.lovable.app/api/public/sdk.js';
const TRYSY_STORE_ID = 'f8cde913-77d3-4544-b9b7-137797797091';
const TRYSY_API_KEY = 'trysy_live_50TOahxTjDDfDjKwqBMDwjg0VcRVdGas';

interface Props {
  externalOrderId: string;
  products: TrysyProduct[];
  totalOrderValue: number;
  onSuccess?: (payload: unknown) => void;
}

declare global {
  interface Window {
    Trysy?: {
      init: (config: Record<string, unknown>) => void;
      destroy?: () => void;
    };
  }
}

function loadTrysySdk(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.Trysy) return Promise.resolve();
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${TRYSY_SDK_URL}"]`);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Trysy SDK')));
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = TRYSY_SDK_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Trysy SDK'));
    document.head.appendChild(script);
  });
}

export function TrysyCheckout({ externalOrderId, products, totalOrderValue }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    loadTrysySdk()
      .then(() => {
        if (cancelled || !window.Trysy || !mountRef.current) return;
        window.Trysy.init({
          storeId: TRYSY_STORE_ID,
          apiKey: TRYSY_API_KEY,
          mount: '#trysy-mount',
          checkoutSelector: '#pay-button',
          successRedirectUrl: '/account/orders/{external_order_id}',
          redirectDelayMs: 1500,
          order: {
            external_order_id: externalOrderId,
            products,
            total_order_value: totalOrderValue,
          },
          onSuccess: (payload: unknown) => {
            console.log('Trysy order success:', payload);
            toast.success('Try-at-home order confirmed!');
          },
          onError: (err: unknown) => {
            console.warn('Trysy order failed:', err);
            toast.error('Try-at-home order failed. Please try again.');
          },
        });
      })
      .catch((err) => {
        console.error('Trysy SDK error:', err);
      });

    return () => {
      cancelled = true;
      window.Trysy?.destroy?.();
    };
  }, [externalOrderId, products, totalOrderValue]);

  return <div id="trysy-mount" ref={mountRef} />;
}
