import { Link } from 'react-router-dom';
import { ShoppingBag, User, Menu, Search, X, Heart } from 'lucide-react';
import logo from '@/assets/logo.png';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useCategories } from '@/hooks/useProducts';
import { useWishlist } from '@/hooks/useWishlist';

export function Header() {
  const { user, isAdmin } = useAuth();
  const { itemCount } = useCart();
  const { data: categories } = useCategories();
  const { data: wishlistItems } = useWishlist();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const wishlistCount = wishlistItems?.length || 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/shop?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-background">
      {/* Top Banner */}
      <div className="bg-background border-b border-border py-2 text-center">
        <p className="text-xs md:text-sm text-foreground tracking-widest font-light">
          Wear Your Aura. Own Your Edge.
        </p>
      </div>

      {/* Main header */}
      <div className="container-store">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="text-foreground hover:text-foreground/80">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 bg-background border-border">
              <nav className="flex flex-col gap-4 mt-8">
                <Link to="/shop" className="text-lg font-medium link-hover text-foreground">All Products</Link>
                {categories?.map(category => (
                  <Link 
                    key={category.id} 
                    to={`/shop?category=${category.slug}`}
                    className="text-lg link-hover text-foreground"
                  >
                    {category.name}
                  </Link>
                ))}
                <hr className="my-4 border-border" />
                {isAdmin && (
                  <Link to="/admin" className="link-hover text-foreground">Admin Dashboard</Link>
                )}
                {user ? (
                  <>
                    <Link to="/account" className="link-hover text-foreground">My Account</Link>
                    <Link to="/account/orders" className="link-hover text-foreground">My Orders</Link>
                  </>
                ) : (
                  <Link to="/auth" className="link-hover text-foreground">Sign In / Sign Up</Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img 
              src={logo} 
              alt="AURAEDGE" 
              className="h-12 md:h-16 w-auto"
            />
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-1 md:gap-2">
            {/* Search */}
            {searchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <Input
                  type="search"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-32 md:w-48 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                  autoFocus
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setSearchOpen(false)}
                  className="text-foreground hover:text-foreground/80"
                >
                  <X className="h-4 w-4" />
                </Button>
              </form>
            ) : (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setSearchOpen(true)}
                className="text-foreground hover:text-foreground/80"
              >
                <Search className="h-5 w-5" />
              </Button>
            )}

            {/* Wishlist */}
            <Link to="/wishlist">
              <Button variant="ghost" size="icon" className="relative text-foreground hover:text-foreground/80">
                <Heart className="h-5 w-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-medium flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* Account */}
            <Link to={user ? "/account" : "/auth"}>
              <Button variant="ghost" size="icon" className="text-foreground hover:text-foreground/80">
                <User className="h-5 w-5" />
              </Button>
            </Link>

            {/* Cart */}
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative text-foreground hover:text-foreground/80">
                <ShoppingBag className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-medium flex items-center justify-center">
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