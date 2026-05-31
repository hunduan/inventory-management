# 进销存管理系统 — 项目技术文档

> 本文档面向程序员/AI Agent，描述项目的完整架构、约定和业务流程。

## 一、项目概览

多租户进销存管理系统。三个终端共享一个 NestJS API：

| 终端 | 技术栈 | 位置 |
|------|--------|------|
| Web 管理后台 | React 19 + Vite 8 + Ant Design 6 + React Router 7 + Zustand 5 | `web/` |
| 微信小程序 | Taro 4 + React + WXML | `client/src/pages/mini/` |
| API 后端 | NestJS 11 + Prisma 7 + PostgreSQL + Passport JWT | `backend/` |

> **注意**: `client/src/pages/web/` 是旧版 H5 实现，新版 Web 在 `web/` 目录。

---

## 二、项目结构

```
in-out/
├── backend/                    # NestJS API 服务
│   ├── prisma/
│   │   ├── schema.prisma       # 数据库模型定义（16个模型，4个枚举）
│   │   └── migrations/         # 迁移历史
│   ├── src/
│   │   ├── main.ts             # 入口，Swagger 配置
│   │   ├── app.module.ts       # 根模块，注册所有模块
│   │   ├── common/             # 共享基础设施
│   │   │   ├── prisma/         # PrismaService（数据库访问）
│   │   │   ├── guards/         # JwtAuthGuard, RolesGuard
│   │   │   ├── decorators/     # @TenantId(), @CurrentUser(), @Permissions()
│   │   │   └── filters/        # 全局异常过滤器
│   │   └── modules/            # 16个业务模块
│   │       ├── auth/           # 登录、注册、JWT策略
│   │       ├── products/       # 商品CRUD
│   │       ├── categories/     # 分类CRUD（含父子层级）
│   │       ├── suppliers/      # 供应商CRUD
│   │       ├── customers/      # 客户CRUD
│   │       ├── warehouses/     # 仓库CRUD
│   │       ├── purchases/      # 采购订单（状态机）
│   │       ├── sales/          # 销售订单（状态机）
│   │       ├── inventory/      # 库存查询、预警、变动日志
│   │       ├── stocktake/      # 盘点（状态机）
│   │       ├── transfers/      # 调拨（状态机）
│   │       ├── reports/        # 报表（采购/销售/利润/仪表盘）
│   │       ├── upload/         # 文件上传（图片、音频）
│   │       ├── users/          # 用户管理
│   │       ├── roles/          # 角色权限管理
│   │       └── tenants/        # 租户管理
│   └── prisma.config.ts        # Prisma 7 配置文件
│
├── web/                        # Web 前端（Vite + React）
│   ├── src/
│   │   ├── App.tsx             # 路由配置（BrowserRouter）
│   │   ├── api/                # 16个API客户端（每模块一个文件）
│   │   ├── types/index.ts      # TypeScript 类型定义（18个接口+4个联合类型）
│   │   ├── store/auth.ts       # Zustand 认证状态
│   │   ├── layouts/            # AppLayout（侧边栏+顶栏）
│   │   ├── components/         # 通用组件（KpiCard, EmptyState）
│   │   └── pages/              # 页面组件
│   │       ├── login/
│   │       ├── dashboard/
│   │       ├── products/       # index.tsx + form.tsx
│   │       ├── categories/
│   │       ├── suppliers/
│   │       ├── customers/
│   │       ├── warehouses/
│   │       ├── purchases/      # index.tsx + new.tsx + detail.tsx
│   │       ├── sales/          # index.tsx + new.tsx + detail.tsx
│   │       ├── inventory/      # index.tsx（含日志弹窗）
│   │       ├── stocktake/      # index.tsx + new.tsx + detail.tsx
│   │       ├── transfers/      # index.tsx + new.tsx + detail.tsx
│   │       ├── reports/
│   │       ├── users/
│   │       ├── roles/
│   │       └── tenants/
│   └── vite.config.ts
│
└── client/                     # 旧版 Taro 项目
    └── src/pages/mini/         # 微信小程序页面（15个）
```

---

## 三、后端架构

### 3.1 模块结构

每个模块遵循 NestJS 标准结构：
```
modules/<name>/
  ├── <name>.controller.ts    # 路由定义
  ├── <name>.service.ts       # 业务逻辑
  ├── <name>.module.ts        # 模块注册
  └── dto/                    # 请求体验证（class-validator）
```

纯 CRUD 模块（categories、suppliers、warehouses）保持一致模式。工作流模块（purchases、sales、stocktake、transfers）在 service 中包含状态机逻辑。

### 3.2 路由约定

```
GET    /api/<resource>          列表（分页）
GET    /api/<resource>/:id      详情
POST   /api/<resource>          创建
PATCH  /api/<resource>/:id      更新（部分字段）
DELETE /api/<resource>/:id      删除（软删除: enabled=false）

# 状态流转端点
POST /api/<resource>/:id/confirm     确认
POST /api/<resource>/:id/cancel      作废
POST /api/<resource>/:id/receive     批量入库（采购）
POST /api/<resource>/:id/receive-item 逐行入库（采购）
POST /api/<resource>/:id/deliver     批量出库（销售）
POST /api/<resource>/:id/deliver-item 逐行出库（销售）
POST /api/<resource>/:id/start       开始（盘点）
POST /api/<resource>/:id/complete    完成（盘点/调拨）
```

### 3.3 认证与权限

- **JWT 认证**: `JwtAuthGuard` 从 token 解析 `userId` + `tenantId`
- **租户隔离**: 所有表有 `tenantId`，查询通过 `@TenantId()` 装饰器获取并过滤
- **角色权限**: `RolesGuard`（全局），从数据库读取角色权限，支持通配符匹配（如 `purchases.*`），admin 跳过
- **全局异常过滤器**: 统一 JSON 响应 `{ success: false, data: null, error, timestamp }`

### 3.4 标准分页查询

```typescript
async findAll(tenantId: string, query: { page?: number; limit?: number }) {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const [items, total] = await Promise.all([
    this.prisma.model.findMany({
      where: { tenantId },
      include: { /* 关联 */ },
      skip: (page - 1) * limit, take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    this.prisma.model.count({ where: { tenantId } }),
  ]);
  return { data: items, total, page, limit, totalPages: Math.ceil(total / limit) };
}
```

### 3.5 TOCTOU 预防（关键模式）

代码库使用统一的乐观并发控制，**不依赖数据库锁**：

```typescript
// 步骤1：脆弱读取（验证前置条件）
const record = await this.prisma.model.findFirst({ where: { id, tenantId } });
if (!record) throw new NotFoundException('...');
if (record.status !== 'EXPECTED') throw new BadRequestException('状态不正确');

// 步骤2：带前置条件写入（where子句包含状态检查）
const result = await this.prisma.model.updateMany({
  where: { id, tenantId, status: 'EXPECTED' },
  data: { status: 'NEXT' },
});

// 步骤3：检查count === 0（说明状态已被并发修改）
if (result.count === 0) throw new BadRequestException('状态已变化，请刷新后重试');
```

**库存扣减**使用额外检查防止超卖：
```typescript
await tx.inventory.updateMany({
  where: { id: inv.id, quantity: { gte: quantity } },
  data: { quantity: { decrement: quantity } },
});
```

---

## 四、数据库模型

### 4.1 枚举

| 枚举名 | 状态流转 |
|--------|---------|
| PurchaseStatus | `DRAFT → CONFIRMED → RECEIVED`（← CANCELLED） |
| SaleStatus | `DRAFT → CONFIRMED → DELIVERED`（← CANCELLED） |
| StocktakeStatus | `DRAFT → IN_PROGRESS → COMPLETED`（← CANCELLED） |
| TransferStatus | `DRAFT → CONFIRMED → COMPLETED`（← CANCELLED） |

### 4.2 核心模型关系

```
Tenant 1──N User/Role/Category/Product/Warehouse/Supplier/Customer

PurchaseOrder 1──N PurchaseItem ── Product
  └── Supplier

SaleOrder 1──N SaleItem ── Product
  └── Customer

Stocktake 1──N StocktakeItem ── Product
  └── Warehouse

Transfer 1──N TransferItem ── Product
  └── fromWarehouse/toWarehouse

Inventory (productId + warehouseId 联合唯一)
InventoryLog ── Product/Warehouse（审计追踪）
```

### 4.3 字段约定

| 模式 | 规则 |
|------|------|
| ID | `@id @default(uuid()) @db.Uuid` |
| 外键映射 | `@map("snake_case")` |
| 表名 | `@@map("snake_plural")` |
| 金额/数量 | `@db.Decimal(12, 2)` |
| 金额字段 | `totalAmount`, `unitPrice`, `unitCost`, `subtotal` |
| 软删除 | `enabled: false`（products, categories, suppliers, customers, warehouses） |
| 租户字段 | 所有非系统表有 `tenantId` + `@@index([tenantId])` |

---

## 五、业务工作流

### 5.1 采购

```
DRAFT ──confirm──→ CONFIRMED ──receive──→ RECEIVED
  └──cancel──→ CANCELLED ←──cancel──┘
```
- 单号格式 `POYYYYMMDD-NNN`（按租户每日计数器）
- 确认无库存影响，入库才增加库存
- 支持逐行入库（receiveItem）和批量入库（receive）
- 全部入库后自动变 RECEIVED
- RECEIVED 不可作废

### 5.2 销售

```
DRAFT ──confirm──→ CONFIRMED ──deliver──→ DELIVERED
  └──cancel──→ CANCELLED ←──cancel──┘
```
- 单号格式 `SOYYYYMMDD-NNN`
- 创建时从库存获取 `unitCost` 记录成本
- 出库时从库存扣减（`quantity: { gte: quantity }` 防超卖）
- 支持逐行出库（deliverItem）和批量出库（deliver）
- DELIVERED 不可作废

### 5.3 盘点

```
DRAFT ──start──→ IN_PROGRESS ──complete──→ COMPLETED
  └──cancel──→ CANCELLED ←──cancel──┘
```
- 创建时自动从仓库库存快照生成盘点项
- `IN_PROGRESS` 时逐行录入实际数量（有自动保存和脏标记）
- `complete` 在事务内更新库存 + 写日志
- COMPLETED 不可取消

### 5.4 调拨

```
DRAFT ──confirm──→ CONFIRMED ──complete──→ COMPLETED
  └──cancel──→ CANCELLED ←──cancel──┘
```
- `complete` 在事务内：源仓库扣减 + 目标仓库增加 + 两条日志

### 5.5 库存变动触发点

| 操作 | 库存影响 | 日志类型 |
|------|---------|---------|
| 采购入库 | 增加 | PURCHASE_RECEIVE |
| 销售出库 | 减少 | SALE_OUT |
| 盘点完成 | 按差异增减 | STOCKTAKE |
| 调拨完成 | 源- / 目标+ | TRANSFER_OUT / TRANSFER_IN |

---

## 六、前端架构

### 6.1 页面模式

**列表页**（purchases/sales/products 等）：
1. 筛选栏：搜索输入 + 下拉选择（仓库/商品/时间范围） + 搜索按钮
2. Ant Design Table，按 `updatedAt` 降序
3. 底部 Pagination，默认每页20条

**表单页**（new.tsx / form.tsx）：
1. `Form layout="vertical"`，最大宽度 800px
2. 选项数据（客户/供应商/产品/仓库）在 `useEffect` 中并行加载
3. 商品明细用内嵌 Table，可增删改行，实时合计
4. 编辑模式通过 `/purchases/:id/edit` 复用同一组件，`useParams` 检测
5. 支持 `productId` 查询参数预填商品

**详情页**（detail.tsx）：
1. Descriptions 显示主信息
2. 操作按钮根据状态条件渲染
3. 商品 Table 根据状态显示额外列（已入库/未入库数）
4. 逐行入/出库弹窗（Modal + InputNumber）
5. 操作后 `fetchData()` 刷新

### 6.2 API 客户端模式

```typescript
// api/purchases.ts
export const purchasesApi = {
  list: (params: string) =>
    api.get<PaginatedResponse<PurchaseOrder>>(`/purchases?${params}`).then((r) => r.data),
  getById: (id: string) => api.get<PurchaseOrder>(`/purchases/${id}`).then((r) => r.data),
  create: (data: any) => api.post<PurchaseOrder>('/purchases', data).then((r) => r.data),
  update: (id: string, data: any) => api.put<PurchaseOrder>(`/purchases/${id}`, data).then((r) => r.data),
  confirm: (id: string) => api.post(`/purchases/${id}/confirm`).then((r) => r.data),
  receive: (id: string) => api.post(`/purchases/${id}/receive`).then((r) => r.data),
  receiveItem: (id: string, itemId: string, quantity: number) =>
    api.post(`/purchases/${id}/receive-item`, { itemId, quantity }).then((r) => r.data),
  cancel: (id: string) => api.post(`/purchases/${id}/cancel`).then((r) => r.data),
};
```

Axios 实例配置：
- `baseURL`: `import.meta.env.VITE_API_BASE || '/api'`
- 请求拦截器：从 `localStorage` 注入 `Bearer` token
- 响应拦截器：401 时清 token 跳转 `/login`

### 6.3 状态管理

- **Zustand**: 仅认证状态（store/auth.ts）
- **组件本地状态**: 业务数据用 `useState` + `useEffect`，无全局业务状态

### 6.4 库存列表特殊逻辑

按商品合并展示，每个商品一行，子行显示各仓库详情：

```
商品名
 ├─ 仓库A  数量: 50  成本: ¥10.00  2026-05-30 10:00
 ├─ 仓库B  数量: 30  成本: ¥12.00  2026-05-29 15:00
 └─ [新建销售] [新建采购] [日志]
```

- 按 `productId` 在前端用 `useMemo` 分组
- 排序按组内最新更新时间
- 预警（< 10）按单仓库判断，在子行显示图标

---

## 七、编码约定

### 7.1 命名

| 层面 | 风格 | 示例 |
|------|------|------|
| 变量/函数 | camelCase | `fetchData`, `handleSubmit` |
| 接口/组件 | PascalCase | `SaleOrder`, `InventoryPage` |
| 文件/模块 | kebab-case | `purchases.service.ts` |
| 数据库字段 | snake_case（Prisma @map） | `order_no`, `total_amount` |
| API 路由 | kebab-case | `/api/purchase-orders` |

### 7.2 前端 Ant Design 6 注意事项

`@ant-design/icons` v6 移除了部分旧版图标，用前确认存在性：
- 已移除: `BuildingOutlined`, `ApiOutlined`, `ContainerOutlined`
- 检查方法: `grep` 确认存在于 `node_modules/@ant-design/icons/es/index.js`

### 7.3 微信小程序 CSS 限制（Taro 4）

- 行内样式 `display: 'flex'` → 被编译为空字符串，用 `className`
- 不支持 `paddingHorizontal`、`paddingVertical`、`shadowColor` 等
- `gap` 在 flex 布局中可能不渲染，使用 `marginLeft`/`marginTop` 替代

---

## 八、常见开发任务

### 8.1 新增 CRUD 模块

1. `prisma/schema.prisma` 加模型 → `npx prisma migrate dev`
2. 后端 `modules/<name>/`（controller + service + module + dto）
3. `app.module.ts` 注册
4. 前端 `types/index.ts` 加接口
5. 前端 `api/<name>.ts` 加客户端
6. 前端创建页面组件
7. `App.tsx` 注册路由

### 8.2 新增状态操作

1. Service 加方法（TOCTOU 模式）
2. Controller 加路由端点
3. 前端 API 客户端加方法
4. 详情页按状态条件渲染操作按钮

### 8.3 修改查询过滤

1. Service `findAll` 加可选参数 → 构建 Prisma where
2. 前端列表页筛选栏加控件 → 构建 URLSearchParams

---

## 九、已知限制

- **大事务风险**: 盘点完成在一个事务中处理所有项目，超 1000 项可能超时
- **并发限制**: 乐观锁而非可序列化隔离，高并发存在竞争窗口
- **盘点隔离**: 盘点期间未阻止其他操作修改同一仓库库存
- **无事件总线**: 所有操作同步阻塞
- **无数据导出**: 没有 CSV/PDF 导出
- **无价格历史**: 未跟踪成本价变更历史
