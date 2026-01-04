import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProductGalleryProps {
  images: string[];
  productName: string;
  selectedVariantImageUrl?: string | null;
}

export function ProductGallery({ images, productName, selectedVariantImageUrl }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const displayImages = images.length > 0 ? images : ['/placeholder.svg'];

  // When variant changes, find matching image or show variant image
  useEffect(() => {
    if (selectedVariantImageUrl) {
      const matchIndex = displayImages.findIndex(img => img === selectedVariantImageUrl);
      if (matchIndex !== -1) {
        setSelectedIndex(matchIndex);
      }
    }
  }, [selectedVariantImageUrl, displayImages]);

  const goToPrevious = () => {
    setSelectedIndex(prev => 
      prev === 0 ? displayImages.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setSelectedIndex(prev => 
      prev === displayImages.length - 1 ? 0 : prev + 1
    );
  };

  // Use variant image if it exists and isn't in the gallery
  const mainImage = selectedVariantImageUrl && !displayImages.includes(selectedVariantImageUrl)
    ? selectedVariantImageUrl
    : displayImages[selectedIndex];

  return (
    <div className="space-y-4">
      {/* Main image */}
      <div className="relative aspect-square overflow-hidden rounded-lg bg-secondary">
        <img
          src={mainImage}
          alt={`${productName} - Image ${selectedIndex + 1}`}
          className="h-full w-full object-cover"
        />
        
        {displayImages.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-3 top-1/2 -translate-y-1/2"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-3 top-1/2 -translate-y-1/2"
              onClick={goToNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {displayImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {displayImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-colors",
                selectedIndex === index && (!selectedVariantImageUrl || displayImages.includes(selectedVariantImageUrl))
                  ? "border-primary" 
                  : "border-transparent hover:border-muted-foreground"
              )}
            >
              <img
                src={image}
                alt={`${productName} - Thumbnail ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
