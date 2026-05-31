# 改造计划：采购/销售管理增强

## 一、列表页筛选增强

### 当前状态

采购和销售列表页目前只有**状态筛选**，缺少仓库、商品、时间范围筛选。

### 改造内容（前后端各 1 处）

#### 后端

**文件**：`purchases.service.ts` `findAll` / `sales.service.ts` `findAll`

**当前**：`where` 只过滤 `tenantId` + `status`

**改造后**：增加可选参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `warehouseId` | string | 按仓库筛选 |
| `productId` | string | 按商品筛选（通过 `items.some(productId)` ） |
| `startDate` | string | 创建日期起始 |
| `endDate` | string | 创建日期截止 |

#### 前端

**文件**：`web/src/pages/purchases/index.tsx` / `web/src/pages/sales/index.tsx`

**当前筛选栏**：只有状态下拉

**改造后筛选栏**：
```
[仓库下拉]  [商品搜索下拉]  [开始日期] ~ [结束日期]  [状态下拉]  [搜索按钮]  [+新增采购单]
```

- 仓库下拉：加载 `warehousesApi.list()`，可清空（表示全部）
- 商品搜索下拉：加载 `productsApi.list()`，支持搜索、可清空
- 日期范围：使用 Ant Design `DatePicker.RangePicker`
- 状态下拉：保留现有
- 搜索按钮：触发带所有参数的查询，重置页码为 1

---

## 二、编辑功能

### 当前状态

订单创建后无法修改，只能流转状态。

### 改造内容

#### 后端 — 新增更新接口

```
PUT /api/purchases/:id
Body: { supplierId?, warehouseId?, remark?, items?: [{ productId, quantity, unitCost }] }
权限：仅 DRAFT 和 CONFIRMED 状态
逻辑：删除旧 items → 创建新 items → 重新计算 totalAmount → 更新 order
```

```
PUT /api/sales/:id
Body: { customerId?, warehouseId?, remark?, items?: [{ productId, quantity, unitPrice }] }
权限：仅 DRAFT 和 CONFIRMED 状态
```

#### 前端 — 详情页增加编辑按钮

DRAFT / CONFIRMED 状态的操作栏增加"编辑"按钮，跳转编辑页面（复用 `new.tsx` 表单，预填数据）。

| 路由 | 行为 |
|------|------|
| `/purchases/:id/edit` | 加载订单数据 → 预填表单 → 提交时 PUT |
| `/sales/:id/edit` | 加载订单数据 → 预填表单 → 提交时 PUT |

---

## 三、分商品行出入库

### 核心设计

新增两个数据库字段：

| 表 | 新增字段 | 说明 |
|---|---------|------|
| `PurchaseItem` | `receivedQty` Decimal(12,2) default 0 | 已入库数量 |
| `SaleItem` | `deliveredQty` Decimal(12,2) default 0 | 已出库数量 |

`quantity` 保持为"订购数量"，`receivedQty` / `deliveredQty` 跟踪已执行数量。

### 后端 — 新增接口

#### 单行入库 `POST /api/purchases/:id/receive-item`
```json
{ "itemId": "xxx", "quantity": 10 }
```
逻辑：
1. 校验订单为 CONFIRMED 状态
2. 更新 `PurchaseItem.receivedQty += quantity`
3. 写入库存 + inventoryLog
4. 如果 ALL items 的 receivedQty >= quantity，自动将订单状态改为 RECEIVED

#### 单行出库 `POST /api/sales/:id/deliver-item`
```json
{ "itemId": "xxx", "quantity": 5 }
```
逻辑同上（扣减库存）。

#### 一键全部出入库（保留现有）

`POST /:id/receive` 和 `POST /:id/deliver` 行为改为：遍历 items，对 **receivedQty < quantity** 的条目执行剩余数量。完成后如果全部完成则状态改为 RECEIVED/DELIVERED。

### 前端 — 详情页商品表格

CONFIRMED 状态的商品表格新增列：

| 商品 | 订购数量 | 已入库 | 未入库 | 单价 | 小计 | 操作 |
|-----|---------|-------|-------|-----|-----|-----|
| XX  | 100     | 60    | 40    | ¥10 | ¥1000 | [入库] |

- "已入库"列：显示 `receivedQty`
- "未入库"列：显示 `quantity - receivedQty`
- 操作列：`receivedQty < quantity` 时显示"入库"按钮，弹出输入框填入数量
- 顶部保留"一键全部入库"按钮

销售同理。

---

## 四、涉及文件清单

| 文件 | 改动 |
|------|------|
| `prisma/schema.prisma` | PurchaseItem 加 receivedQty，SaleItem 加 deliveredQty |
| `purchases.service.ts` | findAll 加筛选；新增 update、receiveItem；修改 receive |
| `purchases.controller.ts` | 注册 PUT :id、POST :id/receive-item |
| `dto/update-purchase.dto.ts` | 新建 |
| `sales.service.ts` | findAll 加筛选；新增 update、deliverItem；修改 deliver |
| `sales.controller.ts` | 注册 PUT :id、POST :id/deliver-item |
| `dto/update-sale.dto.ts` | 新建 |
| `web/src/types/index.ts` | PurchaseItem 加 receivedQty，SaleItem 加 deliveredQty |
| `web/src/api/purchases.ts` | 加 update、receiveItem |
| `web/src/api/sales.ts` | 加 update、deliverItem |
| `web/src/pages/purchases/index.tsx` | 筛选栏增强 |
| `web/src/pages/purchases/detail.tsx` | 编辑 + 分行入库 |
| `web/src/pages/purchases/new.tsx` | 支持编辑模式（预填） |
| `web/src/pages/sales/index.tsx` | 筛选栏增强 |
| `web/src/pages/sales/detail.tsx` | 编辑 + 分行出库 |
| `web/src/pages/sales/new.tsx` | 支持编辑模式（预填） |

---

## 五、验收标准

- [ ] 采购/销售列表可按仓库、商品、日期范围筛选
- [ ] 草稿和已确认的采购/销售单可编辑
- [ ] 已入库/出库/作废的订单不可编辑
- [ ] 采购单 CONFIRMED 状态可逐行入库，也可一键全部入库
- [ ] 销售单 CONFIRMED 状态可逐行出库，也可一键全部出库
- [ ] 所有条目执行完成后，订单状态自动变为 RECEIVED/DELIVERED
- [ ] 已有数据兼容（旧数据 `receivedQty` = `quantity`，视为全部已执行）
