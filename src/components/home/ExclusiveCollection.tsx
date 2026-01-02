import { Link } from 'react-router-dom';

interface ExclusiveCollectionProps {
  product?: {
    id: string;
    name: string;
    images?: string[] | null;
    slug: string;
  } | null;
  videoUrl?: string;
}

export function ExclusiveCollection({ product, videoUrl }: ExclusiveCollectionProps) {
  const mediaUrl = videoUrl || product?.images?.[0];

  // Check if URL is a video
  const isVideo = (url?: string) => {
    if (!url) return false;
    return url.match(/\.(mp4|webm|ogg|mov)$/i) !== null;
  };

  const isVideoMedia = isVideo(mediaUrl);

  const renderMedia = () => {
    if (!mediaUrl) {
      return (
        <div className="w-full max-w-xl lg:max-w-2xl aspect-[3/4] bg-secondary/20 rounded-lg flex items-center justify-center">
          <span className="text-muted-foreground">Featured Product</span>
        </div>
      );
    }

    if (isVideoMedia) {
      return (
        <Link to={product ? `/product/${product.slug}` : '/shop'} className="block">
          <video
            src={mediaUrl}
            autoPlay
            loop
            muted
            playsInline
            className="w-full max-w-xl lg:max-w-2xl h-auto object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500"
          />
        </Link>
      );
    }

    return (
      <Link to={product ? `/product/${product.slug}` : '/shop'} className="block">
        <img
          src={mediaUrl}
          alt={product?.name || 'Exclusive Collection'}
          className="w-full max-w-xl lg:max-w-2xl h-auto object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500"
        />
      </Link>
    );
  };

  return (
    <section className="py-16 md:py-24 bg-background relative overflow-hidden min-h-[90vh] flex flex-col">
      <div className="container-store relative z-10 flex-1 flex flex-col">
        {/* Centered Media */}
        <div className="flex-1 flex items-center justify-center py-8">
          {renderMedia()}
        </div>

        {/* Bottom Content - Title left, Description right */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 md:gap-8 pb-8">
          {/* Left - Title */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground italic">Introducing</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display text-foreground">
              Exclusive Collections
            </h2>
          </div>

          {/* Right - Description */}
          <div className="max-w-sm md:max-w-md md:text-right">
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              We make things that work better and last longer. Our products solve real problems with clean design and honest materials.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
