export type PurchaseStatus = 'DRAFT' | 'CONFIRMED' | 'RECEIVED' | 'CANCELLED';
export type SaleStatus = 'DRAFT' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED';
export type StocktakeStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type TransferStatus = 'DRAFT' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
export type InventoryLogType = 'PURCHASE_IN' | 'SALE_OUT' | 'TRANSFER_OUT' | 'TRANSFER_IN' | 'STOCKTAKE_ADJUST';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  phone?: string;
  roleId?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  role?: Role;
}

export interface Role {
  id: string;
  tenantId: string;
  name: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  tenantId: string;
  name: string;
  parentId?: string;
  sortOrder: number;
  children?: Category[];
}

export interface Product {
  id: string;
  tenantId: string;
  categoryId?: string;
  name: string;
  barcode?: string;
  sku?: string;
  unit: string;
  salePrice: number;
  costPrice: number;
  imageUrl?: string;
  specs?: Record<string, unknown>;
  enabled: boolean;
  category?: Category;
}

export interface Warehouse {
  id: string;
  tenantId: string;
  name: string;
  address?: string;
  enabled: boolean;
}

export interface Supplier {
  id: string;
  tenantId: string;
  name: string;
  phone?: string;
  contact?: string;
  address?: string;
  enabled: boolean;
  totalAmount?: number;
}

export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  phone?: string;
  address?: string;
  enabled: boolean;
  totalAmount?: number;
}

export interface Inventory {
  id: string;
  tenantId: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  unitCost: number;
  updatedAt: string;
  product?: Product;
  warehouse?: Warehouse;
}

export interface RefOrder {
  type: string;
  orderNo: string;
  status: string;
  counterpartyName: string;
  totalAmount: string;
}

export interface InventoryLog {
  id: string;
  tenantId: string;
  productId: string;
  warehouseId?: string;
  type: InventoryLogType;
  quantity: number;
  beforeQty: number;
  afterQty: number;
  refId?: string;
  refType?: string;
  refOrder?: RefOrder;
  remark?: string;
  createdAt: string;
  product?: Product;
  warehouse?: Warehouse;
}

export interface PurchaseOrder {
  id: string;
  tenantId: string;
  orderNo: string;
  supplierId?: string;
  warehouseId?: string;
  totalAmount: number;
  status: PurchaseStatus;
  remark?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  supplier?: Supplier;
  warehouse?: Warehouse;
  items?: PurchaseItem[];
  createdByUser?: User;
}

export interface PurchaseItem {
  id: string;
  purchaseOrderId: string;
  productId: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
  receivedQty: number;
  product?: Product;
}

export interface SaleOrder {
  id: string;
  tenantId: string;
  orderNo: string;
  customerId?: string;
  warehouseId?: string;
  totalAmount: number;
  status: SaleStatus;
  remark?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  warehouse?: Warehouse;
  items?: SaleItem[];
  createdByUser?: User;
}

export interface SaleItem {
  id: string;
  saleOrderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  subtotal: number;
  deliveredQty: number;
  product?: Product;
}

export interface Stocktake {
  id: string;
  tenantId: string;
  warehouseId: string;
  status: StocktakeStatus;
  remark?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  warehouse?: Warehouse;
  items?: StocktakeItem[];
  createdByUser?: User;
}

export interface StocktakeItem {
  id: string;
  stocktakeId: string;
  productId: string;
  bookQuantity: number;
  actualQuantity: number;
  diffQuantity: number;
  product?: Product;
}

export interface Transfer {
  id: string;
  tenantId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  status: TransferStatus;
  remark?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  fromWarehouse?: Warehouse;
  toWarehouse?: Warehouse;
  items?: TransferItem[];
  createdByUser?: User;
}

export interface TransferItem {
  id: string;
  transferId: string;
  productId: string;
  quantity: number;
  product?: Product;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    tenantId: string;
    tenantName: string;
    role: string;
    permissions: string[];
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiError {
  message: string;
  error: string;
  statusCode: number;
}

export interface DashboardData {
  todaySales: number;
  todayPurchases: number;
  totalProducts: number;
  lowStockCount: number;
  monthlySales: number;
  monthlyPurchases: number;
  recentSales: SaleOrder[];
  recentPurchases: PurchaseOrder[];
}
