import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';

const AdminSettings = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    store_name: '',
    store_email: '',
    store_phone: '',
    flat_shipping_rate: '',
    free_shipping_threshold: '',
    pickup_pincode: '',
  });

  // Admin page uses the full store_settings table (admins have RLS access)
  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-store-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        store_name: settings.store_name || '',
        store_email: settings.store_email || '',
        store_phone: settings.store_phone || '',
        flat_shipping_rate: settings.flat_shipping_rate?.toString() || '0',
        free_shipping_threshold: settings.free_shipping_threshold?.toString() || '',
        pickup_pincode: (settings as any).pickup_pincode || '400001',
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        store_name: formData.store_name,
        store_email: formData.store_email || null,
        store_phone: formData.store_phone || null,
        flat_shipping_rate: parseFloat(formData.flat_shipping_rate) || 0,
        free_shipping_threshold: formData.free_shipping_threshold 
          ? parseFloat(formData.free_shipping_threshold) 
          : null,
        pickup_pincode: formData.pickup_pincode || '400001',
      };

      if (settings?.id) {
        const { error } = await supabase
          .from('store_settings')
          .update(payload)
          .eq('id', settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('store_settings').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Settings saved successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-store-settings'] });
      queryClient.invalidateQueries({ queryKey: ['public-store-settings'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save settings');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.store_name) {
      toast.error('Store name is required');
      return;
    }
    if (formData.pickup_pincode && !/^\d{6}$/.test(formData.pickup_pincode)) {
      toast.error('Pickup pincode must be 6 digits');
      return;
    }
    saveMutation.mutate();
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-display font-bold">Store Settings</h1>

        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>General</CardTitle>
              <CardDescription>Basic store information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="store_name">Store Name *</Label>
                <Input
                  id="store_name"
                  value={formData.store_name}
                  onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                  placeholder="My Store"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="store_email">Store Email</Label>
                <Input
                  id="store_email"
                  type="email"
                  value={formData.store_email}
                  onChange={(e) => setFormData({ ...formData, store_email: e.target.value })}
                  placeholder="contact@mystore.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="store_phone">Store Phone</Label>
                <Input
                  id="store_phone"
                  value={formData.store_phone}
                  onChange={(e) => setFormData({ ...formData, store_phone: e.target.value })}
                  placeholder="+91 1234567890"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipping</CardTitle>
              <CardDescription>Configure shipping rates and pickup location</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pickup_pincode">Pickup Pincode (Warehouse)</Label>
                <Input
                  id="pickup_pincode"
                  value={formData.pickup_pincode}
                  onChange={(e) => setFormData({ ...formData, pickup_pincode: e.target.value })}
                  placeholder="400001"
                  maxLength={6}
                />
                <p className="text-xs text-muted-foreground">
                  Your warehouse/store pincode for Shiprocket rate calculations.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="flat_shipping_rate">Fallback Shipping Rate (₹)</Label>
                <Input
                  id="flat_shipping_rate"
                  type="number"
                  value={formData.flat_shipping_rate}
                  onChange={(e) => setFormData({ ...formData, flat_shipping_rate: e.target.value })}
                  placeholder="50"
                  min="0"
                />
                <p className="text-xs text-muted-foreground">
                  Used when Shiprocket rates are unavailable.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="free_shipping_threshold">Free Shipping Threshold (₹)</Label>
                <Input
                  id="free_shipping_threshold"
                  type="number"
                  value={formData.free_shipping_threshold}
                  onChange={(e) => setFormData({ ...formData, free_shipping_threshold: e.target.value })}
                  placeholder="1000"
                  min="0"
                />
                <p className="text-xs text-muted-foreground">
                  Orders above this amount get free shipping. Leave empty to disable.
                </p>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
