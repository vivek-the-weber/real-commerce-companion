import { StoreLayout } from '@/components/layout/StoreLayout';
import { HeroSection } from '@/components/home/HeroSection';
import { CategorySection } from '@/components/home/CategorySection';
import { ExclusiveCollection } from '@/components/home/ExclusiveCollection';
import { Marquee } from '@/components/home/Marquee';
import { useProducts } from '@/hooks/useProducts';

const Index = () => {
  const { data: featuredProducts } = useProducts({ featured: true, limit: 8 });
  
  // Fetch products directly per category
  const { data: simpleTees } = useProducts({ categorySlug: 'simple-tees', limit: 4 });
  const { data: oversizedTees } = useProducts({ categorySlug: 'oversized-tees', limit: 4 });
  const { data: sweatshirts } = useProducts({ categorySlug: 'sweatshirts', limit: 4 });

  // Hero products (first 2 featured)
  const heroProducts = featuredProducts?.slice(0, 2) || [];

  // Get an exclusive/featured product for the editorial section
  const exclusiveProduct = featuredProducts?.[0] || null;

  // Hero video URLs
  const leftHeroVideo = "/videos/straw_hat_sweatshirt.mov";
  const rightHeroVideo = "/videos/miracle.mov";

  // Exclusive collection video
  const exclusiveVideoUrl = "/videos/demon_slayer_and_straw_hat.mov";

  return (
    <StoreLayout>
      {/* Hero Section */}
      <HeroSection 
        products={heroProducts} 
        leftVideoUrl={leftHeroVideo || undefined}
        rightVideoUrl={rightHeroVideo || undefined}
      />

      {/* Just Tee N Time - Simple T-shirts */}
      <CategorySection
        title="Just Tee N Time"
        categorySlug="simple-tees"
        products={simpleTees || []}
      />

      {/* Exclusive Collections */}
      <ExclusiveCollection product={exclusiveProduct} videoUrl={exclusiveVideoUrl || undefined} />

      {/* Over Tee Sized - Oversized T-shirts */}
      <CategorySection
        title="Over Tee Sized"
        categorySlug="oversized-tees"
        products={oversizedTees || []}
      />

      {/* Marquee */}
      <Marquee />

      {/* SweaTee Shirts */}
      <CategorySection
        title="SweaTee Shirts"
        categorySlug="sweatshirts"
        products={sweatshirts || []}
      />
    </StoreLayout>
  );
};

export default Index;