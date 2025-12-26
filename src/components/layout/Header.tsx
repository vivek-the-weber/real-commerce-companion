import { Link } from 'react-router-dom';
import { ShoppingBag, Heart, User, Menu, Search, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useCategories } from '@/hooks/useProducts';

export function Header() {
  const { user, isAdmin } = useAuth();
  const { itemCount } = useCart();
  const { data: categories } = useCategories();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/shop?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container-store">
        {/* Top bar */}
        <div className="hidden md:flex items-center justify-between py-2 text-sm text-muted-foreground border-b border-border">
          <span>Free shipping on orders over ₹999</span>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <Link to="/admin" className="link-hover">Admin Dashboard</Link>
            )}
            <Link to="/account/orders" className="link-hover">Track Order</Link>
          </div>
        </div>

        {/* Main header */}
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <nav className="flex flex-col gap-4 mt-8">
                <Link to="/shop" className="text-lg font-medium link-hover">All Products</Link>
                {categories?.map(category => (
                  <Link 
                    key={category.id} 
                    to={`/shop?category=${category.slug}`}
                    className="text-lg link-hover"
                  >
                    {category.name}
                  </Link>
                ))}
                <hr className="my-4" />
                {user ? (
                  <>
                    <Link to="/account" className="link-hover">My Account</Link>
                    <Link to="/account/orders" className="link-hover">My Orders</Link>
                    <Link to="/wishlist" className="link-hover">Wishlist</Link>
                  </>
                ) : (
                  <Link to="/auth" className="link-hover">Sign In / Sign Up</Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link to="/" className="flex items-center">
            <h1 className="text-xl md:text-2xl font-display font-bold tracking-tight">
              MyStore
            </h1>
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/shop" className="text-sm font-medium link-hover">
              Shop All
            </Link>
            {categories?.slice(0, 4).map(category => (
              <Link 
                key={category.id} 
                to={`/shop?category=${category.slug}`}
                className="text-sm font-medium link-hover"
              >
                {category.name}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            {searchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <Input
                  type="search"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-40 md:w-60"
                  autoFocus
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setSearchOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </form>
            ) : (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="h-5 w-5" />
              </Button>
            )}

            {/* Wishlist */}
            <Link to="/wishlist">
              <Button variant="ghost" size="icon" className="hidden md:flex">
                <Heart className="h-5 w-5" />
              </Button>
            </Link>

            {/* Account */}
            <Link to={user ? "/account" : "/auth"}>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </Link>

            {/* Cart */}
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingBag className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}