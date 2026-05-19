import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

declare global {
  interface Window {
    Trysy?: {
      init: (config: TrysyConfig) => void;
    };
  }
}

interface TrysyProduct {
  product_name: string;
  size?: string;
  quantity: number;
  price: number;
}

interface TrysyOrder {
  external_order_id: string;
  products: TrysyProduct[];
  total_order_value: number;
  trysy_fee: number;
}

interface TrysyConfig {
  storeId: string;
  apiKey: string;
  mount: string | HTMLElement;
  order: TrysyOrder;
}

const TRYSY_SDK_URL = 'https://trysy.lovable.app/api/public/sdk.js';
const TRYSY_STORE_ID = 'f8cde913-77d3-4544-b9b7-137797797091';
const TRYSY_API_KEY = 'trysy_live_50TOahxTjDDfDjKwqBMDwjg0VcRVdGas';
const TRYSY_FEE = 99;

interface Props {
  externalOrderId: string;
  products: TrysyProduct[];
  totalOrderValue: number;
}

function loadTrysySdk(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Trysy) {
      resolve(true);
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${TRYSY_SDK_URL}"]`
    );
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }
    const script = document.createElement('script');
    script.src = TRYSY_SDK_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function TrysyCheckout({ externalOrderId, products, totalOrderValue }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const handleOrderCreated = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      console.log('Trysy order created:', detail);
      toast.success('Try-at-home enabled with Trysy!');
    };

    window.addEventListener('trysy:order-created', handleOrderCreated as EventListener);

    (async () => {
      const ok = await loadTrysySdk();
      if (!ok || cancelled || !mountRef.current || !window.Trysy) return;
      if (initializedRef.current) return;
      initializedRef.current = true;

      try {
        window.Trysy.init({
          storeId: TRYSY_STORE_ID,
          apiKey: TRYSY_API_KEY,
          mount: mountRef.current,
          order: {
            external_order_id: externalOrderId,
            products,
            total_order_value: totalOrderValue,
            trysy_fee: TRYSY_FEE,
          },
        });
      } catch (err) {
        console.error('Failed to initialize Trysy:', err);
      }
    })();

    return () => {
      cancelled = true;
      window.removeEventListener('trysy:order-created', handleOrderCreated as EventListener);
    };
  }, [externalOrderId, products, totalOrderValue]);

  return (
    <div className="bg-card border rounded-lg p-4">
      <div id="trysy-mount" ref={mountRef} />
    </div>
  );
}
