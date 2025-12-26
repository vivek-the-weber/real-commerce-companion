import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function Footer() {
  return (
    <footer className="bg-secondary mt-auto">
      <div className="container-store py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-xl font-display font-bold">MyStore</h3>
            <p className="text-muted-foreground text-sm">
              Quality products at great prices. Shop with confidence.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold">Quick Links</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/shop" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                Shop All
              </Link>
              <Link to="/about" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                About Us
              </Link>
              <Link to="/contact" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                Contact
              </Link>
              <Link to="/faq" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                FAQ
              </Link>
            </nav>
          </div>

          {/* Customer Service */}
          <div className="space-y-4">
            <h4 className="font-semibold">Customer Service</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/shipping" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                Shipping Info
              </Link>
              <Link to="/returns" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                Returns & Exchanges
              </Link>
              <Link to="/account/orders" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                Track Order
              </Link>
              <Link to="/privacy" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                Privacy Policy
              </Link>
            </nav>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h4 className="font-semibold">Newsletter</h4>
            <p className="text-muted-foreground text-sm">
              Subscribe to get special offers and updates.
            </p>
            <form className="flex gap-2">
              <Input 
                type="email" 
                placeholder="Your email" 
                className="flex-1"
              />
              <Button type="submit" size="sm">
                Subscribe
              </Button>
            </form>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} MyStore. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}