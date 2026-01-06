import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StoreLayout } from '@/components/layout/StoreLayout';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useStoreSettings, useCreateOrder } from '@/hooks/useOrders';
import { useShippingRates } from '@/hooks/useShippingRates';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ShoppingBag, Loader2, CreditCard, CheckCircle, Truck, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface AddressForm {
  full_name: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export default function Checkout() {
  const navigate = useNavigate();
  const { items, subtotal, clearCart, loading: cartLoading } = useCart();
  const { user } = useAuth();
  const { data: settings } = useStoreSettings();
  const createOrder = useCreateOrder();

  const [step, setStep] = useState<'address' | 'payment' | 'success'>('address');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const [address, setAddress] = useState<AddressForm>({
    full_name: '',
    email: user?.email || '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'India',
  });

  // Use shipping rates hook
  const {
    cheapestRate,
    fastestOption,
    isLoading: isLoadingRates,
    error: ratesError,
    isServiceable,
    isFallback,
  } = useShippingRates(
    address.postal_code,
    items.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity,
      product: item.product ? { weight: item.product.weight } : null,
    })),
    items.length > 0
  );

  // Calculate shipping amount
  const getShippingAmount = () => {
    // Check free shipping threshold first
    if (settings?.free_shipping_threshold && subtotal >= settings.free_shipping_threshold) {
      return 0;
    }
    
    // Use Shiprocket rate if available, otherwise fall back to flat rate
    if (cheapestRate !== null) {
      return cheapestRate;
    }
    
    return settings?.flat_shipping_rate || 0;
  };

  const shippingAmount = getShippingAmount();
  const total = subtotal + shippingAmount;

  const handleAddressChange = (field: keyof AddressForm, value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
  };

  const validateAddress = () => {
    const required: (keyof AddressForm)[] = [
      'full_name',
      'email',
      'phone',
      'address_line1',
      'city',
      'state',
      'postal_code',
    ];
    for (const field of required) {
      if (!address[field].trim()) {
        toast.error(`Please enter your ${field.replace('_', ' ')}`);
        return false;
      }
    }
    if (!/\S+@\S+\.\S+/.test(address.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    if (!/^\d{6}$/.test(address.postal_code)) {
      toast.error('Please enter a valid 6-digit pincode');
      return false;
    }
    if (!isServiceable) {
      toast.error('Delivery is not available to this pincode');
      return false;
    }
    return true;
  };

  const handleContinueToPayment = () => {
    if (validateAddress()) {
      setStep('payment');
    }
  };

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      // Create order first
      const orderItems = items.map((item) => ({
        product_id: item.product_id,
        variant_id: item.variant_id || undefined,
        product_name: item.product?.name || 'Unknown Product',
        variant_name: item.variant?.name,
        quantity: item.quantity,
        unit_price: item.variant?.price ?? item.product?.price ?? 0,
      }));

      const order = await createOrder.mutateAsync({
        email: address.email,
        shipping_address: {
          full_name: address.full_name,
          phone: address.phone,
          address_line1: address.address_line1,
          address_line2: address.address_line2 || undefined,
          city: address.city,
          state: address.state,
          postal_code: address.postal_code,
          country: address.country,
        },
        items: orderItems,
        subtotal,
        shipping_amount: shippingAmount,
      });

      // Call edge function to create Razorpay order
      const { data: razorpayData, error: razorpayError } = await supabase.functions.invoke(
        'create-razorpay-order',
        {
          body: {
            order_id: order.id,
            amount: Math.round(total * 100), // Amount in paise
          },
        }
      );

      if (razorpayError || !razorpayData) {
        console.error('Razorpay order creation error:', razorpayError);
        toast.error('Failed to initialize payment. Please try again.');
        setIsProcessing(false);
        return;
      }

      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Failed to load payment gateway. Please try again.');
        setIsProcessing(false);
        return;
      }

      const options = {
        key: razorpayData.razorpay_key_id,
        amount: razorpayData.amount,
        currency: razorpayData.currency || 'INR',
        name: settings?.store_name || 'Store',
        description: `Order Payment`,
        order_id: razorpayData.razorpay_order_id,
        prefill: {
          name: address.full_name,
          email: address.email,
          contact: address.phone,
        },
        theme: {
          color: '#d97706',
        },
        handler: async function (response: any) {
          // Verify payment via edge function
          const { error: verifyError } = await supabase.functions.invoke(
            'verify-razorpay-payment',
            {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                order_id: order.id,
              },
            }
          );

          if (verifyError) {
            console.error('Payment verification error:', verifyError);
            toast.error('Payment verification failed. Please contact support.');
            return;
          }

          // Payment successful
          await clearCart();
          setOrderId(order.id);
          setStep('success');
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function () {
        toast.error('Payment failed. Please try again.');
      });
      razorpay.open();
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to process order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (cartLoading) {
    return (
      <StoreLayout>
        <div className="container-store py-8 max-w-4xl">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </StoreLayout>
    );
  }

  if (items.length === 0 && step !== 'success') {
    return (
      <StoreLayout>
        <div className="container-store py-16">
          <div className="text-center max-w-md mx-auto">
            <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-display font-bold mb-2">Your cart is empty</h1>
            <p className="text-muted-foreground mb-8">
              Add some items to your cart to checkout.
            </p>
            <Button asChild size="lg">
              <Link to="/shop">Start Shopping</Link>
            </Button>
          </div>
        </div>
      </StoreLayout>
    );
  }

  if (step === 'success') {
    return (
      <StoreLayout>
        <div className="container-store py-16">
          <div className="text-center max-w-md mx-auto">
            <CheckCircle className="h-16 w-16 mx-auto text-accent mb-4" />
            <h1 className="text-2xl font-display font-bold mb-2">Order Placed Successfully!</h1>
            <p className="text-muted-foreground mb-8">
              Thank you for your order. We'll send you a confirmation email shortly.
            </p>
            {orderId && (
              <p className="text-sm text-muted-foreground mb-8">
                Order ID: {orderId}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user && (
                <Button asChild variant="outline">
                  <Link to="/account/orders">View Orders</Link>
                </Button>
              )}
              <Button asChild>
                <Link to="/shop">Continue Shopping</Link>
              </Button>
            </div>
          </div>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="container-store py-8 max-w-4xl">
        <h1 className="text-3xl font-display font-bold mb-8">Checkout</h1>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${step === 'address' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'address' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                1
              </div>
              <span className="font-medium">Address</span>
            </div>
            <div className="w-12 h-px bg-border" />
            <div className={`flex items-center gap-2 ${step === 'payment' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'payment' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                2
              </div>
              <span className="font-medium">Payment</span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Form Section */}
          <div>
            {step === 'address' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold mb-4">Shipping Address</h2>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      value={address.full_name}
                      onChange={(e) => handleAddressChange('full_name', e.target.value)}
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={address.email}
                      onChange={(e) => handleAddressChange('email', e.target.value)}
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={address.phone}
                      onChange={(e) => handleAddressChange('phone', e.target.value)}
                      placeholder="+91 98765 43210"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="address_line1">Address Line 1 *</Label>
                    <Input
                      id="address_line1"
                      value={address.address_line1}
                      onChange={(e) => handleAddressChange('address_line1', e.target.value)}
                      placeholder="Street address, building name"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="address_line2">Address Line 2</Label>
                    <Input
                      id="address_line2"
                      value={address.address_line2}
                      onChange={(e) => handleAddressChange('address_line2', e.target.value)}
                      placeholder="Apartment, suite, unit (optional)"
                    />
                  </div>

                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={address.city}
                      onChange={(e) => handleAddressChange('city', e.target.value)}
                      placeholder="Mumbai"
                    />
                  </div>

                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      value={address.state}
                      onChange={(e) => handleAddressChange('state', e.target.value)}
                      placeholder="Maharashtra"
                    />
                  </div>

                  <div>
                    <Label htmlFor="postal_code">Postal Code *</Label>
                    <Input
                      id="postal_code"
                      value={address.postal_code}
                      onChange={(e) => handleAddressChange('postal_code', e.target.value)}
                      placeholder="400001"
                      maxLength={6}
                    />
                    {/* Shipping Rate Display */}
                    {address.postal_code.length === 6 && (
                      <div className="mt-2">
                        {isLoadingRates ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Checking delivery...</span>
                          </div>
                        ) : !isServiceable ? (
                          <div className="flex items-center gap-2 text-sm text-destructive">
                            <AlertCircle className="h-3 w-3" />
                            <span>Delivery not available to this pincode</span>
                          </div>
                        ) : cheapestRate !== null ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Truck className="h-3 w-3" />
                            <span>
                              {settings?.free_shipping_threshold && subtotal >= settings.free_shipping_threshold ? (
                                <span className="text-accent">Free shipping!</span>
                              ) : (
                                <>
                                  Shipping: ₹{cheapestRate}
                                  {fastestOption && ` (${fastestOption.estimated_delivery_days} days)`}
                                  {isFallback && ' (standard)'}
                                </>
                              )}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={address.country}
                      onChange={(e) => handleAddressChange('country', e.target.value)}
                      disabled
                    />
                  </div>
                </div>

                <Button
                  size="lg"
                  className="w-full mt-6"
                  onClick={handleContinueToPayment}
                  disabled={isLoadingRates || !isServiceable}
                >
                  {isLoadingRates ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking delivery...
                    </>
                  ) : (
                    'Continue to Payment'
                  )}
                </Button>
              </div>
            )}

            {step === 'payment' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold mb-4">Payment</h2>

                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="font-medium mb-2">Shipping to:</h3>
                  <p className="text-sm text-muted-foreground">
                    {address.full_name}<br />
                    {address.address_line1}<br />
                    {address.address_line2 && <>{address.address_line2}<br /></>}
                    {address.city}, {address.state} {address.postal_code}<br />
                    {address.country}
                  </p>
                  <Button
                    variant="link"
                    className="p-0 h-auto mt-2"
                    onClick={() => setStep('address')}
                  >
                    Edit Address
                  </Button>
                </div>

                <div className="bg-card border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <CreditCard className="h-6 w-6 text-primary" />
                    <div>
                      <h3 className="font-medium">Razorpay Secure Checkout</h3>
                      <p className="text-sm text-muted-foreground">
                        Pay with UPI, Cards, Net Banking, or Wallets
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="w-full mt-6"
                  onClick={handlePayment}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Pay ₹${total.toLocaleString()}`
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-card border rounded-lg p-6 sticky top-24">
              <h2 className="text-lg font-display font-semibold mb-4">Order Summary</h2>

              <div className="space-y-3 mb-4">
                {items.map((item) => {
                  const price = item.variant?.price ?? item.product?.price ?? 0;
                  return (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-16 h-16 bg-muted rounded overflow-hidden shrink-0">
                        {item.product?.images?.[0] ? (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm line-clamp-1">{item.product?.name}</p>
                        {item.variant && (
                          <p className="text-xs text-muted-foreground">{item.variant.name}</p>
                        )}
                        <p className="text-sm">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-medium text-sm">₹{(price * item.quantity).toLocaleString()}</p>
                    </div>
                  );
                })}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>
                    {isLoadingRates && address.postal_code.length === 6 ? (
                      <span className="text-muted-foreground">Calculating...</span>
                    ) : shippingAmount === 0 ? (
                      <span className="text-accent">Free</span>
                    ) : (
                      `₹${shippingAmount.toLocaleString()}`
                    )}
                  </span>
                </div>
                {fastestOption && !isFallback && address.postal_code.length === 6 && isServiceable && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Delivery</span>
                    <span className="text-muted-foreground">
                      {fastestOption.courier_name} ({fastestOption.estimated_delivery_days} days)
                    </span>
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>₹{total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
