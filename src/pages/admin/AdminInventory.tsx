import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Search, Edit2, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';

const AdminInventory = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editProduct, setEditProduct] = useState<any>(null);
  const [newStock, setNewStock] = useState('');

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-inventory', search],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('id, name, sku, stock_quantity, is_active')
        .order('stock_quantity', { ascending: true });

      if (search) {
        query = query.ilike('name', `%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const updateStockMutation = useMutation({
    mutationFn: async ({ id, stock }: { id: string; stock: number }) => {
      const { error } = await supabase
        .from('products')
        .update({ stock_quantity: stock })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Stock updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-inventory'] });
      setEditProduct(null);
      setNewStock('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update stock');
    },
  });

  const handleUpdateStock = () => {
    if (!editProduct || newStock === '') return;
    const stock = parseInt(newStock);
    if (isNaN(stock) || stock < 0) {
      toast.error('Please enter a valid stock quantity');
      return;
    }
    updateStockMutation.mutate({ id: editProduct.id, stock });
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-800', icon: AlertTriangle };
    if (quantity < 10) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle };
    return { label: 'In Stock', color: 'bg-green-100 text-green-800', icon: CheckCircle };
  };

  const lowStockCount = products?.filter(p => p.stock_quantity < 10).length || 0;
  const outOfStockCount = products?.filter(p => p.stock_quantity === 0).length || 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-display font-bold">Inventory</h1>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products?.length || 0}</div>
            </CardContent>
          </Card>
          <Card className={lowStockCount > 0 ? 'border-yellow-200 bg-yellow-50/50' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Low Stock Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{lowStockCount}</div>
            </CardContent>
          </Card>
          <Card className={outOfStockCount > 0 ? 'border-red-200 bg-red-50/50' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Out of Stock
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{outOfStockCount}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !products || products.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No products found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => {
                    const status = getStockStatus(product.stock_quantity);
                    const StatusIcon = status.icon;
                    
                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.sku || '-'}</TableCell>
                        <TableCell>
                          <span className={product.stock_quantity < 10 ? 'text-red-600 font-semibold' : ''}>
                            {product.stock_quantity}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={status.color} variant="secondary">
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditProduct(product);
                              setNewStock(product.stock_quantity.toString());
                            }}
                          >
                            <Edit2 className="h-4 w-4 mr-2" />
                            Update Stock
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!editProduct} onOpenChange={() => setEditProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Stock - {editProduct?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="stock">Stock Quantity</Label>
              <Input
                id="stock"
                type="number"
                value={newStock}
                onChange={(e) => setNewStock(e.target.value)}
                min="0"
                placeholder="Enter stock quantity"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleUpdateStock} disabled={updateStockMutation.isPending}>
                {updateStockMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Stock'
                )}
              </Button>
              <Button variant="outline" onClick={() => setEditProduct(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminInventory;
