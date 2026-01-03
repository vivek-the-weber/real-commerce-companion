import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Product, Category } from '@/types/store';

export function useProducts(options?: {
  categorySlug?: string;
  featured?: boolean;
  search?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['products', options],
    queryFn: async () => {
      // If filtering by category, first get the category ID
      let categoryId: string | null = null;
      if (options?.categorySlug) {
        const { data: category } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', options.categorySlug)
          .maybeSingle();
        categoryId = category?.id || null;
      }

      let query = supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          variants:product_variants(*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (options?.featured) {
        query = query.eq('is_featured', true);
      }

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      if (options?.search) {
        query = query.ilike('name', `%${options.search}%`);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      return (data || []).map((item: any) => ({
        ...item,
        category: item.category as Category | undefined,
        variants: item.variants || [],
      })) as Product[];
    },
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          variants:product_variants(*)
        `)
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      
      return {
        ...data,
        category: data.category as Category | undefined,
        variants: data.variants || [],
      } as Product;
    },
    enabled: !!slug,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Category[];
    },
  });
}

export function useCategory(slug: string) {
  return useQuery({
    queryKey: ['category', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error) throw error;
      return data as Category | null;
    },
    enabled: !!slug,
  });
}