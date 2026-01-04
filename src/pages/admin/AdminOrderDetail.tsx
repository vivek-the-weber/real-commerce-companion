import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Package, Truck, ExternalLink, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import type { OrderStatus, PaymentStatus } from '@/types/store';

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

const AdminOrderDetail = () => {
  const { orderId } = useParams();
  const queryClient = useQueryClient();
  const [isShippingLoading, setIsShippingLoading] = useState(false);
  const [isAwbLoading, setIsAwbLoading] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ['admin-order', orderId],
    queryFn: async () => {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      const { data: items } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      return { ...orderData, items: items || [] };
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ status, payment_status }: { status?: OrderStatus; payment_status?: PaymentStatus }) => {
      const updates: any = {};
      if (status) updates.status = status;
      if (payment_status) updates.payment_status = payment_status;

      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Order updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update order');
    },
  });

  const handleShipWithShiprocket = async () => {
    if (!orderId) return;
    
    setIsShippingLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('shiprocket-create-order', {
        body: { order_id: orderId },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast.success('Order sent to Shiprocket successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-order', orderId] });
    } catch (error: any) {
      console.error('Shiprocket error:', error);
      toast.error(error.message || 'Failed to create Shiprocket order');
    } finally {
      setIsShippingLoading(false);
    }
  };

  const handleGenerateAwb = async () => {
    if (!orderId) return;
    
    setIsAwbLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('shiprocket-generate-awb', {
        body: { order_id: orderId },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast.success(`AWB generated: ${data.awb_code}`);
      queryClient.invalidateQueries({ queryKey: ['admin-order', orderId] });
    } catch (error: any) {
      console.error('AWB generation error:', error);
      toast.error(error.message || 'Failed to generate AWB');
    } finally {
      setIsAwbLoading(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">Order not found</p>
          <Button asChild>
            <Link to="/admin/orders">Back to Orders</Link>
          </Button>
        </div>
      </AdminLayout>
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

  const canShipWithShiprocket = order.payment_status === 'paid' && !order.shiprocket_order_id;
  const canGenerateAwb = order.shiprocket_order_id && !order.awb_code;
  const hasShiprocketData = order.shiprocket_order_id || order.awb_code;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin/orders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold">{order.order_number}</h1>
            <p className="text-sm text-muted-foreground">
              {format(new Date(order.created_at), 'PPP p')}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        {item.variant_name && (
                          <p className="text-sm text-muted-foreground">{item.variant_name}</p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          ₹{Number(item.unit_price).toLocaleString()} × {item.quantity}
                        </p>
                      </div>
                      <p className="font-medium">₹{Number(item.total_price).toLocaleString()}</p>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{Number(order.subtotal).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>
                      {Number(order.shipping_amount) === 0 ? 'Free' : `₹${Number(order.shipping_amount).toLocaleString()}`}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>₹{Number(order.total).toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle>Shipping Address</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  <p className="font-medium">{shippingAddress.full_name}</p>
                  <p className="text-muted-foreground">{shippingAddress.address_line1}</p>
                  {shippingAddress.address_line2 && (
                    <p className="text-muted-foreground">{shippingAddress.address_line2}</p>
                  )}
                  <p className="text-muted-foreground">
                    {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postal_code}
                  </p>
                  {shippingAddress.phone && (
                    <p className="mt-2">Phone: {shippingAddress.phone}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle>Order Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={order.status}
                    onValueChange={(value) => updateStatusMutation.mutate({ status: value as OrderStatus })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Payment Status</label>
                  <Select
                    value={order.payment_status}
                    onValueChange={(value) => updateStatusMutation.mutate({ payment_status: value as PaymentStatus })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Shiprocket Integration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Shiprocket Shipping
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Action Buttons */}
                {canShipWithShiprocket && (
                  <Button 
                    onClick={handleShipWithShiprocket} 
                    disabled={isShippingLoading}
                    className="w-full"
                  >
                    {isShippingLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Order...
                      </>
                    ) : (
                      <>
                        <Truck className="mr-2 h-4 w-4" />
                        Ship with Shiprocket
                      </>
                    )}
                  </Button>
                )}

                {canGenerateAwb && (
                  <Button 
                    onClick={handleGenerateAwb} 
                    disabled={isAwbLoading}
                    className="w-full"
                    variant="outline"
                  >
                    {isAwbLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating AWB...
                      </>
                    ) : (
                      <>
                        <Package className="mr-2 h-4 w-4" />
                        Generate AWB
                      </>
                    )}
                  </Button>
                )}

                {/* Shiprocket Details */}
                {hasShiprocketData && (
                  <div className="space-y-3 text-sm">
                    {order.shiprocket_order_id && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Shiprocket Order ID</span>
                        <span className="font-medium">{order.shiprocket_order_id}</span>
                      </div>
                    )}
                    {order.shiprocket_shipment_id && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Shipment ID</span>
                        <span className="font-medium">{order.shiprocket_shipment_id}</span>
                      </div>
                    )}
                    {order.awb_code && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">AWB Code</span>
                        <span className="font-medium">{order.awb_code}</span>
                      </div>
                    )}
                    {order.courier_name && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Courier</span>
                        <Badge variant="secondary">{order.courier_name}</Badge>
                      </div>
                    )}
                  </div>
                )}

                {/* Track Shipment Button */}
                {order.tracking_url && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    asChild
                  >
                    <a href={order.tracking_url} target="_blank" rel="noopener noreferrer">
                      <MapPin className="mr-2 h-4 w-4" />
                      Track Shipment
                      <ExternalLink className="ml-2 h-3 w-3" />
                    </a>
                  </Button>
                )}

                {/* No Shiprocket data yet */}
                {!hasShiprocketData && !canShipWithShiprocket && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    {order.payment_status !== 'paid' 
                      ? 'Payment must be completed before shipping'
                      : 'Shiprocket shipping not available'}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle>Customer</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{order.email}</p>
                {order.razorpay_payment_id && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Payment ID: {order.razorpay_payment_id}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminOrderDetail;
