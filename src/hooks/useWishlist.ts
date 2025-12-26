import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { WishlistItem, Product } from '@/types/store';
import { toast } from 'sonner';

export function useWishlist() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['wishlist', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('wishlist')
        .select(`
          *,
          product:products(*)
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      
      return (data || []).map((item: any) => ({
        ...item,
        product: item.product as Product,
      })) as WishlistItem[];
    },
    enabled: !!user,
  });
}

export function useToggleWishlist() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error('Please sign in to add to wishlist');

      const { data: existing } = await supabase
        .from('wishlist')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('wishlist')
          .delete()
          .eq('id', existing.id);
        if (error) throw error;
        return { added: false };
      } else {
        const { error } = await supabase
          .from('wishlist')
          .insert({ user_id: user.id, product_id: productId });
        if (error) throw error;
        return { added: true };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success(result.added ? 'Added to wishlist' : 'Removed from wishlist');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useIsInWishlist(productId: string) {
  const { data: wishlist } = useWishlist();
  return wishlist?.some(item => item.product_id === productId) ?? false;
}