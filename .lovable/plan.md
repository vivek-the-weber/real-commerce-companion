## Update Trysy integration to new SDK options

Trysy's SDK now supports `checkoutSelector`, `successRedirectUrl`, `onSuccess`, and `onError`. Wire these in so checkout interception is reliable and post-order behavior is explicit.

### Changes

**1. `src/pages/Checkout.tsx`**
- Add a stable `id="pay-button"` to the Razorpay "Pay" button on the payment step so Trysy can intercept it via `checkoutSelector`.

**2. `src/components/checkout/TrysyCheckout.tsx`**
- Extend `Trysy.init()` config with:
  - `checkoutSelector: "#pay-button"`
  - `successRedirectUrl: "/account/orders?order={external_order_id}"` (existing success page in app; uses `external_order_id` placeholder)
  - `redirectDelayMs: 1500`
  - `onSuccess(payload)`: toast success, log payload
  - `onError(err)`: toast error, log stage/status/issues
- Keep existing SDK loader, mount div, and cleanup.
- Remove the now-redundant `onOrderCreated` (replaced by `onSuccess`; legacy event still fires for back-compat per Trysy docs).

### Notes
- SDK script URL stays `https://trysy.lovable.app/api/public/sdk.js`.
- Order payload shape (`external_order_id`, `products`, `total_order_value`) is unchanged.
- Trysy will auto-disable the pay button when "Try Before You Buy" is checked, so no extra UI logic needed on our side.
