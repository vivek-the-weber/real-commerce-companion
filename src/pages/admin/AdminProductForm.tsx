import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Save, Plus, X, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface VariantFormData {
  id?: string;
  name: string;
  image_url: string;
  stock_quantity: number;
  price?: number | null;
  sku?: string;
  isNew?: boolean;
}

const AdminProductForm = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = productId && productId !== 'new';

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    compare_at_price: '',
    sku: '',
    stock_quantity: '0',
    category_id: '',
    is_active: true,
    is_featured: false,
    images: [''],
  });

  const [variants, setVariants] = useState<VariantFormData[]>([]);
  const [deletedVariantIds, setDeletedVariantIds] = useState<string[]>([]);

  const { data: categories } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('*').order('name');
      return data || [];
    },
  });

  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ['admin-product', productId],
    queryFn: async () => {
      if (!isEditing) return null;
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!isEditing,
  });

  const { data: productVariants } = useQuery({
    queryKey: ['admin-product-variants', productId],
    queryFn: async () => {
      if (!isEditing) return [];
      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!isEditing,
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        slug: product.slug,
        description: product.description || '',
        price: product.price.toString(),
        compare_at_price: product.compare_at_price?.toString() || '',
        sku: product.sku || '',
        stock_quantity: product.stock_quantity.toString(),
        category_id: product.category_id || '',
        is_active: product.is_active,
        is_featured: product.is_featured,
        images: product.images?.length ? product.images : [''],
      });
    }
  }, [product]);

  useEffect(() => {
    if (productVariants) {
      setVariants(
        productVariants.map((v) => ({
          id: v.id,
          name: v.name,
          image_url: v.image_url || '',
          stock_quantity: v.stock_quantity,
          price: v.price,
          sku: v.sku || '',
        }))
      );
    }
  }, [productVariants]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: !isEditing || !prev.slug ? generateSlug(name) : prev.slug,
    }));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description || null,
        price: parseFloat(formData.price) || 0,
        compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
        sku: formData.sku || null,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        category_id: formData.category_id || null,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
        images: formData.images.filter((img) => img.trim()),
      };

      let savedProductId = productId;

      if (isEditing) {
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', productId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('products').insert(payload).select('id').single();
        if (error) throw error;
        savedProductId = data.id;
      }

      // Handle variant updates
      if (savedProductId) {
        // Delete removed variants
        for (const deletedId of deletedVariantIds) {
          await supabase.from('product_variants').delete().eq('id', deletedId);
        }

        // Update or insert variants
        for (const variant of variants) {
          if (variant.id && !variant.isNew) {
            // Update existing variant
            await supabase
              .from('product_variants')
              .update({
                name: variant.name,
                image_url: variant.image_url || null,
                stock_quantity: variant.stock_quantity,
                price: variant.price || null,
                sku: variant.sku || null,
              })
              .eq('id', variant.id);
          } else {
            // Insert new variant
            await supabase.from('product_variants').insert({
              product_id: savedProductId,
              name: variant.name,
              image_url: variant.image_url || null,
              stock_quantity: variant.stock_quantity,
              price: variant.price || null,
              sku: variant.sku || null,
            });
          }
        }
      }
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Product updated successfully' : 'Product created successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-product-variants'] });
      navigate('/admin/products');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save product');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.slug || !formData.price) {
      toast.error('Please fill in all required fields');
      return;
    }
    saveMutation.mutate();
  };

  const addImageField = () => {
    setFormData((prev) => ({ ...prev, images: [...prev.images, ''] }));
  };

  const removeImageField = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const updateImage = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.map((img, i) => (i === index ? value : img)),
    }));
  };

  // Variant management functions
  const addVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        name: '',
        image_url: '',
        stock_quantity: 0,
        price: null,
        sku: '',
        isNew: true,
      },
    ]);
  };

  const removeVariant = (index: number) => {
    const variant = variants[index];
    if (variant.id && !variant.isNew) {
      setDeletedVariantIds((prev) => [...prev, variant.id!]);
    }
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: keyof VariantFormData, value: string | number | null) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  };

  const availableImages = formData.images.filter((img) => img.trim());

  if (isEditing && productLoading) {
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
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin/products">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-display font-bold">
            {isEditing ? 'Edit Product' : 'New Product'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Info */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Product Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Product name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug *</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="product-slug"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Product description"
                    rows={4}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (₹) *</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="compare_at_price">Compare at Price (₹)</Label>
                    <Input
                      id="compare_at_price"
                      type="number"
                      value={formData.compare_at_price}
                      onChange={(e) => setFormData({ ...formData, compare_at_price: e.target.value })}
                      placeholder="0"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      placeholder="SKU-001"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Organization</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock Quantity</Label>
                    <Input
                      id="stock"
                      type="number"
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="is_active">Active</Label>
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="is_featured">Featured</Label>
                    <Switch
                      id="is_featured"
                      checked={formData.is_featured}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle>Images</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.images.map((image, index) => (
                <div key={index} className="flex gap-2 items-center">
                  {image && (
                    <img
                      src={image}
                      alt={`Product ${index + 1}`}
                      className="w-12 h-12 object-cover rounded border"
                    />
                  )}
                  <Input
                    value={image}
                    onChange={(e) => updateImage(index, e.target.value)}
                    placeholder="Image URL"
                    className="flex-1"
                  />
                  {formData.images.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeImageField(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addImageField}>
                <Plus className="mr-2 h-4 w-4" />
                Add Image
              </Button>
            </CardContent>
          </Card>

          {/* Variants */}
          {isEditing && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Variants (Color Options)</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Variant
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {variants.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No variants yet. Add color variants to link specific images.</p>
                ) : (
                  variants.map((variant, index) => (
                    <div key={variant.id || `new-${index}`} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start gap-4">
                        {/* Image Preview */}
                        <div className="flex-shrink-0">
                          {variant.image_url ? (
                            <img
                              src={variant.image_url}
                              alt={variant.name}
                              className="w-20 h-20 object-cover rounded border"
                            />
                          ) : (
                            <div className="w-20 h-20 bg-muted rounded border flex items-center justify-center text-xs text-muted-foreground">
                              No image
                            </div>
                          )}
                        </div>

                        {/* Variant Fields */}
                        <div className="flex-1 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                          <div className="space-y-1">
                            <Label className="text-xs">Variant Name *</Label>
                            <Input
                              value={variant.name}
                              onChange={(e) => updateVariant(index, 'name', e.target.value)}
                              placeholder="e.g., white, black"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Link to Image</Label>
                            <Select
                              value={variant.image_url || "__none__"}
                              onValueChange={(value) => updateVariant(index, 'image_url', value === "__none__" ? '' : value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select image" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__none__">No image</SelectItem>
                                {availableImages.map((img, imgIndex) => (
                                  <SelectItem key={imgIndex} value={img}>
                                    Image {imgIndex + 1}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Stock</Label>
                            <Input
                              type="number"
                              value={variant.stock_quantity}
                              onChange={(e) => updateVariant(index, 'stock_quantity', parseInt(e.target.value) || 0)}
                              min="0"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Price Override (₹)</Label>
                            <Input
                              type="number"
                              value={variant.price || ''}
                              onChange={(e) => updateVariant(index, 'price', e.target.value ? parseFloat(e.target.value) : null)}
                              placeholder="Use product price"
                              min="0"
                              step="0.01"
                            />
                          </div>
                        </div>

                        {/* Delete Button */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => removeVariant(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Custom URL fallback */}
                      <div className="pl-24">
                        <Label className="text-xs text-muted-foreground">Or enter custom image URL:</Label>
                        <Input
                          value={variant.image_url}
                          onChange={(e) => updateVariant(index, 'image_url', e.target.value)}
                          placeholder="https://..."
                          className="mt-1"
                        />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex gap-4">
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isEditing ? 'Update Product' : 'Create Product'}
                </>
              )}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link to="/admin/products">Cancel</Link>
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AdminProductForm;
