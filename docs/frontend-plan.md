# 前端方案规划 — 方案A：双前端分离

> 后端 NestJS API（共用），前端两个独立项目：
> - **H5 Web**：Vite + React 18 + Ant Design 5 + React Router 6
> - **微信小程序**：微信原生开发（无 Taro）
>
> 本文档定义每个页面的功能模块、调用接口、UI 说明。

---

## 一、H5 Web 管理端

### 1.1 登录 / 注册

| 页面 | 功能 | API | 说明 |
|------|------|-----|------|
| `/login` | 登录表单 | `POST /api/auth/login` | 邮箱+密码 → 存储 token → 跳转首页 |
| `/register` | 注册表单 | `POST /api/auth/register` | 注册租户+管理员 |
| - | 401 拦截跳转 | - | Axios 拦截器检测 401 → 清除 token → 跳转 `/login` |

**UI 要求**：
- 登录页居中卡片，无侧边栏/顶栏
- 注册较简单（可能只开放管理员后台创建）
- Token 存 localStorage，每次请求带 `Authorization: Bearer`

---

### 1.2 Dashboard

| 路径 | 功能 | API | 说明 |
|------|------|-----|------|
| `/` 或 `/dashboard` | 仪表盘 | `GET /api/reports/dashboard` | KPI 卡片 + 快捷操作 + 最近单据 |

**功能模块**：
- **KPI 行**：今日采购额、今日销售额、库存商品总数、低库存商品数
- **快捷入口**：新建采购单、新建销售单、盘点、调拨（卡片按钮）
- **最近单据**：最近 5 条采购/销售/调拨单（紧凑列表，点击跳转）

**API 数据结构**（from `GET /api/reports/dashboard`）：
```typescript
{
  todayPurchaseAmount: number
  todaySaleAmount: number
  totalProducts: number
  alertCount: number
  recentOrders: Array<{ id, type, orderNo, status, amount, createdAt }>
}
```

---

### 1.3 商品管理

| 路径 | 功能 | API | 说明 |
|------|------|-----|------|
| `/products` | 商品列表 | `GET /api/products?search=&categoryId=&page=&limit=` | 表格 + 搜索 + 分类筛选 |
| `/products/new` | 新建商品 | `POST /api/products` | 表单 |
| `/products/:id` | 编辑商品 | `PATCH /api/products/:id` | 同新建表单，回填数据 |
| `/products/:id` | 删除商品 | `DELETE /api/products/:id` | 确认弹窗后软删除 |

**列表列**：名称、条码、SKU、分类、售价、成本价、库存总量（从 inventory 获取）、状态
**搜索**：名称/条码/SKU 模糊搜索
**分类筛选**：下拉选择（从 `GET /api/categories` 加载）
**表单字段**：名称*、分类、条码、SKU、单位（默认"个"）、售价、成本价、规格(JSON)

**关联 API**：
- `GET /api/categories` — 下拉选项
- `GET /api/products/barcode/:barcode` — 扫码快速查找（可选功能）

---

### 1.4 分类管理

| 路径 | 功能 | API | 说明 |
|------|------|-----|------|
| `/categories` | 分类列表 | `GET /api/categories` | 树形展示（缩进/层级线） |
| - | 新建 | `POST /api/categories` | 输入名称 + 选择父分类 |
| - | 编辑 | `PATCH /api/categories/:id` | 重命名 |
| - | 删除 | `DELETE /api/categories/:id` | 有下级或商品时阻止删除 |

---

### 1.5 供应商管理

| 路径 | 功能 | API |
|------|------|-----|
| `/suppliers` | 列表 | `GET /api/suppliers?search=&page=&limit=` |
| - | 新建 | `POST /api/suppliers` |
| - | 编辑 | `PATCH /api/suppliers/:id` |
| - | 删除 | `DELETE /api/suppliers/:id` |

**列表列**：名称、联系人、电话、地址、**往来金额**、创建时间
**默认排序**：往来金额从大到小
**表单**：名称*、联系人、电话、邮箱、地址

---

### 1.6 客户管理

| 路径 | 功能 | API |
|------|------|-----|
| `/customers` | 列表 | `GET /api/customers?search=&page=&limit=` |
| - | 新建 | `POST /api/customers` |
| - | 编辑 | `PATCH /api/customers/:id` |
| - | 删除 | `DELETE /api/customers/:id` |

**表单**：名称*、电话、地址

**列表列**：名称、电话、地址、**往来金额**、创建时间
**默认排序**：往来金额从大到小

---

### 1.7 仓库管理

| 路径 | 功能 | API |
|------|------|-----|
| `/warehouses` | 列表 | `GET /api/warehouses?search=&page=&limit=` |
| - | 新建 | `POST /api/warehouses` |
| - | 编辑 | `PATCH /api/warehouses/:id` |
| - | 删除 | `DELETE /api/warehouses/:id` |

**表单**：名称*、地址

---

### 1.8 采购管理

| 路径 | 功能 | API | 状态机 |
|------|------|-----|--------|
| `/purchases` | 采购单列表 | `GET /api/purchases?status=&supplierId=&dateFrom=&dateTo=&page=&limit=` | - |
| `/purchases/new` | 创建采购单 | `POST /api/purchases` | → DRAFT |
| `/purchases/:id` | 采购单详情 | `GET /api/purchases/:id`（含 items） | - |
| - | 确认 | `POST /api/purchases/:id/confirm` | DRAFT → CONFIRMED |
| - | 入库 | `POST /api/purchases/:id/receive` | CONFIRMED → RECEIVED |
| - | 作废 | `POST /api/purchases/:id/cancel` | → CANCELLED |

**列表列**：单号、供应商、总金额、状态（带颜色标签）、创建时间
**筛选**：状态下拉、供应商下拉、日期范围
**新建表单**：选择供应商、选择仓库、添加商品明细（商品选择器 → 输入数量+单价 → 自动计算小计）
**操作按钮**：根据状态显示可用操作（DRAFT→确认, CONFIRMED→入库/作废, RECEIVED→已完成）

**关联 API**：
- `GET /api/suppliers` — 供应商下拉
- `GET /api/warehouses` — 仓库下拉
- `GET /api/products?search=` — 商品搜索选择器

---

### 1.9 销售管理

| 路径 | 功能 | API | 状态机 |
|------|------|-----|--------|
| `/sales` | 销售单列表 | `GET /api/sales?status=&customerId=&dateFrom=&dateTo=&page=&limit=` | - |
| `/sales/new` | 创建销售单 | `POST /api/sales` | → DRAFT |
| `/sales/:id` | 销售单详情 | `GET /api/sales/:id` | - |
| - | 确认 | `POST /api/sales/:id/confirm` | DRAFT → CONFIRMED |
| - | 出库 | `POST /api/sales/:id/deliver` | CONFIRMED → DELIVERED |
| - | 作废 | `POST /api/sales/:id/cancel` | → CANCELLED |

**关联 API**：`GET /api/customers`, `GET /api/warehouses`, `GET /api/products`

---

### 1.10 库存管理

| 路径 | 功能 | API | 说明 |
|------|------|-----|------|
| `/inventory` | 库存列表 | `GET /api/inventory?productId=&warehouseId=&page=&limit=` | 表格 |
| - | 库存预警 | `GET /api/inventory/alerts?threshold=10` | 低于阈值高亮 |
| - | 变动记录 | `GET /api/inventory/logs?productId=&type=&page=&limit=` | 侧边弹窗/新页 |
| - | 历史库存 | `GET /api/inventory/history?date=` | 日期选择器 |

**列表列**：商品名称（link）、仓库、数量、均价、更新时间
**筛选**：仓库下拉、商品搜索、日期范围
**预警**：低于阈值行红色/黄色标识

---

### 1.11 盘点管理

| 路径 | 功能 | API | 状态机 |
|------|------|-----|--------|
| `/stocktakes` | 盘点单列表 | `GET /api/stocktakes?status=&warehouseId=&page=&limit=` | - |
| `/stocktakes/new` | 创建盘点单 | `POST /api/stocktakes`（自动生成 items） | → DRAFT |
| `/stocktakes/:id` | 盘点单详情 | `GET /api/stocktakes/:id` | - |
| - | 开始盘点 | `POST /api/stocktakes/:id/start` | DRAFT → IN_PROGRESS |
| - | 完成盘点 | `POST /api/stocktakes/:id/complete` | IN_PROGRESS → COMPLETED |
| - | 作废 | `POST /api/stocktakes/:id/cancel` | → CANCELLED |

**关键交互**：创建时自动装入当前库存数量作为 book_qty；开始后可以逐个修改 actual_qty，系统自动计算 diff_qty；完成后自动调整库存差异。

---

### 1.12 调拨管理

| 路径 | 功能 | API | 状态机 |
|------|------|-----|--------|
| `/transfers` | 调拨单列表 | `GET /api/transfers?status=&page=&limit=` | - |
| `/transfers/new` | 创建调拨单 | `POST /api/transfers` | → DRAFT |
| `/transfers/:id` | 调拨单详情 | `GET /api/transfers/:id` | - |
| - | 确认 | `POST /api/transfers/:id/confirm` | DRAFT → CONFIRMED |
| - | 完成 | `POST /api/transfers/:id/complete` | CONFIRMED → COMPLETED |
| - | 作废 | `POST /api/transfers/:id/cancel` | → CANCELLED |

**关键交互**：选择源仓库、目标仓库（不能相同）、添加商品数量；完成后源仓扣减、目标仓增加。

---

### 1.13 报表

| 路径 | 功能 | API | 说明 |
|------|------|-----|------|
| `/reports` | 报表页 | - | Tab 切换 |
| - | 采购报表 | `GET /api/reports/purchases?startDate=&endDate=` | 柱状图 + 表格 |
| - | 销售报表 | `GET /api/reports/sales?startDate=&endDate=` | 柱状图 + 表格 |
| - | 利润报表 | `GET /api/reports/profit?startDate=&endDate=` | 折线图 |
| - | 库存价值 | `GET /api/reports/inventory-value` | 卡片 |

---

### 1.14 系统设置（租户/用户/角色）

| 路径 | 功能 | API | 说明 |
|------|------|-----|------|
| `/tenants` | 租户信息 | `GET /api/tenants` + `PATCH /api/tenants` | 查看/编辑名称、logo |
| `/users` | 用户列表 | `GET /api/users` | 表格 |
| `/users/new` | 创建用户 | `POST /api/users` | 表单 |
| `/users/:id/edit` | 编辑用户 | `PATCH /api/users/:id` | 表单 |
| - | 禁用用户 | `DELETE /api/users/:id` | 确认弹窗 |
| - | 分配角色 | `POST /api/users/:id/role` | 角色下拉 |
| `/roles` | 角色列表 | `GET /api/roles` | 表格 |
| `/roles/new` | 创建角色 | `POST /api/roles` | 名称 + 权限勾选 |
| - | 编辑/删除 | `PATCH/DELETE /api/roles/:id` | - |

**权限设计**：权限用 `module.action` 格式（如 `purchase.read`, `sale.write`），在角色编辑时用树形勾选器组织。

---

### 1.15 布局

```
+------------------+--------------------------------------+
|                  |  Topbar: 页面标题 | 用户头像+名称     |
|  Sidebar (72px)  +--------------------------------------+
|  导航图标         |                                      |
|  (hover展开)      |  Content                            |
|                  |                                      |
+------------------+--------------------------------------+
```

**侧边栏导航项**：Dashboard、商品、采购、销售、库存、报表、设置
**响应式**：960px 以下侧边栏变为底部导航

---

## 二、微信小程序

### 2.1 登录

| 页面 | 功能 | API | 说明 |
|------|------|-----|------|
| `pages/login` | 登录 | `POST /api/auth/login` | 邮箱+密码登录，或手机号一键登录 |

### 2.2 首页

| 功能 | API | 说明 |
|------|-----|------|
| KPI 卡片 | `GET /api/reports/dashboard` | 今日采购/销售/预警数 |
| 快捷操作 | - | 扫码购/销/库存/更多 4 个图标入口 |
| 最近订单 | `GET /api/reports/dashboard` | 最近5条 |

### 2.3 扫码

| 功能 | API | 说明 |
|------|-----|------|
| 扫码枪/摄像头 | `wx.scanCode` | 调用微信扫码 |
| 查商品 | `GET /api/products/barcode/:barcode` | 查结果显示商品名称、售价、库存 |
| 快速创建 | `POST /api/purchases` 或 `POST /api/sales` | 扫码后直接进入采购/销售录入页 |

### 2.4 语音录入

| 功能 | API | 说明 |
|------|-----|------|
| 录音 | `wx.getRecorderManager` | 录音 |
| 上传识别 | `POST /api/upload/audio` | 语音转文字 |
| 结果处理 | - | 解析文字→提取商品/数量→生成单据草稿 |

### 2.5 拍照识别

| 功能 | API | 说明 |
|------|-----|------|
| 拍照/相册 | `wx.chooseMedia` | 选择图片 |
| 上传识别 | `POST /api/upload/image` | OCR 识别 |
| 结果处理 | - | 同语音录入 |

### 2.6 采购（快速）

| 页面 | 功能 | API |
|------|------|-----|
| `pages/purchase` | 快速采购录入 | `POST /api/purchases` |
| `pages/purchase-list` | 采购单列表 | `GET /api/purchases?page=&limit=` |
| `pages/purchase-detail` | 采购单详情 | `GET /api/purchases/:id` |

小程序版本简化：默认使用第一个仓库/第一个供应商（如需选择则弹出 picker），快速添加商品行。

### 2.7 销售（快速）

| 页面 | 功能 | API |
|------|------|-----|
| `pages/sale` | 快速销售录入 | `POST /api/sales` |
| `pages/sale-list` | 销售单列表 | `GET /api/sales?page=&limit=` |
| `pages/sale-detail` | 销售单详情 | `GET /api/sales/:id` |

### 2.8 库存查询

| 功能 | API | 说明 |
|------|-----|------|
| 搜索 | `GET /api/inventory?productId=&warehouseId=` | 商品+仓库筛选 |
| 全部库存 | `GET /api/inventory?page=&limit=` | 分页列表 |
| 预警 | `GET /api/inventory/alerts?threshold=10` | 列表中标识低库存 |

### 2.9 商品查询

| 功能 | API |
|------|-----|
| 搜索 | `GET /api/products?search=&page=&limit=` |
| 详情 | `GET /api/products/:id` |

### 2.10 其他

| 页面 | 功能 | API |
|------|------|-----|
| 盘点 | 查看/创建盘点单 | `GET /api/stocktakes`, `POST /api/stocktakes` |
| 调拨 | 查看/创建调拨单 | `GET /api/transfers`, `POST /api/transfers` |
| 我的/更多 | 个人信息、切换租户等 | `GET /api/tenants` |

### 2.11 底部 Tab

| Tab | 页面 |
|-----|------|
| 首页 | 仪表盘 |
| 采购 | 采购列表（含新建入口） |
| 销售 | 销售列表（含新建入口） |
| 库存 | 库存查询 |
| 更多 | 扫码/语音/拍照/盘点/调拨/设置 |

---

## 三、通用 UI 规范

### 3.1 列表页统一行为

- **加载态**：Skeleton 占位
- **空态**：Empty 组件 + 新建按钮
- **错误态**：错误提示 + 重试按钮
- **分页**：统一分页器（Web）/ 上拉加载更多（小程序）

### 3.2 状态颜色

| 状态 | 颜色 |
|------|------|
| DRAFT | 灰色 |
| CONFIRMED | 蓝色 |
| RECEIVED / DELIVERED / COMPLETED | 绿色 |
| CANCELLED | 红色 |
| IN_PROGRESS | 橙色 |

### 3.3 新建表单页模式

```
1. 选择关联对象（供应商/仓库/客户 等）
2. 逐行添加明细（商品选择器 + 数量 + 单价）
3. 自动计算总金额
4. 提交 → 跳转详情页
```

### 3.4 操作按钮可见性

单据详情页根据 status 显示可用操作按钮：
```
DRAFT: [确认] [作废]
CONFIRMED: [入库/出库/完成] [作废]  ← 取决于单据类型
RECEIVED/DELIVERED/COMPLETED: 无操作（只读）
CANCELLED: 无操作（只读）
```

---

## 四、项目组织

### H5 Web 项目结构

```
web/
├── src/
│   ├── api/           # Axios 封装 + 各模块 API 函数
│   ├── components/    # 通用组件（PageContainer, StatusTag 等）
│   ├── layouts/       # AppLayout（侧边栏 + 顶栏）
│   ├── pages/         # 按模块分目录
│   ├── store/         # Zustand（auth）
│   ├── types/         # TypeScript 类型定义
│   ├── utils/         # 工具函数
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── vite.config.ts
└── tsconfig.json
```

### 微信小程序项目结构

```
mini/
├── pages/            # 按功能分目录
├── components/       # 自定义组件
├── services/         # API 调用封装
├── utils/            # 工具函数
├── app.js
├── app.json
└── project.config.json
```
