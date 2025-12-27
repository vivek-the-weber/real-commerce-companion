import { useParams, Link } from 'react-router-dom';
import { StoreLayout } from '@/components/layout/StoreLayout';
import { ProductGallery } from '@/components/products/ProductGallery';
import { ProductInfo } from '@/components/products/ProductInfo';
import { ProductGrid } from '@/components/products/ProductGrid';
import { useProduct, useProducts } from '@/hooks/useProducts';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight } from 'lucide-react';

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading } = useProduct(slug || '');
  const { data: relatedProducts } = useProducts({
    categorySlug: product?.category?.slug,
    limit: 4,
  });

  if (isLoading) {
    return (
      <StoreLayout>
        <div className="container-store py-8">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            <Skeleton className="aspect-square rounded-lg" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </StoreLayout>
    );
  }

  if (!product) {
    return (
      <StoreLayout>
        <div className="container-store py-16 text-center">
          <h1 className="text-2xl font-display font-bold mb-4">Product Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/shop" className="text-primary hover:underline">
            Continue Shopping
          </Link>
        </div>
      </StoreLayout>
    );
  }

  const filteredRelated = relatedProducts?.filter((p) => p.id !== product.id).slice(0, 4) || [];

  return (
    <StoreLayout>
      <div className="container-store py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link to="/shop" className="hover:text-foreground transition-colors">
            Shop
          </Link>
          {product.category && (
            <>
              <ChevronRight className="h-4 w-4" />
              <Link
                to={`/shop?categories=${product.category.slug}`}
                className="hover:text-foreground transition-colors"
              >
                {product.category.name}
              </Link>
            </>
          )}
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{product.name}</span>
        </nav>

        {/* Product Details */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 mb-16">
          <ProductGallery images={product.images || []} productName={product.name} />
          <ProductInfo product={product} />
        </div>

        {/* Product Description */}
        {product.description && (
          <div className="mb-16">
            <h2 className="text-2xl font-display font-bold mb-4">Description</h2>
            <div className="prose prose-neutral max-w-none">
              <p className="text-muted-foreground whitespace-pre-line">{product.description}</p>
            </div>
          </div>
        )}

        {/* Specifications */}
        {product.specifications && Object.keys(product.specifications).length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-display font-bold mb-4">Specifications</h2>
            <div className="bg-card border rounded-lg overflow-hidden">
              <table className="w-full">
                <tbody>
                  {Object.entries(product.specifications as Record<string, string>).map(([key, value], index) => (
                    <tr key={key} className={index % 2 === 0 ? 'bg-muted/50' : ''}>
                      <td className="px-4 py-3 font-medium">{key}</td>
                      <td className="px-4 py-3 text-muted-foreground">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Related Products */}
        {filteredRelated.length > 0 && (
          <div>
            <h2 className="text-2xl font-display font-bold mb-6">You May Also Like</h2>
            <ProductGrid products={filteredRelated} />
          </div>
        )}
      </div>
    </StoreLayout>
  );
}
