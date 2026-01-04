import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface ScrollableCategorySectionProps {
  title: string;
  categorySlug?: string;
  products: Array<{
    id: string;
    name: string;
    price: number;
    images?: string[] | null;
    slug: string;
  }>;
}

export function ScrollableCategorySection({ title, categorySlug, products }: ScrollableCategorySectionProps) {
  const isMobile = useIsMobile();

  if (!products || products.length === 0) return null;

  // Mobile: Show 4 products in 2x2 grid
  if (isMobile) {
    return (
      <section className="py-10">
        <div className="container-store">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-display text-foreground">
              {title}
            </h2>
            {categorySlug && (
              <Link 
                to={`/shop?category=${categorySlug}`}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                View all
              </Link>
            )}
          </div>

          {/* 2x2 Grid for Mobile */}
          <div className="grid grid-cols-2 gap-3">
            {products.slice(0, 4).map(product => {
              const imageUrl = product.images?.[0] || '/placeholder.svg';
              return (
                <Link
                  key={product.id}
                  to={`/product/${product.slug}`}
                  className="group block"
                >
                  <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-secondary">
                    <img
                      src={imageUrl}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="mt-2 space-y-0.5">
                    <h3 className="text-xs text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Rs. {product.price.toLocaleString('en-IN')}.00
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  // Desktop: Horizontal scrollable layout
  return (
    <section className="py-12 md:py-16">
      <div className="container-store">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-display text-foreground">
            {title}
          </h2>
          {categorySlug && (
            <Link 
              to={`/shop?category=${categorySlug}`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              View all
            </Link>
          )}
        </div>
      </div>

      {/* Scrollable Products Container */}
      <div className="relative">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-4 px-4 md:px-8 lg:px-16 pb-4">
            {products.slice(0, 6).map(product => {
              const imageUrl = product.images?.[0] || '/placeholder.svg';
              return (
                <Link
                  key={product.id}
                  to={`/product/${product.slug}`}
                  className="group block flex-shrink-0 w-[280px] md:w-[320px]"
                >
                  <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-secondary">
                    <img
                      src={imageUrl}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="mt-3 space-y-1">
                    <h3 className="text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Rs. {product.price.toLocaleString('en-IN')}.00
                    </p>
                  </div>
                </Link>
              );
            })}
            
            {/* Scroll hint arrow */}
            {products.length > 4 && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <div className="bg-background/80 backdrop-blur-sm rounded-full p-2 shadow-lg">
                  <ChevronRight className="w-6 h-6 text-foreground" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
