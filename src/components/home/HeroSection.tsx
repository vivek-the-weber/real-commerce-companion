import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface HeroProduct {
  id: string;
  name: string;
  images?: string[] | null;
  slug: string;
}

interface HeroSectionProps {
  products?: HeroProduct[];
}

export function HeroSection({ products }: HeroSectionProps) {
  const leftProduct = products?.[0];
  const rightProduct = products?.[1];

  return (
    <section className="relative min-h-[70vh] md:min-h-[80vh] bg-background overflow-hidden flex items-center">
      <div className="container-store relative z-10">
        <div className="grid grid-cols-3 items-center gap-4 md:gap-8">
          {/* Left Product */}
          <div className="flex justify-center">
            {leftProduct?.images?.[0] ? (
              <Link to={`/product/${leftProduct.slug}`}>
                <img
                  src={leftProduct.images[0]}
                  alt={leftProduct.name}
                  className="w-full max-w-[280px] h-auto object-contain animate-float drop-shadow-2xl"
                />
              </Link>
            ) : (
              <div className="w-40 md:w-64 aspect-square bg-secondary/20 rounded-lg animate-float" />
            )}
          </div>

          {/* Center Content */}
          <div className="text-center space-y-6">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display text-foreground">
              New arrivals
            </h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto">
              Made with care and unconditionally loved by our customers.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-foreground text-background hover:bg-foreground/90 rounded-none px-8 py-6 text-sm font-medium tracking-wide"
            >
              <Link to="/shop">Shop Now</Link>
            </Button>
          </div>

          {/* Right Product */}
          <div className="flex justify-center">
            {rightProduct?.images?.[0] ? (
              <Link to={`/product/${rightProduct.slug}`}>
                <img
                  src={rightProduct.images[0]}
                  alt={rightProduct.name}
                  className="w-full max-w-[280px] h-auto object-contain animate-float-delayed drop-shadow-2xl"
                />
              </Link>
            ) : (
              <div className="w-40 md:w-64 aspect-square bg-secondary/20 rounded-lg animate-float-delayed" />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}