import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Minus, Plus, Heart, ShoppingBag } from 'lucide-react';
import { Product, ProductVariant } from '@/types/store';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useToggleWishlist, useIsInWishlist } from '@/hooks/useWishlist';
import { cn } from '@/lib/utils';

interface ProductInfoProps {
  product: Product;
}

export function ProductInfo({ product }: ProductInfoProps) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const toggleWishlist = useToggleWishlist();
  const isInWishlist = useIsInWishlist(product.id);
  
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants?.[0] || null
  );
  const [quantity, setQuantity] = useState(1);

  const currentPrice = selectedVariant?.price ?? product.price;
  const hasDiscount = product.compare_at_price && product.compare_at_price > currentPrice;
  const discountPercent = hasDiscount 
    ? Math.round((1 - currentPrice / product.compare_at_price!) * 100)
    : 0;

  const currentStock = selectedVariant?.stock_quantity ?? product.stock_quantity;
  const isOutOfStock = currentStock === 0;

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= currentStock) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    addToCart(product.id, selectedVariant?.id, quantity);
  };

  const handleBuyNow = () => {
    addToCart(product.id, selectedVariant?.id, quantity);
    navigate('/cart');
  };

  return (
    <div className="space-y-6">
      {/* Category */}
      {product.category && (
        <p className="text-sm text-muted-foreground uppercase tracking-wide">
          {product.category.name}
        </p>
      )}

      {/* Title */}
      <h1 className="text-2xl md:text-3xl font-display font-bold">
        {product.name}
      </h1>

      {/* Price */}
      <div className="flex items-baseline gap-3">
        <span className="text-2xl md:text-3xl font-bold">
          ₹{currentPrice.toLocaleString('en-IN')}
        </span>
        {hasDiscount && (
          <>
            <span className="text-lg text-muted-foreground line-through">
              ₹{product.compare_at_price!.toLocaleString('en-IN')}
            </span>
            <span className="text-sm font-medium text-destructive">
              {discountPercent}% off
            </span>
          </>
        )}
      </div>

      {/* Stock status */}
      {isOutOfStock ? (
        <p className="text-destructive font-medium">Out of Stock</p>
      ) : currentStock <= 5 ? (
        <p className="text-warning font-medium">Only {currentStock} left in stock</p>
      ) : (
        <p className="text-accent font-medium">In Stock</p>
      )}

      {/* Description */}
      {product.description && (
        <p className="text-muted-foreground leading-relaxed">
          {product.description}
        </p>
      )}

      {/* Variants */}
      {product.variants && product.variants.length > 0 && (
        <div className="space-y-3">
          <label className="text-sm font-medium">Variant</label>
          <div className="flex flex-wrap gap-2">
            {product.variants.map(variant => (
              <button
                key={variant.id}
                onClick={() => setSelectedVariant(variant)}
                className={cn(
                  "px-4 py-2 rounded-md border text-sm font-medium transition-colors",
                  selectedVariant?.id === variant.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-primary"
                )}
              >
                {variant.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity */}
      <div className="space-y-3">
        <label className="text-sm font-medium">Quantity</label>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleQuantityChange(-1)}
            disabled={quantity <= 1}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-12 text-center font-medium">{quantity}</span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleQuantityChange(1)}
            disabled={quantity >= currentStock}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          className="flex-1"
          size="lg"
          onClick={handleAddToCart}
          disabled={isOutOfStock}
        >
          <ShoppingBag className="mr-2 h-5 w-5" />
          Add to Cart
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => toggleWishlist.mutate(product.id)}
        >
          <Heart 
            className={cn(
              "h-5 w-5",
              isInWishlist && "fill-destructive text-destructive"
            )} 
          />
        </Button>
      </div>

      <Button
        variant="secondary"
        className="w-full"
        size="lg"
        onClick={handleBuyNow}
        disabled={isOutOfStock}
      >
        Buy Now
      </Button>

      {/* Specifications */}
      {product.specifications && Object.keys(product.specifications).length > 0 && (
        <div className="pt-6 border-t space-y-4">
          <h3 className="font-semibold">Specifications</h3>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            {Object.entries(product.specifications).map(([key, value]) => (
              <div key={key}>
                <dt className="text-muted-foreground">{key}</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* SKU */}
      {(selectedVariant?.sku || product.sku) && (
        <p className="text-sm text-muted-foreground">
          SKU: {selectedVariant?.sku || product.sku}
        </p>
      )}
    </div>
  );
}