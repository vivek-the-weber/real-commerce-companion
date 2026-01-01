import { Link } from 'react-router-dom';
import { Instagram } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-background border-t border-border mt-auto">
      <div className="container-store py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Copyright & Links */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span>© {new Date().getFullYear()} Aura Edge</span>
            <Link to="/terms" className="hover:text-foreground transition-colors">
              Terms and Policies
            </Link>
          </div>

          {/* Social */}
          <a 
            href="https://instagram.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Instagram className="h-5 w-5" />
          </a>
        </div>
      </div>
    </footer>
  );
}