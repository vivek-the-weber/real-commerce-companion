import { Link } from 'react-router-dom';

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
  if (!products || products.length === 0) return null;

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

        {/* Products Grid - 8 products in 4x2 grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.slice(0, 8).map(product => {
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
        </div>
      </div>
    </section>
  );
}