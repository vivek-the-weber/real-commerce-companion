import { Link } from 'react-router-dom';

interface ExclusiveCollectionProps {
  product?: {
    id: string;
    name: string;
    images?: string[] | null;
    slug: string;
  } | null;
}

export function ExclusiveCollection({ product }: ExclusiveCollectionProps) {
  const imageUrl = product?.images?.[0] || '/placeholder.svg';

  return (
    <section className="py-16 md:py-24 bg-background relative overflow-hidden min-h-[80vh] flex items-center">
      <div className="container-store relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left - Text */}
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground italic">Introducing</p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display text-foreground">
              Exclusive Collections
            </h2>
          </div>

          {/* Center - Product Image */}
          <div className="flex justify-center">
            {product ? (
              <Link to={`/product/${product.slug}`} className="block">
                <img
                  src={imageUrl}
                  alt={product.name}
                  className="w-full max-w-md h-auto object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500"
                />
              </Link>
            ) : (
              <div className="w-full max-w-md aspect-square bg-secondary rounded-lg flex items-center justify-center">
                <span className="text-muted-foreground">Featured Product</span>
              </div>
            )}
          </div>
        </div>

        {/* Right - Description */}
        <div className="mt-8 md:mt-0 md:absolute md:right-10 md:bottom-16 max-w-sm">
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            We make things that work better and last longer. Our products solve real problems with clean design and honest materials.
          </p>
        </div>
      </div>
    </section>
  );
}