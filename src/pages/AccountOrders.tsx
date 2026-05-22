import { Link } from 'react-router-dom';
import { useOrders } from '@/hooks/useOrders';
import AccountLayout from '@/components/account/AccountLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Package, ChevronRight } from 'lucide-react';
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

const AccountOrders = () => {
  const { data: orders, isLoading } = useOrders();

  return (
    <AccountLayout>
      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : !orders || orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No orders yet</p>
              <Button asChild>
                <Link to="/shop">Start Shopping</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  to={`/account/orders/${order.id}`}
                  className="block border rounded-lg p-4 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">{order.order_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(order.created_at), 'PPP')}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold">₹{order.total.toLocaleString()}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge className={statusColors[order.status] || ''} variant="secondary">
                            {order.status}
                          </Badge>
                          {order.is_trysy_handled ? (
                            <Badge className="bg-purple-100 text-purple-800" variant="secondary">
                              Trysy handled
                            </Badge>
                          ) : (
                            <Badge className={paymentStatusColors[order.payment_status] || ''} variant="secondary">
                              {order.payment_status}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AccountLayout>
  );
};

export default AccountOrders;
