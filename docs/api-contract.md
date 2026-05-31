# API Contract — 进销存系统后端

> 本文档为 H5 Web 端和微信小程序端共同依赖的后端 API 契约。
> 所有接口均以 `/api/` 为前缀，JWT 认证通过 `Authorization: Bearer <token>` 传递。

---

## 目录

1. [通用约定](#1-通用约定)
2. [数据模型](#2-数据模型)
3. [API 端点](#3-api-端点)
   - [3.1 认证](#31-认证)
   - [3.2 租户管理](#32-租户管理)
   - [3.3 用户管理](#33-用户管理)
   - [3.4 角色管理](#34-角色管理)
   - [3.5 分类](#35-分类)
   - [3.6 商品](#36-商品)
   - [3.7 供应商](#37-供应商)
   - [3.8 客户](#38-客户)
   - [3.9 仓库](#39-仓库)
   - [3.10 库存](#310-库存)
   - [3.11 采购](#311-采购)
   - [3.12 销售](#312-销售)
   - [3.13 盘点](#313-盘点)
   - [3.14 调拨](#314-调拨)
   - [3.15 报表](#315-报表)
   - [3.16 上传](#316-上传)

---

## 1. 通用约定

### 1.1 认证方式

- **JWT** 通过 `Authorization: Bearer <token>` 传递
- 登录/注册接口不需要认证，其余接口均需要
- JWT Payload: `{ sub: userId, email, tenantId, role }`
- `request.user` 注入对象: `{ id, email, tenantId, role }`

### 1.2 统一响应格式

```typescript
// 成功
{ "id": "uuid", "name": "..." }

// 列表（带分页）
{ "data": [...], "total": 100, "page": 1, "limit": 20 }

// 错误
{ "message": "错误描述", "error": "...", "statusCode": 4xx }
```

### 1.3 多租户隔离

- 所有数据表都有 `tenantId` 字段
- 后端通过 `@TenantId()` 装饰器从 JWT 中提取 tenantId
- 前端无需显式传递 tenantId

### 1.4 分页参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `page` | number | 1 | 页码 |
| `limit` | number | 20 | 每页条数 |

### 1.5 软删除

商品/分类/供应商/客户/仓库使用 `enabled: false` 表示禁用，不物理删除。

### 1.6 状态机模式

采购、销售、盘点、调拨均使用状态机流转：

| 模块 | 状态流转 |
|------|---------|
| 采购 | `DRAFT → CONFIRMED → RECEIVED` (可作废: DRAFT/CONFIRMED → CANCELLED) |
| 销售 | `DRAFT → CONFIRMED → DELIVERED` (可作废: DRAFT/CONFIRMED → CANCELLED) |
| 盘点 | `DRAFT → IN_PROGRESS → COMPLETED` (可作废: DRAFT/IN_PROGRESS → CANCELLED) |
| 调拨 | `DRAFT → CONFIRMED → COMPLETED` (可作废: DRAFT/CONFIRMED → CANCELLED) |

---

## 2. 数据模型

### 2.1 Tenant（租户）

```prisma
model Tenant {
  id        String   @uuid
  name      String   @VarChar(200)
  slug      String   @VarChar(100) @unique
  logo      String?  @VarChar(500)
  enabled   Boolean  @default(true)
  createdAt DateTime
  updatedAt DateTime
}
```

### 2.2 User（用户）

```prisma
model User {
  id           String   @uuid
  tenantId     String   @uuid
  email        String   @VarChar(200)
  passwordHash String   @VarChar(200)
  name         String   @VarChar(100)
  phone        String?  @VarChar(20)
  roleId       String?  @uuid
  enabled      Boolean  @default(true)
  createdAt    DateTime
  updatedAt    DateTime

  @@unique([tenantId, email]) // 同一租户下邮箱唯一
}
```

### 2.3 Role（角色）

```prisma
model Role {
  id          String   @uuid
  tenantId    String   @uuid
  name        String   @VarChar(100)
  permissions Json     @default("[]")  // string[]
  createdAt   DateTime
  updatedAt   DateTime

  @@unique([tenantId, name]) // 同一租户下角色名唯一
}
```

### 2.4 Category（分类，树形结构）

```prisma
model Category {
  id        String   @uuid
  tenantId  String   @uuid
  name      String   @VarChar(200)
  parentId  String?  @uuid  // 自引用父分类
  sortOrder Int      @default(0)

  @@unique([tenantId, name])
}
```

### 2.5 Product（商品）

```prisma
model Product {
  id         String   @uuid
  tenantId   String   @uuid
  categoryId String?  @uuid
  name       String   @VarChar(200)
  barcode    String?  @VarChar(100)
  sku        String?  @VarChar(100)
  unit       String   @default("个") @VarChar(20)
  salePrice  Decimal  @default(0) @Decimal(10,2)
  costPrice  Decimal  @default(0) @Decimal(10,2)
  imageUrl   String?  @VarChar(500)
  specs      Json?    @default("{}")
  enabled    Boolean  @default(true)

  @@unique([tenantId, barcode])
  @@unique([tenantId, sku])
}
```

### 2.6 Warehouse（仓库）

```prisma
model Warehouse {
  id        String   @uuid
  tenantId  String   @uuid
  name      String   @VarChar(200)
  address   String?  @Text
  enabled   Boolean  @default(true)

  @@unique([tenantId, name])
}
```

### 2.7 Supplier（供应商）

```prisma
model Supplier {
  id        String   @uuid
  tenantId  String   @uuid
  name      String   @VarChar(200)
  phone     String?  @VarChar(20)
  contact   String?  @VarChar(100)
  address   String?  @Text
  enabled   Boolean  @default(true)

  @@unique([tenantId, name])
}
```

### 2.8 Customer（客户）

```prisma
model Customer {
  id        String   @uuid
  tenantId  String   @uuid
  name      String   @VarChar(200)
  phone     String?  @VarChar(20)
  address   String?  @Text
  enabled   Boolean  @default(true)

  @@unique([tenantId, name])
}
```

### 2.9 Inventory（库存快照）

```prisma
model Inventory {
  id          String   @uuid
  tenantId    String   @uuid
  productId   String   @uuid
  warehouseId String   @uuid
  quantity    Decimal  @Decimal(12,2)
  unitCost    Decimal  @Decimal(10,2)
  updatedAt   DateTime

  @@unique([tenantId, productId, warehouseId]) // 每仓库每商品一条
}
```

### 2.10 InventoryLog（库存变动记录）

```prisma
model InventoryLog {
  id          String   @uuid
  tenantId    String   @uuid
  productId   String   @uuid
  warehouseId String?  @uuid
  type        String   @VarChar(20)
  quantity    Decimal  @Decimal(12,2)
  beforeQty   Decimal  @Decimal(12,2)
  afterQty    Decimal  @Decimal(12,2)
  refId       String?  @VarChar(100)
  refType     String?  @VarChar(50)
  remark      String?  @Text
  createdAt   DateTime
}
```

type 取值: `PURCHASE_IN | SALE_OUT | TRANSFER_OUT | TRANSFER_IN | STOCKTAKE_ADJUST`

### 2.11 PurchaseOrder（采购单）

```prisma
model PurchaseOrder {
  id           String         @uuid
  tenantId     String         @uuid
  orderNo      String         @VarChar(50)
  supplierId   String?        @uuid
  warehouseId  String?        @uuid
  totalAmount  Decimal        @Decimal(12,2)
  status       PurchaseStatus // DRAFT | CONFIRMED | RECEIVED | CANCELLED
  remark       String?        @Text
  createdBy    String         @uuid
  createdAt    DateTime
  updatedAt    DateTime
}

model PurchaseItem {
  id              String  @uuid
  purchaseOrderId String  @uuid
  productId       String  @uuid
  quantity        Decimal @Decimal(12,2)
  unitCost        Decimal @Decimal(10,2)
  subtotal        Decimal @Decimal(12,2)
}
```

### 2.12 SaleOrder（销售单）

```prisma
model SaleOrder {
  id           String     @uuid
  tenantId     String     @uuid
  orderNo      String     @VarChar(50)
  customerId   String?    @uuid
  warehouseId  String?    @uuid
  totalAmount  Decimal    @Decimal(12,2)
  status       SaleStatus // DRAFT | CONFIRMED | DELIVERED | CANCELLED
  remark       String?    @Text
  createdBy    String     @uuid
  createdAt    DateTime
  updatedAt    DateTime
}

model SaleItem {
  id          String  @uuid
  saleOrderId String  @uuid
  productId   String  @uuid
  quantity    Decimal @Decimal(12,2)
  unitPrice   Decimal @Decimal(10,2)
  unitCost    Decimal @Decimal(10,2) @default(0)
  subtotal    Decimal @Decimal(12,2)
}
```

### 2.13 Stocktake（盘点单）

```prisma
model Stocktake {
  id          String          @uuid
  tenantId    String          @uuid
  warehouseId String          @uuid
  status      StocktakeStatus // DRAFT | IN_PROGRESS | COMPLETED | CANCELLED
  remark      String?         @Text
  createdBy   String          @uuid
  createdAt   DateTime
  updatedAt   DateTime
}

model StocktakeItem {
  id             String  @uuid
  stocktakeId    String  @uuid
  productId      String  @uuid
  bookQuantity   Decimal @Decimal(12,2)  // 账面数量
  actualQuantity Decimal @Decimal(12,2)  // 实际数量
  diffQuantity   Decimal @Decimal(12,2)  // 差异
}
```

### 2.14 Transfer（调拨单）

```prisma
model Transfer {
  id              String         @uuid
  tenantId        String         @uuid
  fromWarehouseId String         @uuid
  toWarehouseId   String         @uuid
  status          TransferStatus // DRAFT | CONFIRMED | COMPLETED | CANCELLED
  remark          String?        @Text
  createdBy       String         @uuid
  createdAt       DateTime
  updatedAt       DateTime
}

model TransferItem {
  id         String  @uuid
  transferId String  @uuid
  productId  String  @uuid
  quantity   Decimal @Decimal(12,2)
}
```

---

## 3. API 端点

### 3.1 认证

#### `POST /api/auth/login`

用户登录。不需要 JWT。

```json
// Request
{ "email": "admin@example.com", "password": "password123" }

// Response 200
{
  "accessToken": "eyJhbGciOi...",
  "user": {
    "id": "uuid",
    "name": "张三",
    "email": "admin@example.com",
    "tenantId": "uuid",
    "tenantName": "我的店铺",
    "role": "admin"
  }
}
```

#### `POST /api/auth/register`

注册新租户 + 管理员。不需要 JWT。

```json
// Request
{
  "tenantName": "我的店铺",
  "tenantSlug": "my-store",
  "email": "admin@example.com",
  "name": "张三",
  "password": "password123"
}

// Response 201
{
  "accessToken": "eyJhbGciOi...",
  "user": {
    "id": "uuid",
    "name": "张三",
    "email": "admin@example.com",
    "tenantId": "uuid",
    "tenantName": "我的店铺",
    "role": "admin"
  }
}
```

---

### 3.2 租户管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/tenants` | 获取当前租户信息 |
| PATCH | `/api/tenants` | 更新租户信息 `{ name?, logo? }` |
| GET | `/api/tenants/admin/all` | 管理员：所有租户列表（search/page/limit） |
| POST | `/api/tenants/admin` | 管理员：创建租户 `{ name, slug, logo? }` |
| DELETE | `/api/tenants/admin/:id` | 管理员：禁用租户 |

---

### 3.3 用户管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/users` | 用户列表（search/page/limit） |
| GET | `/api/users/:id` | 用户详情 |
| POST | `/api/users` | 创建用户 `{ email, password, name, phone?, roleId? }` |
| PATCH | `/api/users/:id` | 更新用户 `{ name?, email?, phone?, roleId?, enabled? }` |
| DELETE | `/api/users/:id` | 禁用用户 |
| POST | `/api/users/:id/role` | 分配角色 `{ roleId }` |

---

### 3.4 角色管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/roles` | 所有角色 |
| GET | `/api/roles/:id` | 角色详情 |
| POST | `/api/roles` | 创建角色 `{ name, permissions? }` |
| PATCH | `/api/roles/:id` | 更新角色 `{ name?, permissions? }` |
| DELETE | `/api/roles/:id` | 删除角色 |

---

### 3.5 分类

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/categories` | 分类列表（树形） |
| POST | `/api/categories` | 创建 `{ name, description? }` |
| PATCH | `/api/categories/:id` | 更新 `{ name?, description? }` |
| DELETE | `/api/categories/:id` | 删除 |

---

### 3.6 商品

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/products` | 列表（search/categoryId/page/limit） |
| GET | `/api/products/barcode/:barcode` | 按条码查询 |
| GET | `/api/products/:id` | 详情 |
| POST | `/api/products` | 创建 `{ name, categoryId?, barcode?, sku?, unit?, salePrice?, costPrice? }` |
| PATCH | `/api/products/:id` | 更新（Partial） |
| DELETE | `/api/products/:id` | 删除 |

---

### 3.7 供应商

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/suppliers` | 列表（search/page/limit），默认按往来金额降序 |
| GET | `/api/suppliers/:id` | 详情 |
| POST | `/api/suppliers` | 创建 `{ name, contact?, phone?, email?, address? }` |
| PATCH | `/api/suppliers/:id` | 更新（Partial） |
| DELETE | `/api/suppliers/:id` | 删除 |

**列表返回值**：每个 item 增加 `totalAmount: number`（总采购金额，排除已作废单据）

---

### 3.8 客户

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/customers` | 列表（search/page/limit），默认按往来金额降序 |
| GET | `/api/customers/:id` | 详情 |
| POST | `/api/customers` | 创建 `{ name, phone?, address? }` |
| PATCH | `/api/customers/:id` | 更新（Partial） |
| DELETE | `/api/customers/:id` | 删除 |

**列表返回值**：每个 item 增加 `totalAmount: number`（总销售金额，排除已作废单据）

---

### 3.9 仓库

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/warehouses` | 列表（search/page/limit） |
| GET | `/api/warehouses/:id` | 详情 |
| POST | `/api/warehouses` | 创建 `{ name, address? }` |
| PATCH | `/api/warehouses/:id` | 更新（Partial） |
| DELETE | `/api/warehouses/:id` | 删除 |

---

### 3.10 库存

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/inventory` | 库存列表（productId/warehouseId/page/limit） |
| GET | `/api/inventory/alerts?threshold=10` | 库存预警 |
| GET | `/api/inventory/logs` | 变动记录（productId/warehouseId/type/page/limit） |
| GET | `/api/inventory/history?date=2026-05-01` | 历史库存快照 |

---

### 3.11 采购

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/purchases` | 列表（status/supplierId/dateFrom/dateTo/page/limit） |
| GET | `/api/purchases/:id` | 详情（含 items） |
| POST | `/api/purchases` | 创建 `{ supplierId?, warehouseId?, remark?, items: [{productId, quantity, unitCost}] }` |
| POST | `/api/purchases/:id/confirm` | 确认（DRAFT→CONFIRMED） |
| POST | `/api/purchases/:id/receive` | 入库（CONFIRMED→RECEIVED，增加库存） |
| POST | `/api/purchases/:id/cancel` | 作废 |

---

### 3.12 销售

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/sales` | 列表（status/customerId/dateFrom/dateTo/page/limit） |
| GET | `/api/sales/:id` | 详情（含 items） |
| POST | `/api/sales` | 创建 `{ customerId?, warehouseId?, remark?, items: [{productId, quantity, unitPrice}] }` |
| POST | `/api/sales/:id/confirm` | 确认（DRAFT→CONFIRMED） |
| POST | `/api/sales/:id/deliver` | 出库（CONFIRMED→DELIVERED，扣减库存） |
| POST | `/api/sales/:id/cancel` | 作废 |

---

### 3.13 盘点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/stocktakes` | 列表（status/warehouseId/page/limit） |
| GET | `/api/stocktakes/:id` | 详情（含 items） |
| POST | `/api/stocktakes` | 创建 `{ warehouseId, remark? }`（自动生成 items） |
| POST | `/api/stocktakes/:id/start` | 开始（DRAFT→IN_PROGRESS） |
| POST | `/api/stocktakes/:id/complete` | 完成（IN_PROGRESS→COMPLETED，调整库存） |
| POST | `/api/stocktakes/:id/cancel` | 作废 |

---

### 3.14 调拨

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/transfers` | 列表（status/dateFrom/dateTo/page/limit） |
| GET | `/api/transfers/:id` | 详情（含 items） |
| POST | `/api/transfers` | 创建 `{ fromWarehouseId, toWarehouseId, remark?, items: [{productId, quantity}] }` |
| POST | `/api/transfers/:id/confirm` | 确认（DRAFT→CONFIRMED） |
| POST | `/api/transfers/:id/complete` | 完成（CONFIRMED→COMPLETED，源仓扣减+目标仓增加） |
| POST | `/api/transfers/:id/cancel` | 作废 |

---

### 3.15 报表

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/reports/purchases?startDate=&endDate=` | 采购报表 |
| GET | `/api/reports/sales?startDate=&endDate=` | 销售报表 |
| GET | `/api/reports/profit?startDate=&endDate=` | 利润报表 |
| GET | `/api/reports/dashboard` | Dashboard 汇总 |
| GET | `/api/reports/inventory-value` | 库存价值 |

---

### 3.16 上传

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/upload/image` | 上传图片 → `{ url, text }`（OCR） |
| POST | `/api/upload/audio` | 上传音频 → `{ text }`（语音识别） |

- Content-Type: `multipart/form-data`, 字段名: `file`
- 图片: `jpeg/png/gif/webp`, 音频: `mp3/wav/ogg/m4a`
- 大小限制: 10MB

---

## 4. 业务流时序

### 4.1 采购入库
```
创建(DRAFT) → 入库(RECEIVED) → 库存增加
```

### 4.2 销售出库
```
创建(DRAFT)  → 出库(DELIVERED) → 库存扣减
```

### 4.3 仓库调拨
```
创建(DRAFT)  → 完成(COMPLETED) → 源仓扣减 + 目标仓增加
```

### 4.4 盘点
```
创建(DRAFT) → 开始(IN_PROGRESS) → 完成(COMPLETED) → 库存差异调整
```

### 4.5 库存变动 type 枚举
```
PURCHASE_IN | SALE_OUT | TRANSFER_OUT | TRANSFER_IN | STOCKTAKE_ADJUST
```

---

## 5. 前后端页面划分

### 5.1 H5 管理端 Web

| 页面 | 依赖 API | 说明 |
|------|----------|------|
| 登录 | auth | 登录页 |
| Dashboard | reports | 仪表盘 + KPI |
| 商品管理 | products, categories | 商品 CRUD + 分类 |
| 采购管理 | purchases, suppliers | 采购单管理 |
| 销售管理 | sales, customers | 销售单管理 |
| 库存管理 | inventory | 库存查询/预警/日志 |
| 仓库管理 | warehouses | 仓库 CRUD |
| 盘点管理 | stocktake | 盘点单管理 |
| 调拨管理 | transfers | 调拨单管理 |
| 报表 | reports | 采购/销售/利润报表 |
| 系统设置 | tenants, users, roles | 租户/用户/角色 |

### 5.2 微信小程序

| 页面 | 依赖 API | 说明 |
|------|----------|------|
| 首页 | reports/dashboard | 汇总 + 快捷入口 |
| 扫码查商品 | products/barcode | 扫码 |
| 拍照识别 | upload/image | OCR |
| 语音录入 | upload/audio | 语音转文字 |
| 快速采购 | purchases | 采购录入 |
| 快速销售 | sales | 销售录入 |
| 订单列表 | purchases, sales | 查看单据 |
| 库存查询 | inventory | 查库存 |
| 商品查询 | products | 查商品 |
