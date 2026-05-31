# 改造计划：库存日志关联单据详情

## 背景

当前库存变动日志只记录了 `refId` 和 `refType`，但没有展示关联单据的具体信息（单号、供应商/客户、金额等），也无法跳转到单据详情页。

## 关联关系

| refType | 对应模型 | 详情页路由 |
|---------|---------|-----------|
| `PURCHASE_ORDER` | PurchaseOrder | `/purchases/:id` |
| `SALE_ORDER` | SaleOrder | `/sales/:id` |
| `TRANSFER` | Transfer | `/transfers/:id` |
| `STOCKTAKE` | Stocktake | `/stocktakes/:id` |

## 改动项

### 1. 后端 — `getLogs` 增加关联单据信息

**文件**：`backend/src/modules/inventory/inventory.service.ts`

**当前逻辑**：查询 `InventoryLog` 表 → 只关联 `product` → 返回 `{ data, total, page, limit, totalPages }`

**改造内容**：

```
getLogs 查询完成后，收集所有日志的 refId/refType
按类型分组，批量查询对应的单据：
  PURCHASE_ORDER → PurchaseOrder（include supplier）
  SALE_ORDER     → SaleOrder（include customer）
  TRANSFER       → Transfer（include fromWarehouse, toWarehouse）
  STOCKTAKE      → Stocktake（include warehouse）
对每条日志，将匹配到的单据摘要注入到 response 的 refOrder 字段
```

**返回格式变化**（只新增不破坏原有字段）：

```json
{
  "data": [{
    "id": "...",
    "type": "PURCHASE_IN",
    "quantity": "5",
    "beforeQty": "10",
    "afterQty": "15",
    "refId": "order-uuid",
    "refType": "PURCHASE_ORDER",
    "remark": "...",
    "createdAt": "...",
    "product": { ... },
    "refOrder": {
      "type": "PURCHASE_ORDER",
      "orderNo": "PO-20260501-001",
      "status": "RECEIVED",
      "counterpartyName": "XX供应商",
      "totalAmount": "5000.00"
    }
  }],
  "total": 50,
  "page": 1,
  "limit": 20
}
```

非采购/销售单据（TRANSFER / STOCKTAKE）也带上 `refOrder`，`counterpartyName` 换成仓库名称。

### 2. 前端类型 — 新增 `RefOrder` 类型

**文件**：`web/src/types/index.ts`

```typescript
export interface RefOrder {
  type: string;
  orderNo: string;
  status: string;
  counterpartyName: string;
  totalAmount: string;
}
```

并在 `InventoryLog` 中增加 `refOrder?: RefOrder`。

### 3. 前端 — 日志 Modal 增加单据列和操作按钮

**文件**：`web/src/pages/inventory/index.tsx`

**当前列**：类型 | 数量 | 变动前 | 变动后 | 时间 | 备注

**改造后列**：类型 | 数量 | 变动前 | 变动后 | 关联单据 | 时间 | 备注 | 操作

| 列 | 内容 |
|----|------|
| 关联单据（新增） | 显示 `refOrder.orderNo` + `refOrder.counterpartyName`，无关联单据时显示 "-" |
| 操作（新增） | 有 `refOrder` 时显示"查看详情"按钮，点击跳转对应路由；无可关联单据时隐藏 |

**路由映射**：
```typescript
const refTypeRouteMap: Record<string, string> = {
  PURCHASE_ORDER: '/purchases/',
  SALE_ORDER: '/sales/',
  TRANSFER: '/transfers/',
  STOCKTAKE: '/stocktakes/',
};
```

### 4. 前端 — 日志 Modal 加分页

**文件**：`web/src/pages/inventory/index.tsx`

**当前**：`showLogs` 写死 `limit=50`，Modal 内无分页控件

**改造**：日志 Modal 内加上分页组件，复用后端已有的分页能力

### 不变的内容

- 日志 Modal 的打开/关闭逻辑不变
- 后端 `GET /api/inventory/logs` 的路由、参数不变
- 前端 `showLogs` 函数签名不变（仍按 `productId` 查询）
- Dashboard、库存主列表不受影响

## 验收标准

- [ ] 库存日志弹窗中，每行能显示关联的采购单号/销售单号
- [ ] 点击"查看详情"能正确跳转到对应的单据详情页
- [ ] 无关联单据的日志（如早期数据）正常显示 "-" 且无按钮
- [ ] 日志弹窗支持分页
