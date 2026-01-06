import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import Index from "./pages/Index";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Auth from "./pages/Auth";
import AccountProfile from "./pages/AccountProfile";
import AccountOrders from "./pages/AccountOrders";
import AccountOrderDetail from "./pages/AccountOrderDetail";
import AccountAddresses from "./pages/AccountAddresses";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminProductForm from "./pages/admin/AdminProductForm";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminCategoryForm from "./pages/admin/AdminCategoryForm";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminOrderDetail from "./pages/admin/AdminOrderDetail";
import AdminInventory from "./pages/admin/AdminInventory";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminImport from "./pages/admin/AdminImport";
import NotFound from "./pages/NotFound";
import LogoDisplay from "./pages/LogoDisplay";
import Terms from "./pages/Terms";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/product/:slug" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/account" element={<AccountProfile />} />
              <Route path="/account/orders" element={<AccountOrders />} />
              <Route path="/account/orders/:orderId" element={<AccountOrderDetail />} />
              <Route path="/account/addresses" element={<AccountAddresses />} />
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/products" element={<AdminProducts />} />
              <Route path="/admin/products/:productId" element={<AdminProductForm />} />
              <Route path="/admin/categories" element={<AdminCategories />} />
              <Route path="/admin/categories/:categoryId" element={<AdminCategoryForm />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="/admin/orders/:orderId" element={<AdminOrderDetail />} />
              <Route path="/admin/inventory" element={<AdminInventory />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route path="/admin/import" element={<AdminImport />} />
              <Route path="/auraedge-logo-image-display" element={<LogoDisplay />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;