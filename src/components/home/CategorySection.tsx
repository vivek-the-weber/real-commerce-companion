import { Link } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

interface CategorySectionProps {
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

export function CategorySection({ title, categorySlug, products }: CategorySectionProps) {
  const isMobile = useIsMobile();

  if (!products || products.length === 0) return null;

  // On mobile, show only 4 products (2x2 grid)
  const displayProducts = isMobile ? products.slice(0, 4) : products.slice(0, 8);

  return (
    <section className={`${isMobile ? 'py-10' : 'py-12 md:py-16'}`}>
      <div className="container-store">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <h2 className={`font-display text-foreground ${isMobile ? 'text-xl' : 'text-2xl md:text-3xl'}`}>
            {title}
          </h2>
          {categorySlug && (
            <Link 
              to={`/shop?category=${categorySlug}`}
              className={`text-muted-foreground hover:text-foreground transition-colors ${isMobile ? 'text-xs' : 'text-sm'}`}
            >
              View all
            </Link>
          )}
        </div>

        {/* Products Grid */}
        <div className={`grid gap-3 md:gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'}`}>
          {displayProducts.map(product => {
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
                <div className={`space-y-0.5 md:space-y-1 ${isMobile ? 'mt-2' : 'mt-3'}`}>
                  <h3 className={`text-foreground line-clamp-2 group-hover:text-primary transition-colors ${isMobile ? 'text-xs' : 'text-sm'}`}>
                    {product.name}
                  </h3>
                  <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
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
