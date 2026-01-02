import { StoreLayout } from '@/components/layout/StoreLayout';
import { HeroSection } from '@/components/home/HeroSection';
import { CategorySection } from '@/components/home/CategorySection';
import { ExclusiveCollection } from '@/components/home/ExclusiveCollection';
import { Marquee } from '@/components/home/Marquee';
import { useProducts, useCategories } from '@/hooks/useProducts';

const Index = () => {
  const { data: featuredProducts } = useProducts({ featured: true, limit: 8 });
  const { data: allProducts } = useProducts({ limit: 20 });
  const { data: categories } = useCategories();

  // Get products by category for different sections
  const getProductsByCategory = (categorySlug: string, limit = 4) => {
    if (!allProducts || !categories) return [];
    const category = categories.find(c => c.slug === categorySlug);
    if (!category) return [];
    return allProducts
      .filter(p => p.category_id === category.id)
      .slice(0, limit);
  };

  // Hero products (first 2 featured)
  const heroProducts = featuredProducts?.slice(0, 2) || [];

  // Get an exclusive/featured product for the editorial section
  const exclusiveProduct = featuredProducts?.[0] || null;

  // Category sections - adjust slugs based on your actual categories
  const regularTees = getProductsByCategory('regular-tees');
  const oversizedTees = getProductsByCategory('oversized-tees');
  const sweatshirts = getProductsByCategory('sweatshirts');

  // Fallback: if no category products, use featured/all products
  const section1Products = regularTees.length > 0 ? regularTees : (featuredProducts?.slice(0, 4) || []);
  const section2Products = oversizedTees.length > 0 ? oversizedTees : (allProducts?.slice(4, 8) || []);
  const section3Products = sweatshirts.length > 0 ? sweatshirts : (allProducts?.slice(8, 12) || []);

  // Hero video URLs
  const leftHeroVideo = "/videos/straw_hat_sweatshirt.mov";
  const rightHeroVideo = "/videos/miracle.mov";

  // Exclusive collection video - upload a video for this section or leave empty to use product image
  const exclusiveVideoUrl = ""; // Add your exclusive collection video URL here

  return (
    <StoreLayout>
      {/* Hero Section */}
      <HeroSection 
        products={heroProducts} 
        leftVideoUrl={leftHeroVideo || undefined}
        rightVideoUrl={rightHeroVideo || undefined}
      />

      {/* Just Tee N Time - Regular T-shirts */}
      <CategorySection
        title="Just Tee N Time"
        categorySlug="regular-tees"
        products={section1Products}
      />

      {/* Exclusive Collections */}
      <ExclusiveCollection product={exclusiveProduct} videoUrl={exclusiveVideoUrl || undefined} />

      {/* Over Tee Sized - Oversized T-shirts */}
      <CategorySection
        title="Over Tee Sized"
        categorySlug="oversized-tees"
        products={section2Products}
      />

      {/* Marquee */}
      <Marquee />

      {/* SweaTee Shirts */}
      <CategorySection
        title="SweaTee Shirts"
        categorySlug="sweatshirts"
        products={section3Products}
      />
    </StoreLayout>
  );
};

export default Index;