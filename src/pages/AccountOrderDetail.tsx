import { useParams, Link } from 'react-router-dom';
import { useOrder } from '@/hooks/useOrders';
import AccountLayout from '@/components/account/AccountLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Loader2, ArrowLeft, Package, Clock } from 'lucide-react';
import OrderTracking from '@/components/account/OrderTracking';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const paymentStatusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
};

const AccountOrderDetail = () => {
  const { orderId } = useParams();
  const { data: order, isLoading } = useOrder(orderId || '');

  if (isLoading) {
    return (
      <AccountLayout>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </AccountLayout>
    );
  }

  if (!order) {
    return (
      <AccountLayout>
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Order not found</p>
            <Button asChild>
              <Link to="/account/orders">Back to Orders</Link>
            </Button>
          </CardContent>
        </Card>
      </AccountLayout>
    );
  }

  const shippingAddress = order.shipping_address as {
    full_name: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    postal_code: string;
    phone?: string;
  };

  return (
    <AccountLayout>
      <div className="space-y-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link to="/account/orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{order.order_number}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Placed on {format(new Date(order.created_at), 'PPP')}
                </p>
              </div>
              <div className="flex gap-2">
                <Badge className={statusColors[order.status] || ''} variant="secondary">
                  {order.status}
                </Badge>
                <Badge className={paymentStatusColors[order.payment_status] || ''} variant="secondary">
                  {order.payment_status}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Order Items */}
            <div>
              <h3 className="font-semibold mb-4">Items</h3>
              <div className="space-y-3">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">{item.product_name}</p>
                      {item.variant_name && (
                        <p className="text-sm text-muted-foreground">{item.variant_name}</p>
                      )}
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium">₹{item.total_price.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Order Summary */}
            <div>
              <h3 className="font-semibold mb-4">Order Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{order.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>
                    {order.shipping_amount === 0 ? 'Free' : `₹${order.shipping_amount.toLocaleString()}`}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>₹{order.total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Shipping Address */}
            <div>
              <h3 className="font-semibold mb-4">Shipping Address</h3>
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{shippingAddress.full_name}</p>
                <p>{shippingAddress.address_line1}</p>
                {shippingAddress.address_line2 && <p>{shippingAddress.address_line2}</p>}
                <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.postal_code}</p>
                {shippingAddress.phone && <p className="mt-1">Phone: {shippingAddress.phone}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipment Tracking Section */}
        {order.awb_code ? (
          <OrderTracking
            awbCode={order.awb_code}
            courierName={order.courier_name}
            trackingUrl={order.tracking_url}
          />
        ) : order.status !== 'cancelled' && order.payment_status === 'paid' && (
          <Card>
            <CardContent className="py-6">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Clock className="h-5 w-5" />
                <p className="text-sm">Your order is being prepared for shipping. Tracking information will be available once shipped.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AccountLayout>
  );
};

export default AccountOrderDetail;
