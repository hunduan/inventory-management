// Generic API response envelope
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
}

// Paginated response
export interface PaginatedResponse<T = unknown> {
  items: T[];
  total: number;
  page?: number;
  limit?: number;
}

// Domain entities
export interface Product {
  id: string;
  name: string;
  barcode?: string;
  unit: string;
  salePrice: number;
  costPrice: number;
  categoryId?: string;
  category?: { id: string; name: string };
  enabled: boolean;
  createdAt: string;
}

export interface Supplier {
  id: string; name: string; contact?: string; phone?: string; email?: string; address?: string; enabled: boolean;
}

export interface Customer {
  id: string; name: string; contact?: string; phone?: string; email?: string; address?: string; enabled: boolean;
}

export interface Warehouse {
  id: string; name: string; address?: string; enabled: boolean;
}

export interface Category {
  id: string; name: string; description?: string; enabled: boolean;
}

export interface OrderItem {
  id?: string;
  productId: string;
  productName?: string;
  product?: Product;
  quantity: number;
  unitCost?: number;
  unitPrice?: number;
}

export interface PurchaseOrder {
  id: string;
  orderNo: string;
  supplierId?: string;
  supplierName?: string;
  supplier?: Supplier;
  warehouseId?: string;
  warehouseName?: string;
  warehouse?: Warehouse;
  items: OrderItem[];
  totalAmount: number;
  status: 'DRAFT' | 'CONFIRMED' | 'RECEIVED' | 'CANCELLED';
  remark?: string;
  createdAt: string;
}

export interface SaleOrder {
  id: string;
  orderNo: string;
  customerId?: string;
  customerName?: string;
  customer?: Customer;
  warehouseId?: string;
  warehouseName?: string;
  warehouse?: Warehouse;
  items: OrderItem[];
  totalAmount: number;
  status: 'DRAFT' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED';
  remark?: string;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  productId: string;
  productName?: string;
  product?: Product;
  warehouseId: string;
  warehouseName?: string;
  barcode?: string;
  quantity: number;
  unit?: string;
}

export interface User {
  id: string;
  name?: string;
  email: string;
  tenantId: string;
  tenantName?: string;
  role?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

// Status constants
export type OrderStatus = 'DRAFT' | 'CONFIRMED' | 'RECEIVED' | 'DELIVERED' | 'CANCELLED';

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: '草稿', CONFIRMED: '已确认', RECEIVED: '已入库', DELIVERED: '已出库', SHIPPED: '已发货', CANCELLED: '已取消',
};

export const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  DRAFT: { bg: '#f5f5f4', text: '#78716c' },
  CONFIRMED: { bg: '#f0f9ff', text: '#075985' },
  RECEIVED: { bg: '#f0fdf4', text: '#166534' },
  DELIVERED: { bg: '#f0fdf4', text: '#166534' },
  SHIPPED: { bg: '#f0fdf4', text: '#166534' },
  CANCELLED: { bg: '#fef2f2', text: '#dc2626' },
};
