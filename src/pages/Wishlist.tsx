import { Link, Navigate } from 'react-router-dom';
import { StoreLayout } from '@/components/layout/StoreLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useWishlist, useToggleWishlist } from '@/hooks/useWishlist';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingBag, Loader2 } from 'lucide-react';

const Wishlist = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: wishlistItems, isLoading } = useWishlist();
  const toggleWishlist = useToggleWishlist();
  const { addToCart } = useCart();

  if (authLoading) {
    return (
      <StoreLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </StoreLayout>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleAddToCart = (productId: string) => {
    addToCart(productId);
  };

  return (
    <StoreLayout>
      <div className="container-store py-8">
        <h1 className="font-display text-3xl mb-2">My Wishlist</h1>
        <p className="text-muted-foreground mb-8">
          {wishlistItems?.length || 0} {wishlistItems?.length === 1 ? 'item' : 'items'}
        </p>

        {isLoading ? (
          <div className="min-h-[40vh] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : wishlistItems && wishlistItems.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {wishlistItems.map((item) => (
              <div key={item.id} className="group relative">
                <Link to={`/product/${item.product?.slug}`} className="block">
                  <div className="aspect-[3/4] bg-secondary rounded-lg overflow-hidden mb-3">
                    <img
                      src={item.product?.images?.[0] || '/placeholder.svg'}
                      alt={item.product?.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <h3 className="font-medium text-sm md:text-base line-clamp-2 mb-1">
                    {item.product?.name}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    ₹{item.product?.price?.toLocaleString()}
                  </p>
                </Link>

                {/* Actions */}
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => item.product?.id && handleAddToCart(item.product.id)}
                  >
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => item.product?.id && toggleWishlist.mutate(item.product.id)}
                  >
                    <Heart className="h-4 w-4 fill-current" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="min-h-[40vh] flex flex-col items-center justify-center text-center">
            <Heart className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-medium mb-2">Your wishlist is empty</h2>
            <p className="text-muted-foreground mb-6">
              Save items you love by clicking the heart icon on products
            </p>
            <Button asChild>
              <Link to="/shop">Continue Shopping</Link>
            </Button>
          </div>
        )}
      </div>
    </StoreLayout>
  );
};

export default Wishlist;
