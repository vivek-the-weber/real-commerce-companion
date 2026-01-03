import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCategories } from '@/hooks/useProducts';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface BulkEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  onSuccess: () => void;
}

const BulkEditDialog = ({ open, onOpenChange, selectedIds, onSuccess }: BulkEditDialogProps) => {
  const queryClient = useQueryClient();
  const { data: categories } = useCategories();

  // Track which fields to update
  const [updateCategory, setUpdateCategory] = useState(false);
  const [updatePrice, setUpdatePrice] = useState(false);
  const [updateStatus, setUpdateStatus] = useState(false);

  // Field values
  const [categoryId, setCategoryId] = useState<string>('');
  const [priceType, setPriceType] = useState<'absolute' | 'percentage'>('absolute');
  const [priceValue, setPriceValue] = useState('');
  const [isActive, setIsActive] = useState(true);

  const bulkUpdateMutation = useMutation({
    mutationFn: async () => {
      const updates: Record<string, any> = {};

      if (updateCategory && categoryId) {
        updates.category_id = categoryId === 'none' ? null : categoryId;
      }

      if (updateStatus) {
        updates.is_active = isActive;
      }

      // If we're updating category or status (non-price updates)
      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from('products')
          .update(updates)
          .in('id', selectedIds);

        if (error) throw error;
      }

      // Handle price updates separately (need to fetch current prices for percentage)
      if (updatePrice && priceValue) {
        if (priceType === 'absolute') {
          const newPrice = parseFloat(priceValue);
          if (isNaN(newPrice) || newPrice < 0) throw new Error('Invalid price value');

          const { error } = await supabase
            .from('products')
            .update({ price: newPrice })
            .in('id', selectedIds);

          if (error) throw error;
        } else {
          // Percentage change - need to fetch and update each product
          const percentageChange = parseFloat(priceValue) / 100;
          if (isNaN(percentageChange)) throw new Error('Invalid percentage value');

          const { data: products, error: fetchError } = await supabase
            .from('products')
            .select('id, price')
            .in('id', selectedIds);

          if (fetchError) throw fetchError;

          // Update each product with new price
          for (const product of products || []) {
            const newPrice = Math.round(product.price * (1 + percentageChange));
            const { error } = await supabase
              .from('products')
              .update({ price: Math.max(0, newPrice) })
              .eq('id', product.id);

            if (error) throw error;
          }
        }
      }
    },
    onSuccess: () => {
      toast.success(`Successfully updated ${selectedIds.length} products`);
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      resetForm();
      onSuccess();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update products');
    },
  });

  const resetForm = () => {
    setUpdateCategory(false);
    setUpdatePrice(false);
    setUpdateStatus(false);
    setCategoryId('');
    setPriceType('absolute');
    setPriceValue('');
    setIsActive(true);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  const canSubmit = updateCategory || updatePrice || updateStatus;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Bulk Edit Products</DialogTitle>
          <DialogDescription>
            Update {selectedIds.length} selected product{selectedIds.length > 1 ? 's' : ''}. 
            Select the fields you want to change.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Category Update */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="update-category"
                checked={updateCategory}
                onCheckedChange={(checked) => setUpdateCategory(checked === true)}
              />
              <Label htmlFor="update-category" className="font-medium">
                Change Category
              </Label>
            </div>
            {updateCategory && (
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Category</SelectItem>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Price Update */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="update-price"
                checked={updatePrice}
                onCheckedChange={(checked) => setUpdatePrice(checked === true)}
              />
              <Label htmlFor="update-price" className="font-medium">
                Change Price
              </Label>
            </div>
            {updatePrice && (
              <div className="space-y-2">
                <Select value={priceType} onValueChange={(v) => setPriceType(v as 'absolute' | 'percentage')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="absolute">Set Absolute Price</SelectItem>
                    <SelectItem value="percentage">Percentage Change</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative">
                  {priceType === 'absolute' && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                  )}
                  <Input
                    type="number"
                    placeholder={priceType === 'absolute' ? 'Enter price' : 'e.g. 10 for +10%, -10 for -10%'}
                    value={priceValue}
                    onChange={(e) => setPriceValue(e.target.value)}
                    className={priceType === 'absolute' ? 'pl-7' : ''}
                  />
                  {priceType === 'percentage' && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Status Update */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="update-status"
                checked={updateStatus}
                onCheckedChange={(checked) => setUpdateStatus(checked === true)}
              />
              <Label htmlFor="update-status" className="font-medium">
                Change Status
              </Label>
            </div>
            {updateStatus && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="is-active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
                <Label htmlFor="is-active">
                  {isActive ? 'Active' : 'Inactive'}
                </Label>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => bulkUpdateMutation.mutate()}
            disabled={!canSubmit || bulkUpdateMutation.isPending}
          >
            {bulkUpdateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update {selectedIds.length} Product{selectedIds.length > 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkEditDialog;
