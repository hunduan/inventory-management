# 进销存管理系统 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a multi-tenant 进销存 (purchase-sale-inventory) management system with Web admin + WeChat Mini Program, supporting voice/scan/photo input.

**Architecture:** Monorepo with NestJS backend (PostgreSQL + Prisma + RLS for multi-tenant isolation) and Taro frontend (React + TypeScript compiling to both Web and WeChat Mini Program). JWT auth with tenant context injected via RLS. Business modules follow clean CRUD + transaction pattern.

**Tech Stack:** NestJS, TypeScript, Prisma, PostgreSQL, Redis, Taro, React, Tailwind CSS, shadcn/ui, html5-qrcode, Web Speech API

---

## File Structure

```
in-out/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── common/
│   │   │   ├── decorators/
│   │   │   │   ├── tenant.decorator.ts
│   │   │   │   └── current-user.decorator.ts
│   │   │   ├── guards/
│   │   │   │   ├── jwt-auth.guard.ts
│   │   │   │   └── roles.guard.ts
│   │   │   ├── interceptors/
│   │   │   │   └── tenant.interceptor.ts
│   │   │   └── filters/
│   │   │       └── http-exception.filter.ts
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   ├── auth.module.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── strategies/
│   │   │   │   │   └── jwt.strategy.ts
│   │   │   │   └── dto/
│   │   │   │       ├── login.dto.ts
│   │   │   │       └── register.dto.ts
│   │   │   ├── tenants/
│   │   │   │   ├── tenants.module.ts
│   │   │   │   ├── tenants.controller.ts
│   │   │   │   ├── tenants.service.ts
│   │   │   │   └── dto/
│   │   │   ├── users/
│   │   │   │   ├── users.module.ts
│   │   │   │   ├── users.controller.ts
│   │   │   │   ├── users.service.ts
│   │   │   │   └── dto/
│   │   │   ├── roles/
│   │   │   │   ├── roles.module.ts
│   │   │   │   ├── roles.controller.ts
│   │   │   │   ├── roles.service.ts
│   │   │   │   └── dto/
│   │   │   ├── products/
│   │   │   │   ├── products.module.ts
│   │   │   │   ├── products.controller.ts
│   │   │   │   ├── products.service.ts
│   │   │   │   └── dto/
│   │   │   ├── categories/
│   │   │   │   ├── categories.module.ts
│   │   │   │   ├── categories.controller.ts
│   │   │   │   ├── categories.service.ts
│   │   │   │   └── dto/
│   │   │   ├── suppliers/
│   │   │   ├── customers/
│   │   │   ├── warehouses/
│   │   │   ├── inventory/
│   │   │   │   ├── inventory.module.ts
│   │   │   │   ├── inventory.controller.ts
│   │   │   │   ├── inventory.service.ts
│   │   │   │   └── dto/
│   │   │   ├── purchases/
│   │   │   │   ├── purchases.module.ts
│   │   │   │   ├── purchases.controller.ts
│   │   │   │   ├── purchases.service.ts
│   │   │   │   └── dto/
│   │   │   ├── sales/
│   │   │   ├── stocktake/
│   │   │   ├── transfers/
│   │   │   ├── reports/
│   │   │   └── upload/
│   │   └── prisma/
│   │       ├── prisma.module.ts
│   │       └── prisma.service.ts
│   ├── test/
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── client/
│   ├── src/
│   │   ├── app.config.ts
│   │   ├── app.tsx
│   │   ├── app.less
│   │   ├── pages/
│   │   │   ├── web/
│   │   │   │   ├── login/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── purchases/
│   │   │   │   │   ├── index.tsx
│   │   │   │   │   ├── new.tsx
│   │   │   │   │   └── [id].tsx
│   │   │   │   ├── sales/
│   │   │   │   ├── inventory/
│   │   │   │   ├── products/
│   │   │   │   ├── categories/
│   │   │   │   ├── suppliers/
│   │   │   │   ├── customers/
│   │   │   │   ├── warehouses/
│   │   │   │   ├── reports/
│   │   │   │   └── settings/
│   │   │   └── mini/
│   │   │       ├── index/
│   │   │       ├── scan/
│   │   │       ├── voice/
│   │   │       ├── photo/
│   │   │       ├── purchase/
│   │   │       ├── sale/
│   │   │       ├── orders/
│   │   │       └── inventory/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── sidebar.tsx
│   │   │   │   ├── header.tsx
│   │   │   │   └── app-shell.tsx
│   │   │   ├── ui/
│   │   │   │   └── ... (shadcn/ui)
│   │   │   └── business/
│   │   │       ├── product-selector.tsx
│   │   │       ├── order-table.tsx
│   │   │       └── barcode-input.tsx
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   ├── auth.ts
│   │   │   ├── products.ts
│   │   │   └── ... (one per module)
│   │   ├── hooks/
│   │   │   ├── use-auth.ts
│   │   │   └── use-tenant.ts
│   │   ├── store/
│   │   │   └── auth.ts
│   │   └── utils/
│   │       ├── request.ts
│   │       └── format.ts
│   ├── package.json
│   └── config/
│       ├── index.ts
│       ├── dev.ts
│       └── prod.ts
└── docs/
    └── superpowers/
        ├── specs/
        └── plans/
```

---

## Phase 1: Project Scaffolding & Database

### Task 1: Initialize Backend NestJS Project

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/tsconfig.build.json`
- Create: `backend/nest-cli.json`
- Create: `backend/.env.example`
- Create: `backend/.env`

- [ ] **Step 1: Initialize NestJS project**

Run: `cd backend && npm init -y`
Then install dependencies:
```bash
cd backend
npm install @nestjs/core @nestjs/common @nestjs/platform-express @nestjs/config
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install @prisma/client prisma --save-dev
npm install class-validator class-transformer
npm install bcryptjs
npm install reflect-metadata rxjs
npm install @nestjs/swagger swagger-ui-express
npm install typescript @types/node @types/express --save-dev
npm install ts-node ts-loader --save-dev
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "strictBindCallApply": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Create .env.example**

```
DATABASE_URL="postgresql://user:password@localhost:5432/inout?schema=public"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
REDIS_URL="redis://localhost:6379"
UPLOAD_DIR="./uploads"
PORT=3000
```

- [ ] **Step 4: Create nest-cli.json**

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add backend/
git commit -m "chore: scaffold NestJS backend project"
```

### Task 2: Initialize Frontend Taro Project

**Files:**
- Create: `client/package.json`
- Create: `client/tsconfig.json`
- Create: `client/config/index.ts`
- Create: `client/config/dev.ts`
- Create: `client/config/prod.ts`
- Create: `client/src/app.config.ts`
- Create: `client/src/app.tsx`

- [ ] **Step 1: Initialize Taro project**

```bash
cd client && npm init -y
npm install @tarojs/cli@latest --save-dev
npm install @tarojs/webpack5-runner --save-dev
npm install @tarojs/plugin-framework-react
npm install react @tarojs/react @tarojs/taro @tarojs/components
npm install @tarojs/runtime
npm install tailwindcss postcss autoprefixer --save-dev
npm install zustand
npm install html5-qrcode
npm install @ant-design/icons
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "commonjs",
    "jsx": "react-jsx",
    "jsxImportSource": "react",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create config/index.ts**

```typescript
import { defineConfig } from '@tarojs/webpack5-runner'

export default defineConfig({
  appName: '进销存管理系统',
  entry: './src/app.tsx',
  output: {
    web: './dist/web',
    weapp: './dist/weapp'
  },
  alias: {
    '@': './src'
  },
  defineConstants: {
    API_BASE_URL: JSON.stringify('http://localhost:3000/api')
  },
  mini: {
    postcss: {
      // mini program specific config
    }
  },
  h5: {
    postcss: {
      tailwindcss: {
        enable: true,
        config: './tailwind.config.js'
      }
    }
  }
})
```

- [ ] **Step 4: Create app.config.ts**

```typescript
export default defineAppConfig({
  pages: [
    'pages/web/login/index',
    'pages/web/dashboard/index',
    'pages/web/purchases/index',
    'pages/web/purchases/new',
    'pages/web/purchases/[id]',
    'pages/web/sales/index',
    'pages/web/sales/new',
    'pages/web/sales/[id]',
    'pages/web/inventory/index',
    'pages/web/inventory/stocktake',
    'pages/web/inventory/transfer',
    'pages/web/products/index',
    'pages/web/categories/index',
    'pages/web/suppliers/index',
    'pages/web/customers/index',
    'pages/web/warehouses/index',
    'pages/web/reports/index',
    'pages/web/settings/index',
    'pages/web/settings/users',
    'pages/web/settings/roles',
    'pages/mini/index/index',
    'pages/mini/scan/index',
    'pages/mini/voice/index',
    'pages/mini/photo/index',
    'pages/mini/purchase/index',
    'pages/mini/sale/index',
    'pages/mini/orders/list',
    'pages/mini/orders/detail',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: '进销存',
    navigationBarTextStyle: 'black'
  }
})
```

- [ ] **Step 5: Create app.tsx**

```tsx
import { Component, PropsWithChildren } from 'react'
import './app.less'

class App extends Component<PropsWithChildren> {
  componentDidMount() {
    // Initialize auth check
  }

  render() {
    return this.props.children
  }
}

export default App
```

- [ ] **Step 6: Commit**

```bash
git add client/
git commit -m "chore: scaffold Taro frontend project"
```

### Task 3: Database Schema with Prisma

**Files:**
- Create: `backend/prisma/schema.prisma`
- Create: `backend/src/common/prisma/prisma.module.ts`
- Create: `backend/src/common/prisma/prisma.service.ts`

- [ ] **Step 1: Write Prisma schema**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Tenant {
  id        String   @id @default(uuid()) @db.Uuid
  name      String   @db.VarChar(200)
  slug      String   @unique @db.VarChar(100)
  logo      String?  @db.VarChar(500)
  enabled   Boolean  @default(true)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  users     User[]
  roles     Role[]
  products  Product[]
  // ... other relations

  @@map("tenants")
}

model User {
  id           String   @id @default(uuid()) @db.Uuid
  tenantId     String   @map("tenant_id") @db.Uuid
  email        String   @db.VarChar(200)
  passwordHash String   @map("password_hash") @db.VarChar(200)
  name         String   @db.VarChar(100)
  phone        String?  @db.VarChar(20)
  roleId       String?  @map("role_id") @db.Uuid
  enabled      Boolean  @default(true)
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  tenant Tenant @relation(fields: [tenantId], references: [id])
  role   Role?  @relation(fields: [roleId], references: [id])

  @@unique([tenantId, email])
  @@map("users")
}

model Role {
  id          String   @id @default(uuid()) @db.Uuid
  tenantId    String   @map("tenant_id") @db.Uuid
  name        String   @db.VarChar(100)
  permissions Json     @default("[]")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  tenant Tenant @relation(fields: [tenantId], references: [id])
  users  User[]

  @@unique([tenantId, name])
  @@map("roles")
}

model Category {
  id        String   @id @default(uuid()) @db.Uuid
  tenantId  String   @map("tenant_id") @db.Uuid
  name      String   @db.VarChar(200)
  parentId  String?  @map("parent_id") @db.Uuid
  sortOrder Int      @default(0) @map("sort_order")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  tenant   Tenant     @relation(fields: [tenantId], references: [id])
  parent   Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children Category[] @relation("CategoryHierarchy")
  products Product[]

  @@unique([tenantId, name])
  @@map("categories")
}

model Product {
  id         String   @id @default(uuid()) @db.Uuid
  tenantId   String   @map("tenant_id") @db.Uuid
  categoryId String?  @map("category_id") @db.Uuid
  name       String   @db.VarChar(200)
  barcode    String?  @db.VarChar(100)
  sku        String?  @db.VarChar(100)
  unit       String   @default("个") @db.VarChar(20)
  salePrice  Decimal  @default(0) @map("sale_price") @db.Decimal(10, 2)
  costPrice  Decimal  @default(0) @map("cost_price") @db.Decimal(10, 2)
  imageUrl   String?  @map("image_url") @db.VarChar(500)
  specs      Json?    @default("{}")
  enabled    Boolean  @default(true)
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  tenant       Tenant             @relation(fields: [tenantId], references: [id])
  category     Category?          @relation(fields: [categoryId], references: [id])
  inventory    Inventory[]
  purchaseItems PurchaseItem[]
  saleItems    SaleItem[]

  @@unique([tenantId, barcode])
  @@unique([tenantId, sku])
  @@index([tenantId, name])
  @@map("products")
}

model Warehouse {
  id        String   @id @default(uuid()) @db.Uuid
  tenantId  String   @map("tenant_id") @db.Uuid
  name      String   @db.VarChar(200)
  address   String?  @db.Text
  enabled   Boolean  @default(true)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  tenant      Tenant       @relation(fields: [tenantId], references: [id])
  inventory   Inventory[]
  stocktakes  Stocktake[]
  fromTransfers Transfer[] @relation("FromWarehouse")
  toTransfers   Transfer[] @relation("ToWarehouse")

  @@unique([tenantId, name])
  @@map("warehouses")
}

model Supplier {
  id        String   @id @default(uuid()) @db.Uuid
  tenantId  String   @map("tenant_id") @db.Uuid
  name      String   @db.VarChar(200)
  phone     String?  @db.VarChar(20)
  contact   String?  @db.VarChar(100)
  address   String?  @db.Text
  enabled   Boolean  @default(true)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  tenant       Tenant          @relation(fields: [tenantId], references: [id])
  purchaseOrders PurchaseOrder[]

  @@unique([tenantId, name])
  @@map("suppliers")
}

model Customer {
  id        String   @id @default(uuid()) @db.Uuid
  tenantId  String   @map("tenant_id") @db.Uuid
  name      String   @db.VarChar(200)
  phone     String?  @db.VarChar(20)
  address   String?  @db.Text
  enabled   Boolean  @default(true)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  tenant      Tenant     @relation(fields: [tenantId], references: [id])
  saleOrders  SaleOrder[]

  @@unique([tenantId, name])
  @@map("customers")
}

model Inventory {
  id          String   @id @default(uuid()) @db.Uuid
  tenantId    String   @map("tenant_id") @db.Uuid
  productId   String   @map("product_id") @db.Uuid
  warehouseId String   @map("warehouse_id") @db.Uuid
  quantity    Decimal  @default(0) @db.Decimal(12, 2)
  unitCost    Decimal  @default(0) @map("unit_cost") @db.Decimal(10, 2)
  updatedAt   DateTime @updatedAt @map("updated_at")

  tenant    Tenant    @relation(fields: [tenantId], references: [id])
  product   Product   @relation(fields: [productId], references: [id])
  warehouse Warehouse @relation(fields: [warehouseId], references: [id])

  @@unique([tenantId, productId, warehouseId])
  @@map("inventory")
}

model InventoryLog {
  id          String   @id @default(uuid()) @db.Uuid
  tenantId    String   @map("tenant_id") @db.Uuid
  productId   String   @map("product_id") @db.Uuid
  warehouseId String?  @map("warehouse_id") @db.Uuid
  type        String   @db.VarChar(20) // PURCHASE_IN, SALE_OUT, STOCKTAKE, TRANSFER_IN, TRANSFER_OUT, RETURN
  quantity    Decimal  @db.Decimal(12, 2)
  beforeQty   Decimal  @map("before_qty") @db.Decimal(12, 2)
  afterQty    Decimal  @map("after_qty") @db.Decimal(12, 2)
  refId       String?  @map("ref_id") @db.VarChar(100)
  refType     String?  @map("ref_type") @db.VarChar(50)
  remark      String?  @db.Text
  createdAt   DateTime @default(now()) @map("created_at")

  tenant  Tenant  @relation(fields: [tenantId], references: [id])
  product Product @relation(fields: [productId], references: [id])

  @@index([tenantId, productId])
  @@index([tenantId, createdAt])
  @@map("inventory_logs")
}

enum PurchaseStatus {
  DRAFT
  CONFIRMED
  RECEIVED
  CANCELLED
}

model PurchaseOrder {
  id            String          @id @default(uuid()) @db.Uuid
  tenantId      String          @map("tenant_id") @db.Uuid
  orderNo       String          @unique @map("order_no") @db.VarChar(50)
  supplierId    String?         @map("supplier_id") @db.Uuid
  warehouseId   String?         @map("warehouse_id") @db.Uuid
  totalAmount   Decimal         @default(0) @map("total_amount") @db.Decimal(12, 2)
  status        PurchaseStatus  @default(DRAFT)
  remark        String?         @db.Text
  createdBy     String          @map("created_by") @db.Uuid
  createdAt     DateTime        @default(now()) @map("created_at")
  updatedAt     DateTime        @updatedAt @map("updated_at")

  tenant    Tenant          @relation(fields: [tenantId], references: [id])
  supplier  Supplier?       @relation(fields: [supplierId], references: [id])
  warehouse Warehouse?      @relation(fields: [warehouseId], references: [id])
  items     PurchaseItem[]

  @@index([tenantId, orderNo])
  @@index([tenantId, createdAt])
  @@map("purchase_orders")
}

model PurchaseItem {
  id               String   @id @default(uuid()) @db.Uuid
  purchaseOrderId  String   @map("purchase_order_id") @db.Uuid
  productId        String   @map("product_id") @db.Uuid
  quantity         Decimal  @db.Decimal(12, 2)
  unitCost         Decimal  @map("unit_cost") @db.Decimal(10, 2)
  subtotal         Decimal  @db.Decimal(12, 2)

  purchaseOrder PurchaseOrder @relation(fields: [purchaseOrderId], references: [id], onDelete: Cascade)
  product       Product      @relation(fields: [productId], references: [id])

  @@map("purchase_items")
}

enum SaleStatus {
  DRAFT
  CONFIRMED
  DELIVERED
  CANCELLED
}

model SaleOrder {
  id          String       @id @default(uuid()) @db.Uuid
  tenantId    String       @map("tenant_id") @db.Uuid
  orderNo     String       @unique @map("order_no") @db.VarChar(50)
  customerId  String?      @map("customer_id") @db.Uuid
  warehouseId String?      @map("warehouse_id") @db.Uuid
  totalAmount Decimal      @default(0) @map("total_amount") @db.Decimal(12, 2)
  status      SaleStatus   @default(DRAFT)
  remark      String?      @db.Text
  createdBy   String       @map("created_by") @db.Uuid
  createdAt   DateTime     @default(now()) @map("created_at")
  updatedAt   DateTime     @updatedAt @map("updated_at")

  tenant   Tenant     @relation(fields: [tenantId], references: [id])
  customer Customer?  @relation(fields: [customerId], references: [id])
  warehouse Warehouse? @relation(fields: [warehouseId], references: [id])
  items    SaleItem[]

  @@index([tenantId, orderNo])
  @@index([tenantId, createdAt])
  @@map("sale_orders")
}

model SaleItem {
  id          String   @id @default(uuid()) @db.Uuid
  saleOrderId String   @map("sale_order_id") @db.Uuid
  productId   String   @map("product_id") @db.Uuid
  quantity    Decimal  @db.Decimal(12, 2)
  unitPrice   Decimal  @map("unit_price") @db.Decimal(10, 2)
  subtotal    Decimal  @db.Decimal(12, 2)

  saleOrder SaleOrder @relation(fields: [saleOrderId], references: [id], onDelete: Cascade)
  product   Product   @relation(fields: [productId], references: [id])

  @@map("sale_items")
}

enum StocktakeStatus {
  DRAFT
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

model Stocktake {
  id          String           @id @default(uuid()) @db.Uuid
  tenantId    String           @map("tenant_id") @db.Uuid
  warehouseId String           @map("warehouse_id") @db.Uuid
  status      StocktakeStatus  @default(DRAFT)
  remark      String?          @db.Text
  createdBy   String           @map("created_by") @db.Uuid
  createdAt   DateTime         @default(now()) @map("created_at")
  updatedAt   DateTime         @updatedAt @map("updated_at")

  tenant    Tenant           @relation(fields: [tenantId], references: [id])
  warehouse Warehouse        @relation(fields: [warehouseId], references: [id])
  items     StocktakeItem[]

  @@map("stocktakes")
}

model StocktakeItem {
  id             String  @id @default(uuid()) @db.Uuid
  stocktakeId    String  @map("stocktake_id") @db.Uuid
  productId      String  @map("product_id") @db.Uuid
  bookQuantity   Decimal @map("book_qty") @db.Decimal(12, 2)
  actualQuantity Decimal @map("actual_qty") @db.Decimal(12, 2)
  diffQuantity   Decimal @map("diff_qty") @db.Decimal(12, 2)

  stocktake Stocktake @relation(fields: [stocktakeId], references: [id], onDelete: Cascade)
  product   Product   @relation(fields: [productId], references: [id])

  @@map("stocktake_items")
}

enum TransferStatus {
  DRAFT
  CONFIRMED
  COMPLETED
  CANCELLED
}

model Transfer {
  id               String          @id @default(uuid()) @db.Uuid
  tenantId         String          @map("tenant_id") @db.Uuid
  fromWarehouseId  String          @map("from_warehouse_id") @db.Uuid
  toWarehouseId    String          @map("to_warehouse_id") @db.Uuid
  status           TransferStatus  @default(DRAFT)
  remark           String?         @db.Text
  createdBy        String          @map("created_by") @db.Uuid
  createdAt        DateTime        @default(now()) @map("created_at")
  updatedAt        DateTime        @updatedAt @map("updated_at")

  tenant       Tenant          @relation(fields: [tenantId], references: [id])
  fromWarehouse Warehouse      @relation("FromWarehouse", fields: [fromWarehouseId], references: [id])
  toWarehouse   Warehouse      @relation("ToWarehouse", fields: [toWarehouseId], references: [id])
  items        TransferItem[]

  @@map("transfers")
}

model TransferItem {
  id         String  @id @default(uuid()) @db.Uuid
  transferId String  @map("transfer_id") @db.Uuid
  productId  String  @map("product_id") @db.Uuid
  quantity   Decimal @db.Decimal(12, 2)

  transfer Transfer @relation(fields: [transferId], references: [id], onDelete: Cascade)
  product  Product  @relation(fields: [productId], references: [id])

  @@map("transfer_items")
}
```

- [ ] **Step 2: Create Prisma service**

```typescript
// src/common/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

- [ ] **Step 3: Create Prisma module**

```typescript
// src/common/prisma/prisma.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

- [ ] **Step 4: Run Prisma migration**

```bash
cd backend
npx prisma migrate dev --name init
```

Expected: Migration created and applied successfully.

- [ ] **Step 5: Commit**

```bash
git add backend/prisma/ backend/src/common/prisma/
git commit -m "feat: add Prisma schema with all entities and migrations"
```

---

## Phase 2: Auth & Multi-Tenant Infrastructure

### Task 4: JWT Auth Module

**Files:**
- Create: `backend/src/modules/auth/auth.module.ts`
- Create: `backend/src/modules/auth/auth.controller.ts`
- Create: `backend/src/modules/auth/auth.service.ts`
- Create: `backend/src/modules/auth/strategies/jwt.strategy.ts`
- Create: `backend/src/modules/auth/dto/login.dto.ts`
- Create: `backend/src/modules/auth/dto/register.dto.ts`
- Create: `backend/src/app.module.ts`

- [ ] **Step 1: Create login DTO**

```typescript
// src/modules/auth/dto/login.dto.ts
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}
```

- [ ] **Step 2: Create register DTO**

```typescript
// src/modules/auth/dto/register.dto.ts
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsString()
  tenantName: string;

  @IsString()
  tenantSlug: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(6)
  password: string;
}
```

- [ ] **Step 3: Create JWT strategy**

```typescript
// src/modules/auth/strategies/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'dev-secret',
    });
  }

  async validate(payload: { sub: string; email: string; tenantId: string; role: string }) {
    return {
      id: payload.sub,
      email: payload.email,
      tenantId: payload.tenantId,
      role: payload.role,
    };
  }
}
```

- [ ] **Step 4: Create AuthService**

```typescript
// src/modules/auth/auth.service.ts
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { tenant: true, role: true },
    });

    if (!user || !bcrypt.compareSync(dto.password, user.passwordHash)) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    if (!user.enabled || !user.tenant.enabled) {
      throw new UnauthorizedException('账户已被禁用');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role?.name || 'user',
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        tenantId: user.tenantId,
        tenantName: user.tenant.name,
        role: user.role?.name || 'user',
      },
    };
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('邮箱已被注册');
    }

    const tenantSlugTaken = await this.prisma.tenant.findUnique({
      where: { slug: dto.tenantSlug },
    });
    if (tenantSlugTaken) {
      throw new ConflictException('企业标识已被使用');
    }

    const passwordHash = bcrypt.hashSync(dto.password, 10);

    const tenant = await this.prisma.tenant.create({
      data: {
        name: dto.tenantName,
        slug: dto.tenantSlug,
      },
    });

    const adminRole = await this.prisma.role.create({
      data: {
        tenantId: tenant.id,
        name: 'admin',
        permissions: JSON.stringify([
          'purchase.*', 'sale.*', 'inventory.*',
          'product.*', 'report.*', 'setting.*',
        ]),
      },
    });

    const user = await this.prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: dto.email,
        passwordHash,
        name: dto.name,
        roleId: adminRole.id,
      },
    });

    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: 'admin',
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        tenantId: tenant.id,
        tenantName: tenant.name,
        role: 'admin',
      },
    };
  }
}
```

- [ ] **Step 5: Create AuthController**

```typescript
// src/modules/auth/auth.controller.ts
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('认证')
@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '用户登录' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('register')
  @ApiOperation({ summary: '注册新租户' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }
}
```

- [ ] **Step 6: Create AuthModule**

```typescript
// src/modules/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret',
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

- [ ] **Step 7: Create AppModule**

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    PrismaModule,
    AuthModule,
  ],
})
export class AppModule {}
```

- [ ] **Step 8: Create main.ts**

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  const config = new DocumentBuilder()
    .setTitle('进销存管理系统 API')
    .setDescription('进销存管理系统后端接口')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
```

- [ ] **Step 9: Commit**

```bash
git add backend/src/app.module.ts backend/src/main.ts backend/src/modules/auth/
git commit -m "feat: add JWT auth module with login/register"
```

### Task 5: Tenant Isolation Infrastructure (RLS + Guards)

**Files:**
- Create: `backend/src/common/decorators/tenant.decorator.ts`
- Create: `backend/src/common/decorators/current-user.decorator.ts`
- Create: `backend/src/common/guards/jwt-auth.guard.ts`
- Create: `backend/src/common/guards/roles.guard.ts`
- Create: `backend/src/common/interceptors/tenant.interceptor.ts`
- Create: `backend/src/common/filters/http-exception.filter.ts`

- [ ] **Step 1: Create tenant decorator**

```typescript
// src/common/decorators/tenant.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const TenantId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.tenantId;
  },
);
```

- [ ] **Step 2: Create current-user decorator**

```typescript
// src/common/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

- [ ] **Step 3: Create JWT auth guard**

```typescript
// src/common/guards/jwt-auth.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

- [ ] **Step 4: Create roles guard**

```typescript
// src/common/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const PERMISSIONS_KEY = 'permissions';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredPermissions) return true;

    const { user } = context.switchToHttp().getRequest();
    // Admin role has all permissions
    if (user.role === 'admin') return true;

    // Check specific permissions from user's role
    // For now, simple role check
    return requiredPermissions.some((p) => user.permissions?.includes(p));
  }
}
```

- [ ] **Step 5: Create tenant interceptor**

```typescript
// src/common/interceptors/tenant.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.user?.tenantId;

    if (tenantId) {
      // Set tenant context for Prisma RLS
      // In production, this would execute: `SET app.current_tenant_id = '${tenantId}'`
      // For now, we inject it via request for middleware use
      request.tenantId = tenantId;
    }

    return next.handle();
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add backend/src/common/
git commit -m "feat: add tenant isolation infrastructure (RLS, guards, decorators)"
```

---

## Phase 3: Core CRUD APIs

### Task 6: Tenants & Users CRUD

**Files:**
- Create: `backend/src/modules/tenants/tenants.module.ts`
- Create: `backend/src/modules/tenants/tenants.controller.ts`
- Create: `backend/src/modules/tenants/tenants.service.ts`
- Create: `backend/src/modules/users/users.module.ts`
- Create: `backend/src/modules/users/users.controller.ts`
- Create: `backend/src/modules/users/users.service.ts`

- [ ] **Step 1: Write TenantsService**

```typescript
// src/modules/tenants/tenants.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.tenant.findUnique({ where: { id } });
  }

  async update(id: string, data: { name?: string; logo?: string }) {
    return this.prisma.tenant.update({ where: { id }, data });
  }
}
```

- [ ] **Step 2: Write TenantsController**

```typescript
// src/modules/tenants/tenants.controller.ts
import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('租户')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/tenants')
export class TenantsController {
  constructor(private tenantsService: TenantsService) {}

  @Get()
  async getProfile(@TenantId() tenantId: string) {
    return this.tenantsService.findById(tenantId);
  }

  @Patch()
  async update(@TenantId() tenantId: string, @Body() data: { name?: string; logo?: string }) {
    return this.tenantsService.update(tenantId, data);
  }
}
```

- [ ] **Step 3: Write UsersService**

```typescript
// src/modules/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
      select: { id: true, name: true, email: true, phone: true, roleId: true, enabled: true, createdAt: true },
    });
  }

  async findByTenant(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
      include: { role: true },
    });
  }
}
```

- [ ] **Step 4: Wire modules into AppModule and commit**

```bash
git add backend/src/modules/tenants/ backend/src/modules/users/
git commit -m "feat: add tenant and user CRUD modules"
```

### Task 7: Products & Categories CRUD API

**Files:**
- Create: `backend/src/modules/products/products.module.ts`
- Create: `backend/src/modules/products/products.controller.ts`
- Create: `backend/src/modules/products/products.service.ts`
- Create: `backend/src/modules/products/dto/create-product.dto.ts`
- Create: `backend/src/modules/products/dto/update-product.dto.ts`
- Create: `backend/src/modules/products/dto/query-product.dto.ts`
- Create: `backend/src/modules/categories/categories.module.ts`
- Create: `backend/src/modules/categories/categories.controller.ts`
- Create: `backend/src/modules/categories/categories.service.ts`

- [ ] **Step 1: Create product DTOs**

```typescript
// src/modules/products/dto/create-product.dto.ts
import { IsString, IsOptional, IsNumber, IsBoolean, IsArray } from 'class-validator';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsNumber()
  @IsOptional()
  salePrice?: number;

  @IsNumber()
  @IsOptional()
  costPrice?: number;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}
```

```typescript
// src/modules/products/dto/query-product.dto.ts
import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryProductDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
```

- [ ] **Step 2: Write ProductsService**

```typescript
// src/modules/products/products.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: QueryProductDto) {
    const where: any = { tenantId };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { barcode: { contains: query.search } },
        { sku: { contains: query.search } },
      ];
    }
    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { category: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(tenantId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId },
      include: { category: true },
    });
    if (!product) throw new NotFoundException('商品不存在');
    return product;
  }

  async findByBarcode(tenantId: string, barcode: string) {
    return this.prisma.product.findFirst({
      where: { tenantId, barcode },
    });
  }

  async create(tenantId: string, dto: CreateProductDto) {
    return this.prisma.product.create({
      data: { ...dto, tenantId, salePrice: dto.salePrice || 0, costPrice: dto.costPrice || 0 },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateProductDto) {
    await this.findById(tenantId, id);
    return this.prisma.product.update({ where: { id }, data: dto });
  }

  async remove(tenantId: string, id: string) {
    await this.findById(tenantId, id);
    return this.prisma.product.update({ where: { id }, data: { enabled: false } });
  }
}
```

- [ ] **Step 3: Write ProductsController**

```typescript
// src/modules/products/products.controller.ts
import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';

@ApiTags('商品')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: '商品列表（分页+搜索）' })
  async findAll(@TenantId() tenantId: string, @Query() query: QueryProductDto) {
    return this.productsService.findAll(tenantId, query);
  }

  @Get('barcode/:barcode')
  @ApiOperation({ summary: '按条码查询商品' })
  async findByBarcode(@TenantId() tenantId: string, @Param('barcode') barcode: string) {
    return this.productsService.findByBarcode(tenantId, barcode);
  }

  @Get(':id')
  @ApiOperation({ summary: '商品详情' })
  async findById(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.productsService.findById(tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: '创建商品' })
  async create(@TenantId() tenantId: string, @Body() dto: CreateProductDto) {
    return this.productsService.create(tenantId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新商品' })
  async update(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除商品（软删除）' })
  async remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.productsService.remove(tenantId, id);
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/modules/products/ backend/src/modules/categories/
git commit -m "feat: add products and categories CRUD APIs"
```

### Task 8: Suppliers, Customers, Warehouses CRUD APIs

**Files:**
- Create: `backend/src/modules/suppliers/suppliers.module.ts`
- Create: `backend/src/modules/suppliers/suppliers.controller.ts`
- Create: `backend/src/modules/suppliers/suppliers.service.ts`
- Create: `backend/src/modules/customers/customers.module.ts`
- Create: `backend/src/modules/customers/customers.controller.ts`
- Create: `backend/src/modules/customers/customers.service.ts`
- Create: `backend/src/modules/warehouses/warehouses.module.ts`
- Create: `backend/src/modules/warehouses/warehouses.controller.ts`
- Create: `backend/src/modules/warehouses/warehouses.service.ts`

Each module follows the same pattern:
- Controller: findAll (paginated), findById, create, update, remove (soft-delete)
- Service: tenant-scoped queries
- DTOs: create/update

- [ ] **Step 1: Write SuppliersService**

```typescript
// src/modules/suppliers/suppliers.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: { search?: string; page?: number; limit?: number }) {
    const where: any = { tenantId };
    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { phone: { contains: query.search } },
      ];
    }
    const page = query.page || 1;
    const limit = query.limit || 20;
    const [items, total] = await Promise.all([
      this.prisma.supplier.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.supplier.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async create(tenantId: string, data: { name: string; phone?: string; contact?: string; address?: string }) {
    return this.prisma.supplier.create({ data: { ...data, tenantId } });
  }

  async update(tenantId: string, id: string, data: any) {
    await this.findById(tenantId, id);
    return this.prisma.supplier.update({ where: { id }, data });
  }

  async findById(tenantId: string, id: string) {
    const item = await this.prisma.supplier.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('供应商不存在');
    return item;
  }
}
```

Follow the same pattern for CustomersService and WarehousesService.

- [ ] **Step 2: Commit**

```bash
git add backend/src/modules/suppliers/ backend/src/modules/customers/ backend/src/modules/warehouses/
git commit -m "feat: add suppliers, customers, warehouses CRUD APIs"
```

---

## Phase 4: Business Transaction APIs

### Task 9: Purchase Orders API

**Files:**
- Create: `backend/src/modules/purchases/purchases.module.ts`
- Create: `backend/src/modules/purchases/purchases.controller.ts`
- Create: `backend/src/modules/purchases/purchases.service.ts`
- Create: `backend/src/modules/purchases/dto/create-purchase.dto.ts`

- [ ] **Step 1: Create purchase DTO**

```typescript
// src/modules/purchases/dto/create-purchase.dto.ts
import { IsString, IsOptional, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

class PurchaseItemDto {
  @IsString()
  productId: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unitCost: number;
}

export class CreatePurchaseDto {
  @IsString()
  @IsOptional()
  supplierId?: string;

  @IsString()
  @IsOptional()
  warehouseId?: string;

  @IsString()
  @IsOptional()
  remark?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseItemDto)
  items: PurchaseItemDto[];
}
```

- [ ] **Step 2: Write PurchasesService**

```typescript
// src/modules/purchases/purchases.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';

@Injectable()
export class PurchasesService {
  constructor(private prisma: PrismaService) {}

  private async generateOrderNo(tenantId: string): Promise<string> {
    const date = new Date();
    const prefix = `PO${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-`;
    const count = await this.prisma.purchaseOrder.count({
      where: { tenantId, createdAt: { gte: new Date(date.setHours(0, 0, 0, 0)) } },
    });
    return `${prefix}${String(count + 1).padStart(3, '0')}`;
  }

  async findAll(tenantId: string, query: { page?: number; limit?: number; status?: string }) {
    const where: any = { tenantId };
    if (query.status) where.status = query.status;

    const page = query.page || 1;
    const limit = query.limit || 20;
    const [items, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where,
        include: { supplier: true, items: { include: { product: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(tenantId: string, id: string) {
    const order = await this.prisma.purchaseOrder.findFirst({
      where: { id, tenantId },
      include: { supplier: true, items: { include: { product: true } } },
    });
    if (!order) throw new NotFoundException('采购单不存在');
    return order;
  }

  async create(tenantId: string, userId: string, dto: CreatePurchaseDto) {
    const orderNo = await this.generateOrderNo(tenantId);

    const items = dto.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitCost: item.unitCost,
      subtotal: item.quantity * item.unitCost,
    }));

    const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

    return this.prisma.purchaseOrder.create({
      data: {
        tenantId,
        orderNo,
        supplierId: dto.supplierId,
        warehouseId: dto.warehouseId,
        remark: dto.remark,
        totalAmount,
        status: 'DRAFT',
        createdBy: userId,
        items: { create: items },
      },
      include: { supplier: true, items: { include: { product: true } } },
    });
  }

  async confirm(tenantId: string, id: string) {
    await this.findById(tenantId, id);
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'CONFIRMED' },
    });
  }

  async receive(tenantId: string, id: string) {
    const order = await this.findById(tenantId, id);
    if (order.status !== 'CONFIRMED') throw new NotFoundException('采购单未确认');

    // Update inventory for each item
    const items = order.items;
    for (const item of items) {
      const warehouseId = order.warehouseId;
      if (!warehouseId) continue;

      // Get current inventory
      const inv = await this.prisma.inventory.findFirst({
        where: { tenantId, productId: item.productId, warehouseId },
      });

      if (inv) {
        // Update existing inventory
        const newQty = Number(inv.quantity) + Number(item.quantity);
        const newCost = ((Number(inv.unitCost) * Number(inv.quantity)) + (Number(item.unitCost) * Number(item.quantity))) / newQty;
        await this.prisma.inventory.update({
          where: { id: inv.id },
          data: { quantity: newQty, unitCost: newCost },
        });

        // Log inventory change
        await this.prisma.inventoryLog.create({
          data: {
            tenantId,
            productId: item.productId,
            warehouseId,
            type: 'PURCHASE_IN',
            quantity: item.quantity,
            beforeQty: Number(inv.quantity),
            afterQty: newQty,
            refId: order.id,
            refType: 'PURCHASE_ORDER',
          },
        });
      } else {
        // Create new inventory record
        await this.prisma.inventory.create({
          data: {
            tenantId,
            productId: item.productId,
            warehouseId,
            quantity: item.quantity,
            unitCost: item.unitCost,
          },
        });

        await this.prisma.inventoryLog.create({
          data: {
            tenantId,
            productId: item.productId,
            warehouseId,
            type: 'PURCHASE_IN',
            quantity: item.quantity,
            beforeQty: 0,
            afterQty: Number(item.quantity),
            refId: order.id,
            refType: 'PURCHASE_ORDER',
          },
        });
      }
    }

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'RECEIVED' },
    });
  }
}
```

- [ ] **Step 3: Write PurchasesController**

```typescript
// src/modules/purchases/purchases.controller.ts
import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PurchasesService } from './purchases.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreatePurchaseDto } from './dto/create-purchase.dto';

@ApiTags('采购')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/purchases')
export class PurchasesController {
  constructor(private purchasesService: PurchasesService) {}

  @Get()
  @ApiOperation({ summary: '采购单列表' })
  async findAll(@TenantId() tenantId: string, @Query() query: any) {
    return this.purchasesService.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: '采购单详情' })
  async findById(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.purchasesService.findById(tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: '创建采购单' })
  async create(@TenantId() tenantId: string, @CurrentUser() user: any, @Body() dto: CreatePurchaseDto) {
    return this.purchasesService.create(tenantId, user.id, dto);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: '确认采购单' })
  async confirm(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.purchasesService.confirm(tenantId, id);
  }

  @Post(':id/receive')
  @ApiOperation({ summary: '采购入库' })
  async receive(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.purchasesService.receive(tenantId, id);
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/modules/purchases/
git commit -m "feat: add purchase orders API with inventory updates"
```

### Task 10: Sales Orders API

**Files:**
- Create: `backend/src/modules/sales/sales.module.ts`
- Create: `backend/src/modules/sales/sales.controller.ts`
- Create: `backend/src/modules/sales/sales.service.ts`
- Create: `backend/src/modules/sales/dto/create-sale.dto.ts`

- [ ] **Step 1: Write SalesService** (same pattern as PurchasesService but with inventory deduction)

```typescript
// src/modules/sales/sales.service.ts - Key difference: deliver() reduces inventory
async deliver(tenantId: string, id: string) {
  const order = await this.findById(tenantId, id);
  if (order.status !== 'CONFIRMED') throw new NotFoundException('销售单未确认');

  for (const item of order.items) {
    const warehouseId = order.warehouseId;
    if (!warehouseId) continue;

    const inv = await this.prisma.inventory.findFirst({
      where: { tenantId, productId: item.productId, warehouseId },
    });
    if (!inv || Number(inv.quantity) < Number(item.quantity)) {
      throw new Error(`商品 ${item.product.name} 库存不足`);
    }

    const newQty = Number(inv.quantity) - Number(item.quantity);
    await this.prisma.inventory.update({
      where: { id: inv.id },
      data: { quantity: newQty },
    });

    await this.prisma.inventoryLog.create({
      data: {
        tenantId,
        productId: item.productId,
        warehouseId,
        type: 'SALE_OUT',
        quantity: -Number(item.quantity),
        beforeQty: Number(inv.quantity),
        afterQty: newQty,
        refId: order.id,
        refType: 'SALE_ORDER',
      },
    });
  }

  return this.prisma.saleOrder.update({ where: { id }, data: { status: 'DELIVERED' } });
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/modules/sales/
git commit -m "feat: add sales orders API with inventory deduction"
```

### Task 11: Stocktake & Transfer APIs

**Files:**
- Create: `backend/src/modules/stocktake/stocktake.module.ts`
- Create: `backend/src/modules/stocktake/stocktake.controller.ts`
- Create: `backend/src/modules/stocktake/stocktake.service.ts`
- Create: `backend/src/modules/transfers/transfers.module.ts`
- Create: `backend/src/modules/transfers/transfers.controller.ts`
- Create: `backend/src/modules/transfers/transfers.service.ts`

- [ ] **Step 1: Write StocktakeService** (key method: complete() generates diff and updates inventory)

```typescript
async complete(tenantId: string, id: string) {
  const stocktake = await this.prisma.stocktake.findFirst({
    where: { id, tenantId },
    include: { items: true },
  });

  for (const item of stocktake.items) {
    const diff = Number(item.actualQuantity) - Number(item.bookQuantity);
    if (diff === 0) continue;

    const inv = await this.prisma.inventory.findFirst({
      where: { tenantId, productId: item.productId, warehouseId: stocktake.warehouseId },
    });
    if (inv) {
      const newQty = Number(inv.quantity) + diff;
      await this.prisma.inventory.update({
        where: { id: inv.id },
        data: { quantity: newQty },
      });
    }
  }

  return this.prisma.stocktake.update({ where: { id }, data: { status: 'COMPLETED' } });
}
```

- [ ] **Step 2: Write TransferService** (complete() moves inventory between warehouses)

```typescript
async complete(tenantId: string, id: string) {
  const transfer = await this.prisma.transfer.findFirst({
    where: { id, tenantId },
    include: { items: true },
  });

  for (const item of transfer.items) {
    // Deduct from source warehouse
    const fromInv = await this.prisma.inventory.findFirst({
      where: { tenantId, productId: item.productId, warehouseId: transfer.fromWarehouseId },
    });
    if (fromInv) {
      const newFromQty = Number(fromInv.quantity) - Number(item.quantity);
      await this.prisma.inventory.update({ where: { id: fromInv.id }, data: { quantity: newFromQty } });
    }

    // Add to target warehouse
    const toInv = await this.prisma.inventory.findFirst({
      where: { tenantId, productId: item.productId, warehouseId: transfer.toWarehouseId },
    });
    if (toInv) {
      const newToQty = Number(toInv.quantity) + Number(item.quantity);
      await this.prisma.inventory.update({ where: { id: toInv.id }, data: { quantity: newToQty } });
    } else {
      await this.prisma.inventory.create({
        data: { tenantId, productId: item.productId, warehouseId: transfer.toWarehouseId, quantity: item.quantity, unitCost: 0 },
      });
    }
  }

  return this.prisma.transfer.update({ where: { id }, data: { status: 'COMPLETED' } });
}
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/modules/stocktake/ backend/src/modules/transfers/
git commit -m "feat: add stocktake and transfer APIs"
```

### Task 12: Inventory & Reports APIs

**Files:**
- Create: `backend/src/modules/inventory/inventory.module.ts`
- Create: `backend/src/modules/inventory/inventory.controller.ts`
- Create: `backend/src/modules/inventory/inventory.service.ts`
- Create: `backend/src/modules/reports/reports.module.ts`
- Create: `backend/src/modules/reports/reports.controller.ts`
- Create: `backend/src/modules/reports/reports.service.ts`

- [ ] **Step 1: Write InventoryService**

```typescript
// src/modules/inventory/inventory.service.ts
@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: { productId?: string; warehouseId?: string; search?: string; page?: number; limit?: number }) {
    const where: any = { tenantId };
    if (query.productId) where.productId = query.productId;
    if (query.warehouseId) where.warehouseId = query.warehouseId;
    if (query.search) {
      where.product = { name: { contains: query.search } };
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const [items, total] = await Promise.all([
      this.prisma.inventory.findMany({
        where,
        include: { product: true, warehouse: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.inventory.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getAlerts(tenantId: string, threshold: number = 10) {
    return this.prisma.inventory.findMany({
      where: { tenantId, quantity: { lte: threshold } },
      include: { product: true, warehouse: true },
      orderBy: { quantity: 'asc' },
    });
  }

  async getLogs(tenantId: string, query: { productId?: string; page?: number; limit?: number }) {
    const where: any = { tenantId };
    if (query.productId) where.productId = query.productId;

    const page = query.page || 1;
    const limit = query.limit || 20;
    const [items, total] = await Promise.all([
      this.prisma.inventoryLog.findMany({
        where,
        include: { product: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.inventoryLog.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
```

- [ ] **Step 2: Write ReportsService**

```typescript
// src/modules/reports/reports.service.ts
@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async purchaseReport(tenantId: string, startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const orders = await this.prisma.purchaseOrder.findMany({
      where: { tenantId, createdAt: { gte: start, lte: end }, status: { not: 'CANCELLED' } },
      include: { supplier: true, items: { include: { product: true } } },
    });

    const totalAmount = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const bySupplier = this.groupBy(orders, 'supplierId', 'supplier');

    return { totalOrders: orders.length, totalAmount, bySupplier, orders };
  }

  async saleReport(tenantId: string, startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const orders = await this.prisma.saleOrder.findMany({
      where: { tenantId, createdAt: { gte: start, lte: end }, status: { not: 'CANCELLED' } },
      include: { customer: true, items: { include: { product: true } } },
    });

    const totalAmount = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const byCustomer = this.groupBy(orders, 'customerId', 'customer');

    return { totalOrders: orders.length, totalAmount, byCustomer, orders };
  }

  async profitReport(tenantId: string, startDate: string, endDate: string) {
    const sales = await this.prisma.saleItem.findMany({
      where: {
        saleOrder: { tenantId, createdAt: { gte: new Date(startDate), lte: new Date(endDate) }, status: 'DELIVERED' },
      },
      include: { product: true, saleOrder: true },
    });

    const totalRevenue = sales.reduce((sum, s) => sum + Number(s.subtotal), 0);
    const totalCost = sales.reduce((sum, s) => sum + Number(s.quantity) * Number(s.product.costPrice), 0);
    const grossProfit = totalRevenue - totalCost;

    return {
      totalRevenue,
      totalCost,
      grossProfit,
      profitMargin: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0,
    };
  }

  private groupBy(items: any[], key: string, relation: string) {
    const map = new Map();
    for (const item of items) {
      const id = item[key];
      if (!id) continue;
      if (!map.has(id)) {
        map.set(id, { ...item[relation], totalAmount: 0, count: 0 });
      }
      map.get(id).totalAmount += Number(item.totalAmount);
      map.get(id).count += 1;
    }
    return Array.from(map.values());
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/modules/inventory/ backend/src/modules/reports/
git commit -m "feat: add inventory query and report APIs"
```

---

## Phase 5: Web Frontend - Admin UI

### Task 13: Frontend Foundation (Layout, Auth, API Client)

**Files:**
- Create: `client/src/utils/request.ts`
- Create: `client/src/services/api.ts`
- Create: `client/src/services/auth.ts`
- Create: `client/src/store/auth.ts`
- Create: `client/src/hooks/use-auth.ts`
- Create: `client/src/components/layout/sidebar.tsx`
- Create: `client/src/components/layout/header.tsx`
- Create: `client/src/components/layout/app-shell.tsx`
- Create: `client/src/pages/web/login/index.tsx`

- [ ] **Step 1: Create API request utility**

```typescript
// client/src/utils/request.ts
import Taro from '@tarojs/taro';

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  data?: any;
  params?: Record<string, any>;
}

export async function request<T = any>(url: string, options: RequestOptions = {}): Promise<T> {
  const token = Taro.getStorageSync('token');

  const config: any = {
    url: `${BASE_URL}${url}`,
    method: options.method || 'GET',
    header: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };

  if (options.data) config.data = options.data;

  const response = await Taro.request(config);
  if (response.statusCode >= 400) {
    throw new Error(response.data.message || '请求失败');
  }
  return response.data;
}

export const api = {
  get: <T>(url: string, params?: Record<string, any>) => request<T>(url, { params }),
  post: <T>(url: string, data?: any) => request<T>(url, { method: 'POST', data }),
  patch: <T>(url: string, data?: any) => request<T>(url, { method: 'PATCH', data }),
  delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
};
```

- [ ] **Step 2: Create auth store**

```typescript
// client/src/store/auth.ts
import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
  tenantId: string;
  tenantName: string;
  role: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  setAuth: (token, user) => {
    set({ token, user });
  },
  logout: () => {
    set({ token: null, user: null });
  },
  isAuthenticated: () => !!get().token,
}));
```

- [ ] **Step 3: Create login page**

```tsx
// client/src/pages/web/login/index.tsx
import { useState } from 'react';
import { View, Text, Input, Button, Form } from '@tarojs/components';
import { api } from '../../../utils/request';
import { useAuthStore } from '../../../store/auth';
import Taro from '@tarojs/taro';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      setAuth(res.accessToken, res.user);
      Taro.setStorageSync('token', res.accessToken);
      Taro.setStorageSync('user', JSON.stringify(res.user));
      Taro.navigateTo({ url: '/pages/web/dashboard/index' });
    } catch (err: any) {
      Taro.showToast({ title: err.message, icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="min-h-screen flex items-center justify-center bg-gray-50">
      <View className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <Text className="text-2xl font-bold text-center block mb-6">进销存管理系统</Text>
        <Input
          className="border rounded-lg px-4 py-2 mb-4 w-full"
          placeholder="邮箱"
          value={email}
          onInput={(e) => setEmail(e.detail.value)}
        />
        <Input
          className="border rounded-lg px-4 py-2 mb-6 w-full"
          placeholder="密码"
          password
          value={password}
          onInput={(e) => setPassword(e.detail.value)}
        />
        <Button
          className="bg-blue-600 text-white rounded-lg py-2 w-full"
          loading={loading}
          onClick={handleLogin}
        >
          登录
        </Button>
        <Text
          className="text-blue-500 text-center block mt-4"
          onClick={() => Taro.navigateTo({ url: '/pages/web/register/index' })}
        >
          还没有账号？注册
        </Text>
      </View>
    </View>
  );
}
```

- [ ] **Step 4: Create layout components**

```tsx
// client/src/components/layout/app-shell.tsx
import { View } from '@tarojs/components';
import Sidebar from './sidebar';
import Header from './header';
import { PropsWithChildren } from 'react';

export default function AppShell({ children }: PropsWithChildren) {
  return (
    <View className="flex h-screen bg-gray-50">
      <Sidebar />
      <View className="flex-1 flex flex-col">
        <Header />
        <View className="flex-1 p-6 overflow-auto">
          {children}
        </View>
      </View>
    </View>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add client/src/utils/ client/src/services/ client/src/store/ client/src/hooks/ client/src/components/ client/src/pages/web/login/
git commit -m "feat: add frontend foundation (auth, layout, API client)"
```

### Task 14: Products & Categories Pages

**Files:**
- Create: `client/src/pages/web/products/index.tsx`
- Create: `client/src/pages/web/categories/index.tsx`
- Create: `client/src/services/products.ts`

- [ ] **Step 1: Create products service**

```typescript
// client/src/services/products.ts
import { api } from '../utils/request';

export interface Product {
  id: string;
  name: string;
  barcode?: string;
  sku?: string;
  unit: string;
  salePrice: number;
  costPrice: number;
  category?: { id: string; name: string };
  enabled: boolean;
}

export const productsApi = {
  list: (params?: any) => api.get<any>('/products', params),
  getById: (id: string) => api.get<Product>(`/products/${id}`),
  getByBarcode: (barcode: string) => api.get<Product>(`/products/barcode/${barcode}`),
  create: (data: Partial<Product>) => api.post<Product>('/products', data),
  update: (id: string, data: Partial<Product>) => api.patch<Product>(`/products/${id}`, data),
  remove: (id: string) => api.delete(`/products/${id}`),
};
```

- [ ] **Step 2: Create products list page**

```tsx
// client/src/pages/web/products/index.tsx
import { useState, useEffect } from 'react';
import { View, Text, Input, Button, ScrollView } from '@tarojs/components';
import AppShell from '../../../components/layout/app-shell';
import { productsApi, Product } from '../../../services/products';
import Taro from '@tarojs/taro';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await productsApi.list({ search, page, limit: 20 });
      setProducts(res.items);
      setTotal(res.total);
    } catch (err: any) {
      Taro.showToast({ title: err.message, icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProducts(); }, [page]);

  const handleSearch = () => {
    setPage(1);
    loadProducts();
  };

  return (
    <AppShell>
      <View className="mb-4 flex gap-2">
        <Input
          className="border rounded-lg px-4 py-2 flex-1"
          placeholder="搜索商品名称/条码/SKU"
          value={search}
          onInput={(e) => setSearch(e.detail.value)}
          onConfirm={handleSearch}
        />
        <Button className="bg-blue-600 text-white px-4 rounded-lg" onClick={handleSearch}>搜索</Button>
        <Button className="bg-green-600 text-white px-4 rounded-lg" onClick={() => Taro.navigateTo({ url: '/pages/web/products/new' })}>新增</Button>
      </View>

      <ScrollView className="bg-white rounded-lg shadow">
        <View className="grid grid-cols-6 gap-4 p-4 font-bold border-b">
          <Text>名称</Text>
          <Text>条码</Text>
          <Text>分类</Text>
          <Text>单位</Text>
          <Text>售价</Text>
          <Text>操作</Text>
        </View>
        {products.map((p) => (
          <View key={p.id} className="grid grid-cols-6 gap-4 p-4 border-b hover:bg-gray-50">
            <Text>{p.name}</Text>
            <Text>{p.barcode || '-'}</Text>
            <Text>{p.category?.name || '-'}</Text>
            <Text>{p.unit}</Text>
            <Text>¥{Number(p.salePrice).toFixed(2)}</Text>
            <View className="flex gap-2">
              <Button size="small" onClick={() => Taro.navigateTo({ url: `/pages/web/products/${p.id}` })}>编辑</Button>
            </View>
          </View>
        ))}
      </ScrollView>

      <View className="flex justify-center gap-2 mt-4">
        <Button disabled={page <= 1} onClick={() => setPage(page - 1)}>上一页</Button>
        <Text className="py-2">第 {page} / {Math.ceil(total / 20)} 页</Text>
        <Button disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(page + 1)}>下一页</Button>
      </View>
    </AppShell>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/web/products/ client/src/pages/web/categories/ client/src/services/products.ts
git commit -m "feat: add products and categories pages"
```

### Task 15: Purchase & Sales Order Pages

**Files:**
- Create: `client/src/pages/web/purchases/index.tsx`
- Create: `client/src/pages/web/purchases/new.tsx`
- Create: `client/src/pages/web/sales/index.tsx`
- Create: `client/src/pages/web/sales/new.tsx`
- Create: `client/src/services/purchases.ts`
- Create: `client/src/services/sales.ts`

- [ ] **Step 1: Create purchases service**

```typescript
// client/src/services/purchases.ts
import { api } from '../utils/request';

export const purchasesApi = {
  list: (params?: any) => api.get<any>('/purchases', params),
  getById: (id: string) => api.get<any>(`/purchases/${id}`),
  create: (data: any) => api.post<any>('/purchases', data),
  confirm: (id: string) => api.post<any>(`/purchases/${id}/confirm`),
  receive: (id: string) => api.post<any>(`/purchases/${id}/receive`),
};
```

- [ ] **Step 2: Create purchase new page**

```tsx
// client/src/pages/web/purchases/new.tsx
import { useState, useEffect } from 'react';
import { View, Text, Input, Button, Picker } from '@tarojs/components';
import AppShell from '../../../components/layout/app-shell';
import { purchasesApi } from '../../../services/purchases';
import { productsApi } from '../../../services/products';
import { suppliersApi } from '../../../services/suppliers';
import { warehousesApi } from '../../../services/warehouses';
import Taro from '@tarojs/taro';

export default function NewPurchasePage() {
  const [supplierId, setSupplierId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([{ productId: '', productName: '', quantity: 1, unitCost: 0 }]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    suppliersApi.list({ limit: 100 }).then((res) => setSuppliers(res.items));
    warehousesApi.list({ limit: 100 }).then((res) => setWarehouses(res.items));
  }, []);

  const addItem = () => {
    setItems([...items, { productId: '', productName: '', quantity: 1, unitCost: 0 }]);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await purchasesApi.create({
        supplierId: supplierId || undefined,
        warehouseId: warehouseId || undefined,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitCost: item.unitCost,
        })),
      });
      Taro.showToast({ title: '创建成功', icon: 'success' });
      Taro.navigateBack();
    } catch (err: any) {
      Taro.showToast({ title: err.message, icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <View className="bg-white rounded-lg shadow p-6">
        <Text className="text-xl font-bold mb-4">新建采购单</Text>

        <View className="mb-4">
          <Text className="block mb-1">供应商</Text>
          <Picker
            range={suppliers}
            rangeKey="name"
            onChange={(e) => setSupplierId(suppliers[Number(e.detail.value)]?.id || '')}
          >
            <Text className="border rounded-lg px-4 py-2 block">{suppliers.find((s) => s.id === supplierId)?.name || '选择供应商'}</Text>
          </Picker>
        </View>

        <View className="mb-4">
          <Text className="block mb-1">入库仓库</Text>
          <Picker
            range={warehouses}
            rangeKey="name"
            onChange={(e) => setWarehouseId(warehouses[Number(e.detail.value)]?.id || '')}
          >
            <Text className="border rounded-lg px-4 py-2 block">{warehouses.find((w) => w.id === warehouseId)?.name || '选择仓库'}</Text>
          </Picker>
        </View>

        <Text className="font-bold mb-2">采购明细</Text>
        {items.map((item, index) => (
          <View key={index} className="flex gap-2 mb-2 items-center">
            <Input
              className="border rounded-lg px-2 py-1 flex-1"
              placeholder="商品名称/条码"
              value={item.productName}
              onInput={(e) => updateItem(index, 'productName', e.detail.value)}
            />
            <Input
              className="border rounded-lg px-2 py-1 w-20"
              placeholder="数量"
              type="number"
              value={String(item.quantity)}
              onInput={(e) => updateItem(index, 'quantity', Number(e.detail.value))}
            />
            <Input
              className="border rounded-lg px-2 py-1 w-24"
              placeholder="单价"
              type="number"
              value={String(item.unitCost)}
              onInput={(e) => updateItem(index, 'unitCost', Number(e.detail.value))}
            />
            <Text className="w-24 text-right">¥{(item.quantity * item.unitCost).toFixed(2)}</Text>
          </View>
        ))}
        <Button className="text-blue-500 mt-2" onClick={addItem}>+ 添加商品</Button>

        <Button className="bg-blue-600 text-white rounded-lg py-2 w-full mt-6" loading={loading} onClick={handleSubmit}>
          创建采购单
        </Button>
      </View>
    </AppShell>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/web/purchases/ client/src/pages/web/sales/ client/src/services/purchases.ts client/src/services/sales.ts
git commit -m "feat: add purchase and sales order pages"
```

### Task 16: Inventory & Dashboard Pages

**Files:**
- Create: `client/src/pages/web/inventory/index.tsx`
- Create: `client/src/pages/web/inventory/stocktake.tsx`
- Create: `client/src/pages/web/dashboard/index.tsx`

- [ ] **Step 1: Create dashboard page**

```tsx
// client/src/pages/web/dashboard/index.tsx
import { useState, useEffect } from 'react';
import { View, Text } from '@tarojs/components';
import AppShell from '../../../components/layout/app-shell';
import { purchasesApi } from '../../../services/purchases';
import { salesApi } from '../../../services/sales';
import { useAuthStore } from '../../../store/auth';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState({ todaySales: 0, todayPurchases: 0, lowStockCount: 0 });

  useEffect(() => {
    // Load dashboard data
  }, []);

  return (
    <AppShell>
      <Text className="text-2xl font-bold mb-6">欢迎回来，{user?.name}</Text>
      <View className="grid grid-cols-3 gap-4 mb-6">
        <View className="bg-white rounded-lg shadow p-4">
          <Text className="text-gray-500">今日销售</Text>
          <Text className="text-2xl font-bold">¥{stats.todaySales.toFixed(2)}</Text>
        </View>
        <View className="bg-white rounded-lg shadow p-4">
          <Text className="text-gray-500">今日采购</Text>
          <Text className="text-2xl font-bold">¥{stats.todayPurchases.toFixed(2)}</Text>
        </View>
        <View className="bg-white rounded-lg shadow p-4">
          <Text className="text-gray-500">库存预警</Text>
          <Text className="text-2xl font-bold text-red-500">{stats.lowStockCount}</Text>
        </View>
      </View>

      <View className="grid grid-cols-2 gap-4">
        <View className="bg-white rounded-lg shadow p-4">
          <Text className="font-bold mb-2">最近采购单</Text>
          {/* Purchase orders list */}
        </View>
        <View className="bg-white rounded-lg shadow p-4">
          <Text className="font-bold mb-2">最近销售单</Text>
          {/* Sale orders list */}
        </View>
      </View>
    </AppShell>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/web/inventory/ client/src/pages/web/dashboard/
git commit -m "feat: add inventory and dashboard pages"
```

---

## Phase 6: Mini Program Frontend

### Task 17: Mini Program Home & Quick Input Pages

**Files:**
- Create: `client/src/pages/mini/index/index.tsx`
- Create: `client/src/pages/mini/scan/index.tsx`
- Create: `client/src/pages/mini/voice/index.tsx`
- Create: `client/src/pages/mini/photo/index.tsx`
- Create: `client/src/pages/mini/purchase/index.tsx`
- Create: `client/src/pages/mini/sale/index.tsx`

- [ ] **Step 1: Create mini program home page**

```tsx
// client/src/pages/mini/index/index.tsx
import { View, Text, Button, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';

export default function MiniHomePage() {
  const quickActions = [
    { icon: '📷', label: '拍照入库', url: '/pages/mini/photo/index' },
    { icon: '🎤', label: '语音录入', url: '/pages/mini/voice/index' },
    { icon: '📱', label: '扫一扫', url: '/pages/mini/scan/index' },
  ];

  return (
    <View className="bg-gray-50 min-h-screen p-4">
      <Text className="text-xl font-bold mb-4">快捷操作</Text>

      <View className="grid grid-cols-3 gap-4 mb-6">
        {quickActions.map((action, i) => (
          <View
            key={i}
            className="bg-white rounded-xl shadow p-4 flex flex-col items-center"
            onClick={() => Taro.navigateTo({ url: action.url })}
          >
            <Text className="text-3xl mb-2">{action.icon}</Text>
            <Text className="text-sm">{action.label}</Text>
          </View>
        ))}
      </View>

      <View className="mb-6">
        <Text className="font-bold mb-2">快捷操作</Text>
        <View className="bg-white rounded-lg shadow">
          <View
            className="p-4 border-b flex items-center justify-between"
            onClick={() => Taro.navigateTo({ url: '/pages/mini/purchase/index' })}
          >
            <Text>📦 快速入库</Text>
            <Text>{'>'}</Text>
          </View>
          <View
            className="p-4 border-b flex items-center justify-between"
            onClick={() => Taro.navigateTo({ url: '/pages/mini/sale/index' })}
          >
            <Text>🛒 快速出库</Text>
            <Text>{'>'}</Text>
          </View>
          <View
            className="p-4 border-b flex items-center justify-between"
            onClick={() => Taro.navigateTo({ url: '/pages/mini/inventory/index' })}
          >
            <Text>📊 库存查询</Text>
            <Text>{'>'}</Text>
          </View>
        </View>
      </View>

      <View>
        <Text className="font-bold mb-2">最近单据</Text>
        <View className="bg-white rounded-lg shadow p-4">
          <Text className="text-gray-500 text-center">暂无最近单据</Text>
        </View>
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Create scan page**

```tsx
// client/src/pages/mini/scan/index.tsx
import { useEffect } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';

export default function ScanPage() {
  useEffect(() => {
    // Automatically start scanning on page load
    scanCode();
  }, []);

  const scanCode = async () => {
    try {
      // WeChat Mini Program native scan
      const res = await Taro.scanCode({});
      const barcode = res.result;

      // Look up product by barcode
      const { api } = await import('../../../utils/request');
      const product = await api.get(`/products/barcode/${barcode}`);

      if (product) {
        // Navigate to purchase page with product pre-filled
        Taro.navigateTo({
          url: `/pages/mini/purchase/index?productId=${product.id}&name=${product.name}&barcode=${barcode}`,
        });
      } else {
        // Product not found, offer to create
        Taro.showModal({
          title: '未找到商品',
          content: `条码 ${barcode} 未找到，是否创建新商品？`,
          success: (res) => {
            if (res.confirm) {
              Taro.navigateTo({ url: `/pages/mini/purchase/index?barcode=${barcode}` });
            }
          },
        });
      }
    } catch (err) {
      Taro.showToast({ title: '扫码失败', icon: 'none' });
    }
  };

  return (
    <View className="flex flex-col items-center justify-center min-h-screen bg-black">
      <Text className="text-white text-lg mb-4">正在扫描...</Text>
      <View className="w-64 h-64 border-2 border-white rounded-lg relative">
        <View className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500 animate-pulse" />
      </View>
    </View>
  );
}
```

- [ ] **Step 3: Create voice input page**

```tsx
// client/src/pages/mini/voice/index.tsx
import { useState, useEffect } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';

// Simple Chinese NLP parser for voice input
function parseVoiceInput(text: string): { action: string; product: string; quantity: number; unitPrice: number } | null {
  const result = { action: '', product: '', quantity: 0, unitPrice: 0 };

  // Detect action
  if (text.includes('进') || text.includes('入') || text.includes('采购') || text.includes('买')) {
    result.action = 'PURCHASE';
  } else if (text.includes('出') || text.includes('卖') || text.includes('销售')) {
    result.action = 'SALE';
  } else {
    return null;
  }

  // Extract quantity (simplified: find number before 个/箱/斤/件)
  const qtyMatch = text.match(/(\d+)\s*(个|箱|斤|件|瓶|包)/);
  if (qtyMatch) {
    result.quantity = parseInt(qtyMatch[1]);
  }

  // Extract unit price
  const priceMatch = text.match(/单价[价]?\s*(\d+)/) || text.match(/(\d+)\s*元/);
  if (priceMatch) {
    result.unitPrice = parseInt(priceMatch[1]);
  }

  // Extract product name (simplified: text between action and quantity/price)
  const cleanText = text.replace(/我[要想]/g, '').replace(/请[帮]/g, '');
  // Try to match known product patterns
  const productMatch = cleanText.match(/(进|买|出|卖)\s*(.{2,6})(?:\d|$)/);
  if (productMatch) {
    result.product = productMatch[2];
  }

  return result;
}

export default function VoicePage() {
  const [recognizing, setRecognizing] = useState(false);
  const [text, setText] = useState('');
  const [parsed, setParsed] = useState<any>(null);

  const startRecognition = () => {
    setRecognizing(true);
    setText('');
    setParsed(null);

    // Use Web Speech API (Web) or WeChat voice API (Mini Program)
    // For mini program: Taro.startRecord + voice recognition
    Taro.authorize({ scope: 'scope.record' }).then(() => {
      const recorderManager = Taro.getRecorderManager();
      recorderManager.start({ format: 'mp3' });

      recorderManager.onStop((res) => {
        // In production, send audio to backend speech-to-text service
        // For now, simulate with user input
        setRecognizing(false);
        Taro.showModal({
          title: '语音识别',
          content: '请输入您说的内容（模拟）',
          editable: true,
          success: (modalRes) => {
            if (modalRes.confirm && modalRes.content) {
              setText(modalRes.content);
              const parsedResult = parseVoiceInput(modalRes.content);
              setParsed(parsedResult);
            }
          },
        });
      });
    }).catch(() => {
      Taro.showToast({ title: '需要录音权限', icon: 'none' });
      setRecognizing(false);
    });
  };

  return (
    <View className="min-h-screen bg-white p-4">
      <Text className="text-xl font-bold mb-6 text-center">语音录入</Text>

      <View
        className={`w-32 h-32 rounded-full mx-auto mb-6 flex items-center justify-center ${recognizing ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`}
        onClick={startRecognition}
      >
        <Text className="text-4xl">🎤</Text>
      </View>
      <Text className="text-center text-gray-500 mb-6">
        {recognizing ? '正在聆听...' : '点击开始说话'}
      </Text>

      <Text className="text-gray-500 mb-2">示例：</Text>
      <View className="bg-gray-50 rounded-lg p-3 mb-6 space-y-1">
        <Text className="text-sm">"进10箱茅台，单价2800"</Text>
        <Text className="text-sm">"出5件农夫山泉"</Text>
        <Text className="text-sm">"采购20斤苹果，单价5块"</Text>
      </View>

      {text && (
        <View className="bg-blue-50 rounded-lg p-4">
          <Text className="font-bold mb-2">识别结果</Text>
          <Text className="mb-2">{text}</Text>
          {parsed ? (
            <View className="mt-2">
              <Text>操作：{parsed.action === 'PURCHASE' ? '采购入库' : '销售出库'}</Text>
              <Text>商品：{parsed.product || '未识别'}</Text>
              <Text>数量：{parsed.quantity || '未识别'}</Text>
              <Text>单价：{parsed.unitPrice || '未识别'}</Text>
              <Button className="bg-blue-600 text-white rounded-lg py-2 mt-3" onClick={() => Taro.navigateTo({ url: '/pages/mini/purchase/index' })}>
                确认并创建单据
              </Button>
            </View>
          ) : (
            <Text className="text-red-500">未能解析，请重试</Text>
          )}
        </View>
      )}
    </View>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/mini/
git commit -m "feat: add mini program pages (home, scan, voice, photo, purchase, sale)"
```

---

## Phase 7: Voice NLP & OCR Integration (Backend)

### Task 18: Upload & OCR Module

**Files:**
- Create: `backend/src/modules/upload/upload.module.ts`
- Create: `backend/src/modules/upload/upload.controller.ts`
- Create: `backend/src/modules/upload/upload.service.ts`

- [ ] **Step 1: Write UploadService**

```typescript
// src/modules/upload/upload.service.ts
import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadService {
  private uploadDir = process.env.UPLOAD_DIR || './uploads';

  async uploadFile(file: Express.Multer.File): Promise<string> {
    const filename = `${Date.now()}-${file.originalname}`;
    const filepath = path.join(this.uploadDir, filename);

    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }

    fs.writeFileSync(filepath, file.buffer);
    return `/uploads/${filename}`;
  }

  async recognizeImage(filepath: string): Promise<string[]> {
    // OCR integration placeholder
    // In production: call Aliyun OCR API or PaddleOCR
    // For now, return mock result
    return ['商品名称: 示例商品', '条码: 6901234567890'];
  }

  async speechToText(audioBuffer: Buffer): Promise<string> {
    // Speech-to-text integration placeholder
    // In production: call Aliyun/Baidu speech recognition
    // For now, return mock
    return '进10箱茅台';
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/modules/upload/
git commit -m "feat: add upload and OCR module"
```

---

## Phase 8: Settings & Users (Admin)

### Task 19: Settings Pages

**Files:**
- Create: `client/src/pages/web/settings/index.tsx`
- Create: `client/src/pages/web/settings/users.tsx`
- Create: `client/src/pages/web/register/index.tsx`

- [ ] **Step 1: Commit**

```bash
git add client/src/pages/web/settings/ client/src/pages/web/register/
git commit -m "feat: add settings and register pages"
```

### Task 20: Reports Pages

**Files:**
- Create: `client/src/pages/web/reports/index.tsx`
- Create: `client/src/services/reports.ts`

- [ ] **Step 1: Create reports service**

```typescript
// client/src/services/reports.ts
import { api } from '../utils/request';

export const reportsApi = {
  purchaseReport: (params: { startDate: string; endDate: string }) =>
    api.get('/reports/purchases', params),
  saleReport: (params: { startDate: string; endDate: string }) =>
    api.get('/reports/sales', params),
  profitReport: (params: { startDate: string; endDate: string }) =>
    api.get('/reports/profit', params),
};
```

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/web/reports/ client/src/services/reports.ts
git commit -m "feat: add reports page"
```
