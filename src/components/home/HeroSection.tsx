import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();

  // Check if URL is a video
  const isVideo = (url?: string) => {
    if (!url) return false;
    return url.match(/\.(mp4|webm|ogg|mov)$/i) !== null;
  };

  const renderMedia = (
    product: HeroProduct | undefined,
    videoUrl: string | undefined,
    animationClass: string,
    mobileClass?: string
  ) => {
    const mediaUrl = videoUrl || product?.images?.[0];
    const sizeClass = isMobile 
      ? (mobileClass || 'w-[80vw]') 
      : 'w-80 md:w-96 lg:w-[550px] xl:w-[650px]';
    
    if (!mediaUrl) {
      return (
        <div className={`${sizeClass} aspect-[3/4] bg-secondary/20 rounded-lg ${animationClass}`} />
      );
    }

    const isVideoMedia = isVideo(mediaUrl);

    if (isVideoMedia) {
      return (
        <Link to={product ? `/product/${product.slug}` : '/shop'} className="block">
          <video
            src={mediaUrl}
            autoPlay
            loop
            muted
            playsInline
            className={`${sizeClass} h-auto object-contain ${animationClass} drop-shadow-2xl`}
          />
        </Link>
      );
    }

    return (
      <Link to={product ? `/product/${product.slug}` : '/shop'} className="block">
        <img
          src={mediaUrl}
          alt={product?.name || 'Product'}
          className={`${sizeClass} h-auto object-contain ${animationClass} drop-shadow-2xl`}
        />
      </Link>
    );
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <section className="relative min-h-[85vh] bg-background flex flex-col items-center justify-center py-8 overflow-x-clip">
        {/* Products side by side */}
        <div className="flex items-center justify-center gap-1 relative w-full px-2">
          <div className="flex-shrink-0">
            {renderMedia(leftProduct, leftVideoUrl, 'animate-float', 'w-[80vw]')}
          </div>
          <div className="flex-shrink-0">
            {renderMedia(rightProduct, rightVideoUrl, 'animate-float-delayed', 'w-[80vw]')}
          </div>
        </div>

        {/* Centered Content Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center space-y-4 pointer-events-auto px-4">
            <h1 className="text-4xl font-display text-foreground">
              New arrivals
            </h1>
            <p className="text-xs text-muted-foreground max-w-[200px] mx-auto leading-relaxed">
              Made with care and unconditionally loved by our customers.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-foreground text-background hover:bg-foreground/90 rounded-none px-6 py-5 text-xs font-medium tracking-wide"
            >
              <Link to="/shop">Shop Now</Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  // Desktop Layout
  return (
    <section className="relative min-h-screen bg-background flex items-center py-8 overflow-x-clip">
      <div className="w-full relative z-10">
        <div className="grid grid-cols-3 items-center">
          {/* Left Product - extends beyond left edge */}
          <div className="flex justify-end items-center -ml-16 md:-ml-24 lg:-ml-32 xl:-ml-40">
            {renderMedia(leftProduct, leftVideoUrl, 'animate-float')}
          </div>

          {/* Center Content */}
          <div className="text-center space-y-6 px-2">
            <h1 className="text-3xl md:text-5xl lg:text-7xl font-display text-foreground">
              New arrivals
            </h1>
            <p className="text-xs md:text-sm lg:text-base text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Made with care and unconditionally loved by our customers.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-foreground text-background hover:bg-foreground/90 rounded-none px-6 md:px-8 py-5 md:py-6 text-xs md:text-sm font-medium tracking-wide"
            >
              <Link to="/shop">Shop Now</Link>
            </Button>
          </div>

          {/* Right Product - extends beyond right edge */}
          <div className="flex justify-start items-center -mr-16 md:-mr-24 lg:-mr-32 xl:-mr-40">
            {renderMedia(rightProduct, rightVideoUrl, 'animate-float-delayed')}
          </div>
        </div>
      </div>
    </section>
  );
}
