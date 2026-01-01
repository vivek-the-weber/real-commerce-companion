import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Product } from '@/types/store';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useToggleWishlist, useIsInWishlist } from '@/hooks/useWishlist';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const toggleWishlist = useToggleWishlist();
  const isInWishlist = useIsInWishlist(product.id);

  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
  const discountPercent = hasDiscount 
    ? Math.round((1 - product.price / product.compare_at_price!) * 100)
    : 0;

  const imageUrl = product.images?.[0] || '/placeholder.svg';

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart(product.id);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleWishlist.mutate(product.id);
  };

  return (
    <Link 
      to={`/product/${product.slug}`}
      className="group block"
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-secondary">
        <img
          src={imageUrl}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {hasDiscount && (
            <span className="bg-destructive text-destructive-foreground text-xs font-medium px-2 py-1 rounded-sm">
              -{discountPercent}%
            </span>
          )}
        </div>

        {/* Wishlist button */}
        <button
          onClick={handleToggleWishlist}
          className="absolute top-3 right-3 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
        >
          <Heart 
            className={cn(
              "h-4 w-4 transition-colors",
              isInWishlist ? "fill-primary text-primary" : "text-foreground"
            )} 
          />
        </button>

        {/* Quick add */}
        <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-background/80 to-transparent">
          <Button 
            onClick={handleAddToCart}
            className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-sm"
            size="sm"
          >
            Add to Cart
          </Button>
        </div>
      </div>

      <div className="mt-3 space-y-1">
        <h3 className="text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2">
          {product.name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Rs. {product.price.toLocaleString('en-IN')}.00
          </span>
          {hasDiscount && (
            <span className="text-xs text-muted-foreground/60 line-through">
              Rs. {product.compare_at_price!.toLocaleString('en-IN')}.00
            </span>
          )}
        </div>
        {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
          <p className="text-xs text-warning">Only {product.stock_quantity} left</p>
        )}
        {product.stock_quantity === 0 && (
          <p className="text-xs text-destructive">Out of stock</p>
        )}
      </div>
    </Link>
  );
}