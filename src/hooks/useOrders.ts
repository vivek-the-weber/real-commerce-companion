import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Order, OrderItem } from '@/types/store';
import { useAuth } from '@/contexts/AuthContext';

interface ShippingAddress {
  full_name: string;
  phone?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export function useOrders() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['orders', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('orders')
        .select(`*, items:order_items(*)`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as Order[];
    },
    enabled: !!user,
  });
}

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`*, items:order_items(*)`)
        .eq('id', orderId)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as Order | null;
    },
    enabled: !!orderId,
  });
}

interface CreateOrderParams {
  email: string;
  shipping_address: ShippingAddress;
  items: Array<{
    product_id: string;
    variant_id?: string;
    product_name: string;
    variant_name?: string;
    quantity: number;
    unit_price: number;
  }>;
  subtotal: number;
  shipping_amount: number;
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: CreateOrderParams) => {
      const total = params.subtotal + params.shipping_amount;
      
      const orderData: any = {
        email: params.email,
        shipping_address: params.shipping_address,
        subtotal: params.subtotal,
        shipping_amount: params.shipping_amount,
        total,
      };

      if (user?.id) {
        orderData.user_id = user.id;
      }
      
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = params.items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        variant_id: item.variant_id || null,
        product_name: item.product_name,
        variant_name: item.variant_name || null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.unit_price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useStoreSettings() {
  return useQuery({
    queryKey: ['store-settings'],
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
}