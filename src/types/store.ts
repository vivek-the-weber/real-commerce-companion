export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  compare_at_price?: number;
  category_id?: string;
  sku?: string;
  stock_quantity: number;
  is_active: boolean;
  is_featured: boolean;
  images: string[];
  specifications?: Record<string, string>;
  created_at: string;
  updated_at: string;
  category?: Category;
  variants?: ProductVariant[];
  // Shipping dimensions
  weight?: number;
  length?: number;
  breadth?: number;
  height?: number;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  sku?: string;
  price?: number;
  stock_quantity: number;
  options?: Record<string, string>;
  image_url?: string | null;
  created_at: string;
}

export interface CartItem {
  id: string;
  user_id?: string;
  session_id?: string;
  product_id: string;
  variant_id?: string;
  quantity: number;
  created_at: string;
  updated_at: string;
  product?: Product;
  variant?: ProductVariant;
}

export interface Address {
  id: string;
  user_id: string;
  full_name: string;
  phone?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface Order {
  id: string;
  order_number: string;
  user_id?: string;
  email: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  subtotal: number;
  shipping_amount: number;
  total: number;
  shipping_address: Address;
  billing_address?: Address;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  // Shiprocket shipping fields
  shiprocket_order_id?: string;
  shiprocket_shipment_id?: string;
  awb_code?: string;
  courier_name?: string;
  tracking_url?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  variant_id?: string;
  product_name: string;
  variant_name?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface StoreSettings {
  id: string;
  store_name: string;
  store_email?: string;
  store_phone?: string;
  currency: string;
  flat_shipping_rate: number;
  free_shipping_threshold?: number;
  razorpay_key_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email?: string;
  full_name?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product?: Product;
}