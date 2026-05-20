import { FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';

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

const TRYSY_CREATE_ORDER_URL = 'https://trysy.lovable.app/api/public/create-trysy-order';
const TRYSY_STORE_ID = 'f8cde913-77d3-4544-b9b7-137797797091';
const TRYSY_API_KEY = 'trysy_live_50TOahxTjDDfDjKwqBMDwjg0VcRVdGas';
const TRYSY_FEE = 99;

interface Props {
  externalOrderId: string;
  products: TrysyProduct[];
  totalOrderValue: number;
}

export function TrysyCheckout({ externalOrderId, products, totalOrderValue }: Props) {
  const [enabled, setEnabled] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    delivery_address: '',
    city: '',
    pincode: '',
    preferred_date: '',
    preferred_slot: '',
  });

  useEffect(() => {
    const handleOrderCreated = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      console.log('Trysy order created:', detail);
      toast.success('Try-at-home enabled with Trysy!');
    };

    window.addEventListener('trysy:order-created', handleOrderCreated as EventListener);
    return () => {
      window.removeEventListener('trysy:order-created', handleOrderCreated as EventListener);
    };
  }, []);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    setError(null);
    if (checked && !submitted) setModalOpen(true);
  };

  const submitTrysyOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const order: TrysyOrder = {
      external_order_id: externalOrderId,
      products,
      total_order_value: totalOrderValue,
      trysy_fee: TRYSY_FEE,
    };

    try {
      const response = await fetch(TRYSY_CREATE_ORDER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${TRYSY_API_KEY}`,
        },
        body: JSON.stringify({
          store_id: TRYSY_STORE_ID,
          ...order,
          customer_name: form.customer_name.trim(),
          customer_phone: form.customer_phone.replace(/\D/g, ''),
          customer_email: form.customer_email.trim() || null,
          delivery_address: form.delivery_address.trim(),
          city: form.city.trim(),
          pincode: form.pincode.trim(),
          notes:
            form.preferred_date || form.preferred_slot
              ? `Preferred: ${form.preferred_date || 'any date'} / ${form.preferred_slot || 'any slot'}`
              : null,
          is_trysy_enabled: true,
        }),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok && response.status !== 409) {
        const issue = body?.issues?.[0];
        throw new Error(issue?.message || body?.error || 'Unable to schedule Trysy right now.');
      }

      setSubmitted(true);
      setEnabled(true);
      setModalOpen(false);
      window.dispatchEvent(new CustomEvent('trysy:order-created', { detail: body }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to schedule Trysy right now.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="bg-card text-card-foreground border rounded-lg p-4">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => handleToggle(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-input accent-primary"
          />
          <span className="flex-1 space-y-1">
            <span className="flex items-center gap-2 font-medium">
              Enable try-at-home with Trysy
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                Free
              </span>
            </span>
            <span className="block text-sm text-muted-foreground">
              Try your clothes at home and pay only for what you keep.
            </span>
            {submitted && (
              <span className="block text-sm font-medium text-primary">
                Try-at-home has been enabled for this order.
              </span>
            )}
          </span>
        </label>
        {enabled && !submitted && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="mt-4 w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Schedule Trysy trial
          </button>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-lg border bg-card p-5 text-card-foreground shadow-lg">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">Schedule Trysy trial</h3>
                <p className="text-sm text-muted-foreground">Enter delivery details for try-at-home.</p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-md px-2 py-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Close Trysy form"
              >
                ×
              </button>
            </div>

            <form onSubmit={submitTrysyOrder} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <input className="rounded-md border bg-background px-3 py-2 text-sm" required placeholder="Full name" value={form.customer_name} onChange={(e) => updateField('customer_name', e.target.value)} />
                <input className="rounded-md border bg-background px-3 py-2 text-sm" required placeholder="Phone" inputMode="tel" value={form.customer_phone} onChange={(e) => updateField('customer_phone', e.target.value)} />
              </div>
              <input className="w-full rounded-md border bg-background px-3 py-2 text-sm" type="email" placeholder="Email (optional)" value={form.customer_email} onChange={(e) => updateField('customer_email', e.target.value)} />
              <textarea className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm" required placeholder="Delivery address" value={form.delivery_address} onChange={(e) => updateField('delivery_address', e.target.value)} />
              <div className="grid gap-3 sm:grid-cols-2">
                <input className="rounded-md border bg-background px-3 py-2 text-sm" required placeholder="City" value={form.city} onChange={(e) => updateField('city', e.target.value)} />
                <input className="rounded-md border bg-background px-3 py-2 text-sm" required placeholder="Pincode" inputMode="numeric" value={form.pincode} onChange={(e) => updateField('pincode', e.target.value)} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input className="rounded-md border bg-background px-3 py-2 text-sm" type="date" value={form.preferred_date} onChange={(e) => updateField('preferred_date', e.target.value)} />
                <input className="rounded-md border bg-background px-3 py-2 text-sm" placeholder="Preferred slot" value={form.preferred_slot} onChange={(e) => updateField('preferred_slot', e.target.value)} />
              </div>
              {error && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Scheduling…' : 'Schedule Trysy trial'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
