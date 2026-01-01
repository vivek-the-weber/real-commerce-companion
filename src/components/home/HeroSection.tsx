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
  leftVideoUrl?: string;
  rightVideoUrl?: string;
}

export function HeroSection({ products, leftVideoUrl, rightVideoUrl }: HeroSectionProps) {
  const leftProduct = products?.[0];
  const rightProduct = products?.[1];

  // Check if URL is a video
  const isVideo = (url?: string) => {
    if (!url) return false;
    return url.match(/\.(mp4|webm|ogg|mov)$/i) !== null;
  };

  const renderMedia = (
    product: HeroProduct | undefined,
    videoUrl: string | undefined,
    animationClass: string
  ) => {
    const mediaUrl = videoUrl || product?.images?.[0];
    
    if (!mediaUrl) {
      return (
        <div className={`w-40 md:w-64 aspect-square bg-secondary/20 rounded-lg ${animationClass}`} />
      );
    }

    const isVideoMedia = isVideo(mediaUrl);

    if (isVideoMedia) {
      return (
        <Link to={product ? `/product/${product.slug}` : '/shop'}>
          <video
            src={mediaUrl}
            autoPlay
            loop
            muted
            playsInline
            className={`w-full max-w-[280px] h-auto object-contain ${animationClass} drop-shadow-2xl`}
          />
        </Link>
      );
    }

    return (
      <Link to={product ? `/product/${product.slug}` : '/shop'}>
        <img
          src={mediaUrl}
          alt={product?.name || 'Product'}
          className={`w-full max-w-[280px] h-auto object-contain ${animationClass} drop-shadow-2xl`}
        />
      </Link>
    );
  };

  return (
    <section className="relative min-h-[70vh] md:min-h-[80vh] bg-background overflow-hidden flex items-center">
      <div className="container-store relative z-10">
        <div className="grid grid-cols-3 items-center gap-4 md:gap-8">
          {/* Left Product */}
          <div className="flex justify-center">
            {renderMedia(leftProduct, leftVideoUrl, 'animate-float')}
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
            {renderMedia(rightProduct, rightVideoUrl, 'animate-float-delayed')}
          </div>
        </div>
      </div>
    </section>
  );
}
