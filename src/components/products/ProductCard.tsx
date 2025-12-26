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
      className="group block card-hover"
    >
      <div className="relative aspect-square overflow-hidden rounded-lg bg-secondary">
        <img
          src={imageUrl}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {hasDiscount && (
            <span className="bg-destructive text-destructive-foreground text-xs font-medium px-2 py-1 rounded">
              -{discountPercent}%
            </span>
          )}
          {product.is_featured && (
            <span className="bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded">
              Featured
            </span>
          )}
        </div>

        {/* Wishlist button */}
        <button
          onClick={handleToggleWishlist}
          className="absolute top-3 right-3 p-2 rounded-full bg-background/80 hover:bg-background transition-colors"
        >
          <Heart 
            className={cn(
              "h-4 w-4 transition-colors",
              isInWishlist ? "fill-destructive text-destructive" : "text-foreground"
            )} 
          />
        </button>

        {/* Quick add */}
        <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            onClick={handleAddToCart}
            className="w-full"
            size="sm"
          >
            Add to Cart
          </Button>
        </div>
      </div>

      <div className="mt-4 space-y-1">
        {product.category && (
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            {product.category.name}
          </p>
        )}
        <h3 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
          {product.name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="font-semibold">
            ₹{product.price.toLocaleString('en-IN')}
          </span>
          {hasDiscount && (
            <span className="text-sm text-muted-foreground line-through">
              ₹{product.compare_at_price!.toLocaleString('en-IN')}
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