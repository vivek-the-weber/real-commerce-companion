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

interface TrysyCustomer {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  pincode?: string;
}

interface Props {
  externalOrderId: string;
  products: TrysyProduct[];
  totalOrderValue: number;
  onSuccess?: (payload: unknown) => void;
  customer?: TrysyCustomer;
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

export function TrysyCheckout({ externalOrderId, products, totalOrderValue, onSuccess, customer }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;
  const customerRef = useRef(customer);
  customerRef.current = customer;

  useEffect(() => {
    let cancelled = false;
    let observer: MutationObserver | null = null;

    const setVal = (input: HTMLInputElement | null, value: string | undefined) => {
      if (!input || !value) return;
      if (input.value) return; // don't overwrite user edits
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    };

    const autofill = () => {
      const root = mountRef.current;
      const c = customerRef.current;
      if (!root || !c) return false;
      const inputs = root.querySelectorAll<HTMLInputElement>('input.trysy-input');
      if (!inputs.length) return false;
      inputs.forEach((input) => {
        const ph = (input.getAttribute('placeholder') || '').toLowerCase();
        const type = (input.getAttribute('type') || '').toLowerCase();
        if (ph.includes('full name')) setVal(input, c.name);
        else if (type === 'tel') setVal(input, c.phone);
        else if (type === 'email') setVal(input, c.email);
        else if (ph.includes('house') || ph.includes('street')) setVal(input, c.address);
        else if (ph.includes('411001')) setVal(input, c.pincode);
        else if (type === 'text' && (input.value === 'Pune' || ph.includes('city'))) {
          if (c.city) {
            input.value = c.city;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
      });
      return true;
    };

    loadTrysySdk()
      .then(() => {
        if (cancelled || !window.Trysy || !mountRef.current) return;
        window.Trysy.init({
          storeId: TRYSY_STORE_ID,
          apiKey: TRYSY_API_KEY,
          mount: '#trysy-mount',
          checkoutSelector: '#pay-button',
          order: {
            external_order_id: externalOrderId,
            products,
            total_order_value: totalOrderValue,
          },
          onSuccess: (payload: unknown) => {
            console.log('Trysy order success:', payload);
            onSuccessRef.current?.(payload);
          },
          onError: (err: unknown) => {
            console.warn('Trysy order failed:', err);
            toast.error('Try-at-home order failed. Please try again.');
          },
        });

        // Watch for form mount and autofill
        if (mountRef.current) {
          observer = new MutationObserver(() => {
            autofill();
          });
          observer.observe(mountRef.current, { childList: true, subtree: true });
          autofill();
        }
      })
      .catch((err) => {
        console.error('Trysy SDK error:', err);
      });

    return () => {
      cancelled = true;
      observer?.disconnect();
      window.Trysy?.destroy?.();
    };
  }, [externalOrderId, products, totalOrderValue]);

  return <div id="trysy-mount" ref={mountRef} />;
}
