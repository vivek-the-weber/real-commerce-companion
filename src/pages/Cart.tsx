import { Link } from 'react-router-dom';
import { StoreLayout } from '@/components/layout/StoreLayout';
import { useCart } from '@/contexts/CartContext';
import { useStoreSettings } from '@/hooks/useOrders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';

export default function Cart() {
  const { items, loading, updateQuantity, removeFromCart, subtotal } = useCart();
  const { data: settings } = useStoreSettings();

  const shippingAmount = settings?.free_shipping_threshold && subtotal >= settings.free_shipping_threshold
    ? 0
    : settings?.flat_shipping_rate || 0;

  const total = subtotal + shippingAmount;

  if (loading) {
    return (
      <StoreLayout>
        <div className="container-store py-8">
          <h1 className="text-3xl font-display font-bold mb-8">Shopping Cart</h1>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </StoreLayout>
    );
  }

  if (items.length === 0) {
    return (
      <StoreLayout>
        <div className="container-store py-16">
          <div className="text-center max-w-md mx-auto">
            <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-display font-bold mb-2">Your cart is empty</h1>
            <p className="text-muted-foreground mb-8">
              Looks like you haven't added any items to your cart yet.
            </p>
            <Button asChild size="lg">
              <Link to="/shop">
                Start Shopping
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="container-store py-8">
        <h1 className="text-3xl font-display font-bold mb-8">Shopping Cart</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const price = item.variant?.price ?? item.product?.price ?? 0;
              const image = item.product?.images?.[0];

              return (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 bg-card border rounded-lg"
                >
                  {/* Product Image */}
                  <Link to={`/product/${item.product?.slug}`} className="shrink-0">
                    <div className="w-24 h-24 bg-muted rounded-lg overflow-hidden">
                      {image ? (
                        <img
                          src={image}
                          alt={item.product?.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <ShoppingBag className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/product/${item.product?.slug}`}
                      className="font-medium hover:text-primary transition-colors line-clamp-1"
                    >
                      {item.product?.name}
                    </Link>
                    {item.variant && (
                      <p className="text-sm text-muted-foreground">{item.variant.name}</p>
                    )}
                    <p className="text-primary font-semibold mt-1">
                      ₹{price.toLocaleString()}
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center border rounded-lg">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                          className="w-12 h-8 text-center border-0 p-0"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Item Total */}
                  <div className="text-right">
                    <p className="font-semibold">
                      ₹{(price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card border rounded-lg p-6 sticky top-24">
              <h2 className="text-lg font-display font-semibold mb-4">Order Summary</h2>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>
                    {shippingAmount === 0 ? (
                      <span className="text-accent">Free</span>
                    ) : (
                      `₹${shippingAmount.toLocaleString()}`
                    )}
                  </span>
                </div>
                {settings?.free_shipping_threshold && subtotal < settings.free_shipping_threshold && (
                  <p className="text-sm text-muted-foreground">
                    Add ₹{(settings.free_shipping_threshold - subtotal).toLocaleString()} more for free shipping
                  </p>
                )}
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between text-lg font-semibold mb-6">
                <span>Total</span>
                <span>₹{total.toLocaleString()}</span>
              </div>

              <Button asChild size="lg" className="w-full">
                <Link to="/checkout">
                  Proceed to Checkout
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              <div className="mt-4 text-center">
                <Link to="/shop" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
