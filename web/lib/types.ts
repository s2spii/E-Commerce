/**
 * Shared TypeScript contracts for the Maison Luma storefront.
 * These mirror the JSON shapes returned by the Express API (responses are
 * wrapped in a `{ data }` envelope, unwrapped by `lib/api.ts`).
 *
 * All monetary values are integer minor units (cents) in EUR and are
 * tax-inclusive at the catalogue level.
 */

export type Currency = string; // ISO 4217, e.g. "EUR"

export interface CategoryRef {
  name: string;
  slug: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  imageUrl: string | null;
}

export interface ProductSummary {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  image: string | null;
  category: CategoryRef | null;
  fromPrice: number | null; // cents
  inStock: boolean;
  isFeatured: boolean;
  currency: Currency;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  pages: number;
}

export interface ProductListResponse {
  items: ProductSummary[];
  pagination: Pagination;
}

export interface ProductImage {
  url: string;
  alt: string | null;
}

export interface Variant {
  id: string;
  sku: string;
  name: string | null;
  price: number; // cents
  compareAtPrice: number | null;
  stock: number;
  attributes: Record<string, string> | null;
}

export interface Review {
  rating: number;
  title: string | null;
  body: string | null;
  createdAt: string;
}

export interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  story: string | null;
  brand: string | null;
  currency: Currency;
  taxClass: string;
  images: ProductImage[];
  category: CategoryRef | null;
  variants: Variant[];
  reviews: Review[];
}

export interface CartItem {
  id: string;
  variantId: string;
  sku: string;
  name: string;
  slug: string;
  variantName: string | null;
  image: string | null;
  unitPrice: number; // cents
  quantity: number;
  lineTotalInclTax: number; // cents
}

export interface TaxBreakdownLine {
  rate: number; // basis points, e.g. 2000 = 20%
  base: number; // cents
  tax: number; // cents
}

export interface Totals {
  subtotalExclTax: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  taxBreakdown: TaxBreakdownLine[];
  reverseCharge: boolean;
}

export interface CartSummary {
  token: string;
  couponCode: string | null;
  items: CartItem[];
  totals: Totals;
  couponError?: string;
  currency: Currency;
}

export type CustomerType = 'B2C' | 'B2B';

export interface Address {
  fullName: string;
  company?: string;
  line1: string;
  line2?: string;
  city: string;
  region?: string;
  postalCode: string;
  countryCode: string;
  phone?: string;
}

export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

export interface OrderSummary {
  id: string;
  number: string;
  status: OrderStatus;
  grandTotal: number;
  currency: Currency;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  productName: string;
  variantName: string | null;
  sku: string;
  quantity: number;
  unitPriceExclTax: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  lineTotalExclTax: number;
  lineTotalInclTax: number;
}

export interface OrderDetail {
  id: string;
  number: string;
  status: OrderStatus;
  email: string;
  customerType: CustomerType;
  vatNumber: string | null;
  reverseCharge: boolean;
  currency: Currency;
  subtotalExclTax: number;
  discountTotal: number;
  shippingExclTax: number;
  taxTotal: number;
  grandTotal: number;
  taxBreakdown: TaxBreakdownLine[];
  shippingAddress: Address;
  billingAddress: Address | null;
  items: OrderItem[];
  createdAt: string;
}

/** Result of POST /orders/checkout. */
export interface CheckoutResult {
  id: string;
  number: string;
  grandTotal: number;
  status: OrderStatus;
}

export interface RoleRef {
  name: string;
}

export interface Profile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  mfaEnabled: boolean;
  role: RoleRef;
  createdAt: string;
}

export interface LoginSuccess {
  accessToken: string;
  expiresIn: number;
  mustEnableMfa: boolean;
}

export interface LoginMfaRequired {
  mfaRequired: true;
}

export type LoginResponse = LoginSuccess | LoginMfaRequired;

export interface DashboardOrderRow {
  id: string;
  number: string;
  status: OrderStatus;
  grandTotal: number;
  createdAt: string;
}

export interface DashboardStats {
  ordersToday: number;
  pendingOrders: number;
  customers: number;
  lowStockVariants: number;
  grossRevenue: number;
  recentOrders: DashboardOrderRow[];
}

export interface CmsPage {
  title: string;
  content: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
}
