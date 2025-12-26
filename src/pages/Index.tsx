import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { StoreLayout } from '@/components/layout/StoreLayout';
import { ProductGrid } from '@/components/products/ProductGrid';
import { Button } from '@/components/ui/button';
import { useProducts, useCategories } from '@/hooks/useProducts';

const Index = () => {
  const { data: featuredProducts, isLoading: loadingFeatured } = useProducts({ featured: true, limit: 4 });
  const { data: newProducts, isLoading: loadingNew } = useProducts({ limit: 8 });
  const { data: categories } = useCategories();

  return (
    <StoreLayout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-secondary to-background py-16 md:py-24">
        <div className="container-store">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 animate-fade-in">
              Quality Products,
              <br />
              <span className="text-primary">Great Prices</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 animate-fade-in">
              Discover our curated collection of premium products. 
              Shop with confidence and enjoy free shipping on orders over ₹999.
            </p>
            <div className="flex flex-wrap gap-4 animate-fade-in">
              <Button asChild size="lg">
                <Link to="/shop">
                  Shop Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/shop?featured=true">View Featured</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories && categories.length > 0 && (
        <section className="py-12 md:py-16">
          <div className="container-store">
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-8">
              Shop by Category
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.slice(0, 4).map(category => (
                <Link
                  key={category.id}
                  to={`/shop?category=${category.slug}`}
                  className="group relative aspect-square overflow-hidden rounded-lg bg-secondary"
                >
                  {category.image_url && (
                    <img
                      src={category.image_url}
                      alt={category.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <h3 className="text-lg font-semibold text-background">
                      {category.name}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="py-12 md:py-16 bg-secondary/50">
        <div className="container-store">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-display font-bold">
              Featured Products
            </h2>
            <Button asChild variant="ghost">
              <Link to="/shop?featured=true">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <ProductGrid products={featuredProducts} loading={loadingFeatured} />
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-12 md:py-16">
        <div className="container-store">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-display font-bold">
              New Arrivals
            </h2>
            <Button asChild variant="ghost">
              <Link to="/shop">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <ProductGrid products={newProducts} loading={loadingNew} />
        </div>
      </section>

      {/* Trust badges */}
      <section className="py-12 border-t">
        <div className="container-store">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl mb-2">🚚</div>
              <h3 className="font-semibold">Free Shipping</h3>
              <p className="text-sm text-muted-foreground">On orders over ₹999</p>
            </div>
            <div>
              <div className="text-3xl mb-2">🔒</div>
              <h3 className="font-semibold">Secure Payment</h3>
              <p className="text-sm text-muted-foreground">100% secure checkout</p>
            </div>
            <div>
              <div className="text-3xl mb-2">↩️</div>
              <h3 className="font-semibold">Easy Returns</h3>
              <p className="text-sm text-muted-foreground">7-day return policy</p>
            </div>
            <div>
              <div className="text-3xl mb-2">💬</div>
              <h3 className="font-semibold">24/7 Support</h3>
              <p className="text-sm text-muted-foreground">Dedicated support</p>
            </div>
          </div>
        </div>
      </section>
    </StoreLayout>
  );
};

export default Index;