import { Link } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();

  // Check if URL is a video
  const isVideo = (url?: string) => {
    if (!url) return false;
    return url.match(/\.(mp4|webm|ogg|mov)$/i) !== null;
  };

  const isVideoMedia = isVideo(mediaUrl);

  const renderMedia = () => {
    const mediaClass = isMobile 
      ? 'w-full max-w-[85vw]' 
      : 'w-full max-w-xl lg:max-w-2xl';

    if (!mediaUrl) {
      return (
        <div className={`${mediaClass} aspect-[3/4] bg-secondary/20 rounded-lg flex items-center justify-center`}>
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
            className={`${mediaClass} h-auto object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500`}
          />
        </Link>
      );
    }

    return (
      <Link to={product ? `/product/${product.slug}` : '/shop'} className="block">
        <img
          src={mediaUrl}
          alt={product?.name || 'Exclusive Collection'}
          className={`${mediaClass} h-auto object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500`}
        />
      </Link>
    );
  };

  return (
    <section className={`bg-background relative overflow-hidden flex flex-col ${isMobile ? 'py-12 min-h-[70vh]' : 'py-16 md:py-24 min-h-[90vh]'}`}>
      <div className="container-store relative z-10 flex-1 flex flex-col">
        {/* Centered Media */}
        <div className={`flex-1 flex items-center justify-center ${isMobile ? 'py-4' : 'py-8'}`}>
          {renderMedia()}
        </div>

        {/* Bottom Content - Title left, Description right */}
        <div className={`flex flex-col gap-4 ${isMobile ? 'pb-4' : 'md:flex-row md:items-end md:justify-between gap-6 md:gap-8 pb-8'}`}>
          {/* Left - Title */}
          <div className="space-y-1">
            <p className={`text-muted-foreground italic ${isMobile ? 'text-xs' : 'text-sm'}`}>Introducing</p>
            <h2 className={`font-display text-foreground ${isMobile ? 'text-2xl' : 'text-3xl md:text-4xl lg:text-5xl'}`}>
              Exclusive Collections
            </h2>
          </div>

          {/* Right - Description */}
          <div className={`${isMobile ? 'max-w-full' : 'max-w-sm md:max-w-md md:text-right'}`}>
            <p className={`text-muted-foreground leading-relaxed ${isMobile ? 'text-xs' : 'text-sm md:text-base'}`}>
              We make things that work better and last longer. Our products solve real problems with clean design and honest materials.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
