# In&Out 进销存管理系统 --- 开发者文档

> 面向程序员与 AI Agent 的完整技术参考。
> 版本: 基于实际代码生成的精确参考

---

## 目录

1. [项目概览](#1-项目概览)
2. [数据库 Schema (Prisma)](#2-数据库-schema-prisma)
3. [后端 API 架构 (NestJS)](#3-后端-api-架构-nestjs)
4. [路由清单 (全量)](#4-路由清单-全量)
5. [前端架构 (Taro + React)](#5-前端架构-taro--react)
6. [认证与授权流程](#6-认证与授权流程)
7. [状态机业务逻辑](#7-状态机业务逻辑)
8. [常见查询模式](#8-常见查询模式)
9. [扩展指南](#9-扩展指南)
10. [开发命令](#10-开发命令)

## 1. 项目概览

**进销存管理系统** --- 多租户库存管理系统。两个前端(H5 + 微信小程序)共享一个 NestJS API。

| 属性 | 值 |
|-------|-------|
| 架构 | Monorepo：backend/ + client/ |
| 前端框架 | Taro 4 + React 18 + TypeScript |
| 样式 | Less |
| 后端框架 | NestJS 11 + TypeScript |
| ORM | Prisma 7 + PostgreSQL (PrismaPg) |
| 认证 | JWT (passport-jwt) |
| 前端状态 | Zustand 4 |
| 数据库 | PostgreSQL localhost:5432, inout_dev |
| 种子账号 | admin@demo.com / admin123 |

## 2. 数据库 Schema (Prisma)

16 个 Model + 4 个 Enum，所有 SQL 表名使用 snake_case（@@map 映射）。
每个业务表都有 tenantId，实现多租户隔离。

### 2.1 枚举类型

| 枚举名 | 值 | 用途 |
|--------|-----|------|
| PurchaseStatus | DRAFT / CONFIRMED / RECEIVED / CANCELLED | 采购单 |
| SaleStatus | DRAFT / CONFIRMED / DELIVERED / CANCELLED | 销售单 |
| StocktakeStatus | DRAFT / IN_PROGRESS / COMPLETED / CANCELLED | 盘点单 |
| TransferStatus | DRAFT / CONFIRMED / COMPLETED / CANCELLED | 调拨单 |

### 2.2 关键设计约定

- 所有业务表都有 tenantId (UUID FK -> tenants)
- 软删除: enabled: Boolean (default true)，不物理删除
- @@unique 约束都带 tenantId
- Product.specs 为 JSON 字段，存规格参数扩展属性
- Category.parent_id 自引用，实现树形分类
- User.role_id -> Role，Role.permissions 存权限名称数组
- @@unique([tenantId, productId, warehouseId]) 保证每商品每仓库一条库存

### 2.3 基础数据表

表名 | 关键字段 | 唯一/索引 | 软删除
-----|----------|-----------|--------
tenants | id(UUID), name, slug, enabled | slug Unique | enabled
users | id, tenant_id, email, password_hash, name, role_id | @@unique([tenantId, email]) | enabled
roles | id, tenant_id, name, permissions(JSON) | @@unique([tenantId, name]) | -
categories | id, tenant_id, name, parent_id, sort_order | @@unique([tenantId, name]) | -
products | id, tenant_id, category_id, name, barcode, sku, unit, sale_price(Decimal), cost_price(Decimal), specs(JSON) | @@unique([tenantId, barcode]), @@unique([tenantId, sku]), @@index([tenantId, name]) | enabled
warehouses | id, tenant_id, name, address | @@unique([tenantId, name]) | enabled
suppliers | id, tenant_id, name, phone, contact, address | @@unique([tenantId, name]) | enabled
customers | id, tenant_id, name, phone, address | @@unique([tenantId, name]) | enabled

### 2.4 库存表

**Inventory (inventory)**: quantity(Decimal), unit_cost(Decimal). @@unique([tenantId, productId, warehouseId])

**InventoryLog (inventory_logs)**: type(PURCHASE_IN/SALE_OUT/STOCKTAKE_ADJUST/TRANSFER_IN/TRANSFER_OUT), quantity变动量, before_qty, after_qty, ref_id, ref_type。@@index([tenantId, productId]), @@index([tenantId, createdAt])

### 2.5 单据表

**PurchaseOrder**: order_no(PO{YYYYMMDD}-{NNN}), supplier_id?, warehouse_id?, total_amount, status(PurchaseStatus), created_by
**PurchaseItem**: purchase_order_id(FK Cascade), product_id, quantity, unit_cost, subtotal, received_qty(分批入库)

**SaleOrder**: order_no(SO{...}), customer_id?, warehouse_id?, total_amount, status(SaleStatus), created_by
**SaleItem**: sale_order_id(FK Cascade), product_id, quantity, unit_price(售价), unit_cost(成本), subtotal, delivered_qty(分批出库)

**Stocktake**: warehouse_id, status(StocktakeStatus), created_by
**StocktakeItem**: stocktake_id(FK Cascade), product_id, book_qty, actual_qty, diff_qty

**Transfer**: from_warehouse_id, to_warehouse_id(双FK), status(TransferStatus), created_by
**TransferItem**: transfer_id(FK Cascade), product_id, quantity

### 2.6 关系图谱

```
Tenant --1:N--> User, Role, Product, Category, Warehouse, Supplier, Customer
Tenant --1:N--> Inventory, InventoryLog
Tenant --1:N--> PurchaseOrder(+Item), SaleOrder(+Item), Stocktake(+Item), Transfer(+Item)

Product --1:N--> Inventory, InventoryLog, PurchaseItem, SaleItem, StocktakeItem, TransferItem
Product --N:1--> Category

Warehouse --1:N--> Inventory, PurchaseOrder, SaleOrder, Stocktake
Warehouse --from/to--> Transfer

PurchaseOrder --1:N(Cascade)--> PurchaseItem
SaleOrder --1:N(Cascade)--> SaleItem
Stocktake --1:N(Cascade)--> StocktakeItem
Transfer --1:N(Cascade)--> TransferItem
```

## 3. 后端 API 架构 (NestJS)

### 3.1 16 个模块

模块 | 文件结构 | 说明
-----|----------|------
auth | controller, service, module, jwt.strategy | 登录/注册, JWT 签发
products | ctrl + service + module + dto/(create,update,query) | 商品 CRUD, 条码搜索
categories | ctrl + service + module + dto | 分类 CRUD
suppliers | ctrl + service + module + dto | 供应商 CRUD
customers | ctrl + service + module + dto | 客户 CRUD
warehouses | ctrl + service + module + dto | 仓库 CRUD
purchases | ctrl + service + module + dto/(create,update) | 采购单 CRUD + 状态变更 + 入库
sales | ctrl + service + module + dto | 销售单 CRUD + 状态变更 + 出库
inventory | ctrl + service + module | 库存查询 + 低库存预警
stocktake | ctrl + service + module + dto | 盘点 CRUD + 状态变更
transfers | ctrl + service + module + dto | 调拨 CRUD + 状态变更
reports | ctrl + service + module | 采购/销售/利润报表
upload | ctrl + service + module | 文件上传(图片/音频)
tenants | ctrl + service + module + dto | 租户 CRUD
users | ctrl + service + module + dto | 用户 CRUD
roles | ctrl + service + module + dto | 角色 CRUD

### 3.2 Controller 通用模式

```typescript
@ApiTags(模块名)
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller(api/products)
export class ProductsController {
  constructor(private service: ProductsService) {}

  @Get()
  async findAll(@TenantId() tenantId: string, @Query() query: QueryDto) {
    return this.service.findAll(tenantId, query);
  }
  @Get(:id)
  async findById(@TenantId() tenantId: string, @Param(id) id: string) {
    return this.service.findById(tenantId, id);
  }
  @Post()
  async create(@TenantId() tenantId: string, @Body() dto: CreateDto) {
    return this.service.create(tenantId, dto);
  }
  @Patch(:id)
  async update(@TenantId() tenantId: string, @Param(id) id: string, @Body() dto: UpdateDto) {
    return this.service.update(tenantId, id, dto);
  }
  @Delete(:id)
  async remove(@TenantId() tenantId: string, @Param(id) id: string) {
    return this.service.remove(tenantId, id);
  }
}
```

路由命名规则:
- 列表: GET /api/products?page=1&limit=20&search=xxx
- 详情: GET /api/products/:id
- 创建: POST /api/products
- 更新: PATCH /api/products/:id (商品类) / PUT /api/purchases/:id (单据类)
- 删除: DELETE /api/products/:id (软删除)
- 状态变更: POST /api/purchases/:id/confirm
- 特殊搜索: GET /api/products/barcode/:barcode

### 3.3 Service 模式与关键架构约定

**1) TOCTOU 防护**: 所有更新使用 updateMany 而非 update，where 同时检查 id + tenantId，通过 result.count === 0 判断。

```typescript
const result = await this.prisma.product.updateMany({
  where: { id, tenantId },  // 原子性检查归属
  data: { name, price },
});
if (result.count === 0) throw new NotFoundException(商品不存在);
```

**2) @TenantId() 装饰器**: 从 JWT payload 提取 tenantId，自动注入 controller 方法参数。

**3) 全局 RolesGuard (APP_GUARD)**:
- admin 角色绕过所有权限检查
- 支持通配符: products.* 匹配 products.read/products.write
- 权限名通过 @Permissions() 装饰器标注在方法上

**4) Prisma 事务**: 涉及库存变动的操作(入库/出库/盘点调整)使用 $transaction 包裹。
事务内每个 updateMany 都检查 result.count，失败时 throw 触发回滚。

**5) 软删除**: 基础数据表用 enabled: false。单据表用 CANCELLED 状态。

**6) 单据自动编号**:
```typescript
// 采购单: PO{YYYYMMDD}-{NNN}
const prefix = `PO${dateStr}-`;
const count = await this.prisma.purchaseOrder.count({
  where: { tenantId, createdAt: { gte: todayStart } },
});
return `${prefix}${String(count + 1).padStart(3, 0)}`;
```

## 4. 路由清单 (全量)

模块 | 方法 | 路径 | 说明
------|------|------|------
Auth | POST | /api/auth/login | 登录 -> { accessToken, user }
 | POST | /api/auth/register | 注册
Products | GET | /api/products | 分页列表(?search, ?categoryId, ?page, ?limit)
 | GET | /api/products/:id | 详情(含 category)
 | GET | /api/products/barcode/:barcode | 按条码查找
 | POST | /api/products | 创建
 | PATCH | /api/products/:id | 更新
 | DELETE | /api/products/:id | 软删除(enabled=false)
Categories | GET | /api/categories | 列表
 | POST | /api/categories | 创建
 | PATCH | /api/categories/:id | 更新
 | DELETE | /api/categories/:id | 软删除
Suppliers | GET | /api/suppliers | 列表
 | POST | /api/suppliers | 创建
 | PATCH | /api/suppliers/:id | 更新
 | DELETE | /api/suppliers/:id | 软删除
Customers | GET | /api/customers | 列表
 | POST | /api/customers | 创建
 | PATCH | /api/customers/:id | 更新
 | DELETE | /api/customers/:id | 软删除
Warehouses | GET | /api/warehouses | 列表
 | POST | /api/warehouses | 创建
 | PATCH | /api/warehouses/:id | 更新
 | DELETE | /api/warehouses/:id | 软删除
Purchases | GET | /api/purchases | 分页列表(?status, ?warehouseId, ?productId, ?startDate, ?endDate)
 | GET | /api/purchases/:id | 详情(含 supplier, warehouse, items.product)
 | POST | /api/purchases | 创建(含 items 数组)
 | PUT | /api/purchases/:id | 编辑(仅 DRAFT/CONFIRMED 状态)
 | POST | /api/purchases/:id/confirm | DRAFT -> CONFIRMED
 | POST | /api/purchases/:id/receive | 整单入库, 更新库存
 | POST | /api/purchases/:id/receive-item | 单行分批入库
 | POST | /api/purchases/:id/cancel | 取消(已收货不可取消)
Sales | GET | /api/sales | 分页列表
 | GET | /api/sales/:id | 详情
 | POST | /api/sales | 创建
 | PUT | /api/sales/:id | 编辑
 | POST | /api/sales/:id/confirm | DRAFT -> CONFIRMED
 | POST | /api/sales/:id/deliver | CONFIRMED -> DELIVERED
 | POST | /api/sales/:id/cancel | 取消
Inventory | GET | /api/inventory | 列表(?productId, ?warehouseId, ?lowStock)
 | GET | /api/inventory/logs | 库存变动日志
Stocktake | GET | /api/stocktake | 列表
 | GET | /api/stocktake/:id | 详情(含 items)
 | POST | /api/stocktake | 创建
 | POST | /api/stocktake/:id/start | DRAFT -> IN_PROGRESS
 | POST | /api/stocktake/:id/complete | 提交盘点结果, 调整库存
 | POST | /api/stocktake/:id/cancel | 取消
Transfers | GET | /api/transfers | 列表
 | GET | /api/transfers/:id | 详情
 | POST | /api/transfers | 创建
 | POST | /api/transfers/:id/confirm | DRAFT -> CONFIRMED
 | POST | /api/transfers/:id/complete | 完成调拨, 调整两仓库存
 | POST | /api/transfers/:id/cancel | 取消
Reports | GET | /api/reports/purchase-summary | 采购汇总
 | GET | /api/reports/sale-summary | 销售汇总
 | GET | /api/reports/profit | 利润报表
Upload | POST | /api/upload | 上传(图片jpeg/png/gif/webp, 音频mpeg/wav/ogg/mp4)
Tenants | CRUD | /api/tenants | 租户管理
Users | CRUD | /api/users | 用户管理
Roles | CRUD | /api/roles | 角色管理

## 5. 前端架构 (Taro + React)

### 5.1 双端架构

同一个 Taro 项目编译出 H5 + 微信小程序。运行时通过 process.env.TARO_ENV 区分: weapp / h5。

维度 | H5 管理后台 | 微信小程序
------|------------|------------
路由数 | 21 pages | 16 pages
布局 | AppShell (Sidebar + Topbar) | 底部 TabBar (5 tabs)
页面目录 | pages/web/ | pages/mini/
app.config | 注册所有 web + mini | 仅注册 mini + TabBar 配置

### 5.2 H5 页面清单 (21 pages)

路径 | 说明
-----|------
pages/web/login/index | 登录
pages/web/dashboard/index | 仪表盘(快捷操作+KPI+最近订单)
pages/web/products/index | 商品列表
pages/web/products/new | 新增/编辑商品
pages/web/categories/index | 分类管理
pages/web/suppliers/index | 供应商管理
pages/web/customers/index | 客户管理
pages/web/warehouses/index | 仓库管理
pages/web/purchases/index | 采购单列表
pages/web/purchases/new | 新增/编辑采购单
pages/web/sales/index | 销售单列表
pages/web/sales/new | 新增/编辑销售单
pages/web/inventory/index | 库存查询
pages/web/stocktake/index | 盘点管理
pages/web/transfers/index | 调拨管理
pages/web/reports/index | 报表
pages/web/settings/index | 设置
pages/web/register/index | 注册
pages/web/users/index | 用户管理
pages/web/roles/index | 角色管理
pages/web/tenants/index | 租户管理

### 5.3 Mini 页面清单 (16 pages)

路径 | TabBar | 说明
-----|--------|------
pages/mini/index/index | 首页 | 仓库看板
pages/mini/purchase-list/index | 采购 | 采购单列表
pages/mini/sale-list/index | 销售 | 销售单列表
pages/mini/inventory/index | 库存 | 库存查看
pages/mini/more/index | 更多 | 更多功能入口
pages/mini/scan/index | - | 扫码查商品
pages/mini/voice/index | - | 语音搜索
pages/mini/photo/index | - | 拍照识别
pages/mini/purchase/index | - | 快速采购
pages/mini/sale/index | - | 快速销售
pages/mini/orders/list | - | 订单列表
pages/mini/orders/detail | - | 订单详情
pages/mini/products/index | - | 商品浏览
pages/mini/transfers/index | - | 调拨
pages/mini/stocktake/index | - | 盘点
pages/mini/login/index | - | 微信登录

### 5.4 H5 布局系统 (AppShell)

```tsx
<View className=layout>
  <Sidebar>    // 72px, 默认收起, hover展开
    <Logo />   // 进字logo
    <NavItem char=商 label=商品 path=/products />
    <NavItem char=采 label=采购 path=/purchases />
    // 共15个导航项
  </Sidebar>
  <MainArea>
    <Topbar>   // 页面标题 + 用户头像
    <Content>{children}</Content>
  </MainArea>
</View>
```

响应式: 视口 < 960px 时 Sidebar 变为底部导航栏, Topbar 隐藏。

### 5.5 CSS 设计系统 (app.less)

CSS 变量 | 值 | 用途
---------|-----|------
--primary | #0f766e | 主色(teal)
--primary-hover | #0d9488 | hover
--bg | #f5f5f4 | 页面背景
--surface | #ffffff | 卡片
--text | #1c1917 | 主文字
--text-secondary | #78716c | 次要文字
--border | #e7e5e4 | 边框
--success | #16a34a | 成功
--warning | #d97706 | 警告
--danger | #dc2626 | 危险

CSS 类 | 用途
------|------
.card | 白色卡片(border-radius:10px, border)
.input-field | 输入框(6px圆角, focus ring)
.badge/.badge-success/.badge-warning/.badge-danger/.badge-info | 状态标签
.section-header/.section-header-title | 页面标题行(flex)
.button-primary/.button-secondary | teal药丸按钮/白色描边
.data-table-row /.data-col-* | 数据表格行/列宽
.page-enter | fadeInUp入场动画
.form-grid | 自适应响应式表单网格

### 5.6 API 客户端

services/*.ts 导出一个对象, 方法调用 api.get/post/patch/delete:

services/ | 主要方法
----------|----------
auth.ts | login(), register()
products.ts | list(), getById(), getByBarcode(), create(), update(), remove()
purchases.ts | list(), getById(), create(), update(), confirm(), receive(), cancel()
sales.ts | list(), getById(), create(), update(), confirm(), deliver(), cancel()
inventory.ts | list(), logs()
categories/suppliers/customers/warehouses | CRUD
stocktake/transfers | CRUD + status transitions
reports.ts | purchaseSummary(), saleSummary(), profit()

**request.ts 工具**:
- API_BASE_URL 通过 process.env.API_BASE_URL 注入
- 自动注入 Authorization: Bearer <token>
- 401 自动清除 token + reLaunch 登录页(平台感知)
- 泛型方法: api.get<T>(), .post<T>(), .patch<T>(), .delete<T>()
- 自定义 ApiError 类(携带 statusCode + payload)

### 5.7 前端类型 (types/api.ts)

```typescript
interface ApiResponse<T> { success: boolean; data: T; error?: string; }
interface PaginatedResponse<T> { items: T[]; total: number; page?: number; limit?: number; }
interface Product { id, name, barcode?, unit, salePrice, costPrice, category?, enabled, createdAt }
interface PurchaseOrder { id, orderNo, supplier?, warehouse?, items, totalAmount, status, createdAt }
interface SaleOrder { id, orderNo, customer?, warehouse?, items, totalAmount, status, createdAt }
interface InventoryItem { id, productId, warehouseId, quantity, product? }
interface AuthResponse { accessToken, user }
type OrderStatus = 'DRAFT' | 'CONFIRMED' | 'RECEIVED' | 'DELIVERED' | 'CANCELLED'
const STATUS_LABELS: Record<string, string>  // 中文标签
const STATUS_STYLE: Record<string, { bg, text }>  // 样式映射
```

## 6. 认证与授权流程

### 6.1 登录流程

```
Login Page(email + password)
  -> POST /api/auth/login
  -> 后端: passport-jwt 验证, JWT payload { id, email, tenantId, role }
  -> { accessToken: ..., user: { id, name, email, tenantId, tenantName, role } }
  -> Zustand: useAuthStore.setAuth(token, user)
  -> Taro.setStorageSync(token, token)
  -> Taro.setStorageSync(user, JSON.stringify(user))
```

### 6.2 会话恢复 (store/auth.ts)

```typescript
const useAuthStore = create<AuthState>((set) => ({
  token: null, user: null,
  init: () => {
    const token = Taro.getStorageSync(token);
    const user = Taro.getStorageSync(user);
    if (token && user) set({ token, user: JSON.parse(user) });
  },
  logout: () => { set({ token: null, user: null }); },
}));
```

### 6.3 Guard 链

```
Request -> JwtAuthGuard(验证token, 解析payload -> request.user)
            -> RolesGuard(全局APP_GUARD, 检查@Permissions() + 数据库Role.permissions)
              -> Controller(注入@TenantId(), @CurrentUser())
                -> Service(tenantId 参数) -> Prisma
```

RolesGuard 的权限匹配逻辑:
- admin 角色绕过所有检查
- 精确匹配: owned === required
- 通配符: owned === * 或 products.* 匹配 products.read

### 6.4 401 处理

```typescript
// utils/request.ts 在 401 时:
Taro.removeStorageSync(token);
Taro.reLaunch({ url: LOGIN_PATH });  // 平台感知(h5 vs weapp)
```

## 7. 状态机业务逻辑

### 7.1 采购单 (PurchaseOrder)
DRAFT -> CONFIRMED -> RECEIVED, 任意状态 -> CANCELLED

- CONFIRM: 更新状态, 可设置商品成本价
- RECEIVE(整单入库): 事务更新 status + 逐行更新inventory + 写入inventory_log
- RECEIVE-ITEM(分批入库): 单行更新received_qty, 全部收满后自动transition到RECEIVED
- CANCEL: DRAFT/CONFIRMED可取消, 已入库(RECEIVED)不可取消

### 7.2 销售单 (SaleOrder)
DRAFT -> CONFIRMED -> DELIVERED, 任意状态 -> CANCELLED

- DELIVER: 减少 inventory.quantity, 类型 SALE_OUT

### 7.3 盘点单 (Stocktake)
DRAFT -> IN_PROGRESS -> COMPLETED, 任意状态 -> CANCELLED
- COMPLETE: 根据 diff_qty 调整 inventory + 写入 inventory_log

### 7.4 调拨单 (Transfer)
DRAFT -> CONFIRMED -> COMPLETED, 任意状态 -> CANCELLED
- COMPLETE: 源仓库减库存, 目标仓库加库存, 写入 inventory_log

### 7.5 状态更新安全模式

```typescript
async confirm(tenantId: string, id: string) {
  // 1. 先查(可选, 为了友好错误消息)
  const order = await this.prisma.purchaseOrder.findFirst({
    where: { id, tenantId },
  });
  if (!order) throw new NotFoundException();
  if (order.status !== DRAFT) throw new BadRequestException();

  // 2. 原子更新(带当前状态条件, 防并发)
  const result = await this.prisma.purchaseOrder.updateMany({
    where: { id, tenantId, status: DRAFT },
    data: { status: CONFIRMED },
  });
  if (result.count === 0) throw new BadRequestException(状态已变化，请刷新);

  return this.findById(tenantId, id);
}
```

## 8. 常见查询模式

### 8.1 多租户查询
所有查询强制带 tenantId:
```typescript
const where: any = { tenantId };  // 从 @TenantId() 获取
// 列表: findMany({ where, skip, take, orderBy: { createdAt: 'desc' } })
// 详情: findFirst({ where: { id, tenantId }, include: { ... } })
// 更新: updateMany({ where: { id, tenantId }, data })
```

### 8.2 分页 (前端 PaginatedResponse)
```typescript
const page = Number(query.page) || 1;
const limit = Number(query.limit) || 20;
const [items, total] = await Promise.all([
  this.prisma.product.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
  this.prisma.product.count({ where }),
]);
return { data: items, total, page, limit, totalPages: Math.ceil(total / limit) };
```

### 8.3 搜索 (OR 条件)
```typescript
if (query.search) {
  where.OR = [
    { name: { contains: query.search, mode: 'insensitive' } },
    { barcode: { contains: query.search } },
    { sku: { contains: query.search } },
  ];
}
```

### 8.4 日期范围
```typescript
if (query.startDate || query.endDate) {
  where.createdAt = {};
  if (query.startDate) where.createdAt.gte = new Date(query.startDate);
  if (query.endDate) where.createdAt.lte = new Date(query.endDate);
}
```

### 8.5 关联表筛选
```typescript
// 筛选包含某商品的采购单
if (query.productId) where.items = { some: { productId: query.productId } };
```

### 8.6 库存低库存告警
```typescript
if (filters.lowStock) where.quantity = { lte: filters.lowStock };
this.prisma.inventory.findMany({ where, include: { product: true, warehouse: true } });
```

### 8.7 软删除
```typescript
// 查询默认过滤软删除
where.enabled = true;

// 删除只设标志
const result = await this.prisma.product.updateMany({
  where: { id, tenantId }, data: { enabled: false },
});
if (result.count === 0) throw new NotFoundException();
```

### 8.8 包含关联 (Prisma include)
```typescript
// 商品 + 分类
this.prisma.product.findMany({ include: { category: true } });

// 采购单 + 供应商 + 仓库 + 商品行 + 商品详情
this.prisma.purchaseOrder.findFirst({
  where: { id, tenantId },
  include: { supplier: true, warehouse: true, items: { include: { product: true } } },
});
```

### 8.9 Prisma 事务 (库存变动)
```typescript
await this.prisma.$transaction(async (tx) => {
  const r1 = await tx.purchaseOrder.updateMany({ where: { id, tenantId, status }, data });
  if (r1.count === 0) throw new Error(冲突回滚);
  const r2 = await tx.inventory.updateMany({ where: { id }, data: { quantity } });
  if (r2.count === 0) throw new Error(冲突回滚);
  await tx.inventoryLog.create({ data: { ... } });
});
```

## 9. 扩展指南

### 9.1 添加新模块 (5 步)

1. **Prisma schema**: 添加 model -> npx prisma migrate dev
2. **后端**: backend/src/modules/下创建 4 文件(ctrl+service+module+dto)
3. **前端 API**: client/src/services/下添加 API 客户端
4. **前端页面**: pages/web/下创建页面, 注册到 app.config.ts
5. **AppShell**: 在 NAV_ITEMS 中添加导航项

### 9.2 添加新状态

1. Prisma schema 枚举中添加新值 -> migrate
2. Service 中添加状态转移方法(updateMany 模式)
3. Controller 中添加新路由 (POST /api/module/:id/new-action)
4. 前端 types/api.ts 添加 STATUS_LABELS + STATUS_STYLE

### 9.3 添加新权限

1. Controller 方法上使用 @Permissions(module.action)
2. RolesGuard 已支持通配符, 无需修改
3. Role.seed 中添加默认权限

### 9.4 添加新报表

1. reports module 中添加 service 方法
2. reports controller 中添加 GET 路由
3. client/services/reports.ts 中添加 API 方法

### 9.5 与 AI Agent 协作要点

- 所有查询都从 @TenantId() 获取 tenantId, 不要硬编码
- 更新操作优先使用 updateMany + count 检查, 而非 find-then-update
- 库存变动必须在 $transaction 中完成
- 前端 API 客户端保持纯函数封装, 不处理业务逻辑
- 页面遵循标准模板: section-header -> filter card -> table -> pagination
- 新全局状态延续 Zustand 模式, 放 store/ 目录

## 10. 开发命令

位置 | 命令 | 说明
------|------|------
backend/ | npm run build | tsc 编译(非 nest build -- TS6 不兼容)
backend/ | npm run start | node dist/main
backend/ | npm run start:dev | tsc + node --watch dist/main
backend/ | npx prisma migrate dev | 开发迁移
backend/ | npx prisma migrate reset | 重置DB(需 PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION=true)
backend/ | npx prisma generate | 重新生成 Prisma Client
backend/ | npm run seed | 填充演示数据
client/ | npm run dev:h5 | H5 开发服务器
client/ | npm run build:h5 | H5 生产构建 -> dist/h5
client/ | npm run dev:weapp | 微信小程序开发(watch)
client/ | npm run build:weapp | 小程序构建 -> dist/weapp

### 重要环境变量

变量 | 说明
------|------
DATABASE_URL | postgresql://postgres:postgres@localhost:5432/inout_dev?schema=public
JWT_SECRET | JWT 签名密钥
API_BASE_URL | 前端API地址(client config/index.ts defineConstants)

---

*文档版本: 1.0 - 基于实际代码生成*
