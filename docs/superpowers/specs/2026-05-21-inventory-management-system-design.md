---
name: inventory-management-system-design
description: 简易进销存管理系统设计文档 — 多租户、Web + 微信小程序、语音/扫码/拍照输入
---

# 进销存管理系统设计文档

## 1. 概述

面向小企业主的简易进销存管理系统，支持多租户完全隔离，提供 Web 管理后台和微信小程序快捷操作入口，支持语音、扫码、拍照三种简便输入方式。

## 2. 技术栈

| 层级 | 技术选型 | 说明 |
|------|---------|------|
| 前端框架 | Taro + React + TypeScript | 一套代码编译 Web + 微信小程序 |
| UI 组件 | Tailwind CSS + shadcn/ui | Web 端管理后台 |
| 后端 | NestJS + TypeScript | 模块化架构，支持多租户 |
| ORM | Prisma | 类型安全，支持 PostgreSQL RLS |
| 数据库 | PostgreSQL | RLS 天然支持多租户完全隔离 |
| 缓存 | Redis | 会话管理、缓存加速 |
| 对象存储 | 阿里云 OSS / 腾讯 COS | 商品图片、单据照片存储 |
| 语音识别 | Web Speech API (Web) / 微信语音识别 (小程序) | 免费方案 |
| 扫码 | html5-qrcode (Web) / wx.scanCode (小程序) | 成熟方案 |
| OCR | 阿里云 OCR / PaddleOCR | 拍照单据/商品识别 |

## 3. 系统架构

```
客户端层
  ├── Web App (Taro 编译) — 管理后台
  └── 微信小程序 (Taro 编译) — 快捷操作入口
        │
        ▼ HTTPS / JWT
  API 网关 (Nginx/Caddy)
  ─ 鉴权 / 限流 / 多租户识别
        │
        ▼
  NestJS 后端服务
  ├── 采购模块
  ├── 销售模块
  ├── 库存模块
  ├── 基础数据模块
  ├── 报表模块
  ├── 财务模块 (后期)
  ├── 用户权限模块
  └── 文件服务模块 (图片/单据)
        │
  ┌─────┼──────────┐
  ▼     ▼          ▼
PG   Redis     对象存储
RLS          (商品图片/
多租户        单据照片)
```

## 4. 多租户设计

### 隔离策略

- **完全隔离** — 每个租户数据完全独立
- **实现方式**: PostgreSQL Row-Level Security (RLS)
- 所有业务表带 `tenant_id` 字段
- JWT token 中携带 `tenant_id`
- RLS 策略自动过滤，后端代码无需写 `WHERE tenant_id = ?`

### RLS 示例

```sql
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON products
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

### 表结构

- **租户**: tenants (id, name, slug, logo, created_at)
- **用户**: users (id, tenant_id, email, password_hash, role_id, ...)
- **角色**: roles (id, tenant_id, name, permissions(jsonb))
- **商品**: products (id, tenant_id, category_id, name, barcode, sku, unit, sale_price, cost_price, image_url, specs(jsonb), enabled)
- **分类**: categories (id, tenant_id, name, parent_id, sort_order)
- **仓库**: warehouses (id, tenant_id, name, address)
- **供应商**: suppliers (id, tenant_id, name, phone, contact)
- **客户**: customers (id, tenant_id, name, phone)
- **库存**: inventory (id, tenant_id, product_id, warehouse_id, quantity, unit_cost)
- **采购单**: purchase_orders (id, tenant_id, order_no, supplier_id, total_amount, status, created_by, ...)
- **采购明细**: purchase_items (id, purchase_order_id, product_id, quantity, unit_cost, subtotal)
- **销售单**: sale_orders (id, tenant_id, order_no, customer_id, total_amount, status, ...)
- **销售明细**: sale_items (id, sale_order_id, product_id, quantity, unit_price, subtotal)
- **盘点单**: stocktake_orders (id, tenant_id, warehouse_id, status, ...)
- **盘点明细**: stocktake_items (id, stocktake_order_id, product_id, book_qty, actual_qty, diff_qty)
- **调拨单**: transfer_orders (id, tenant_id, from_warehouse_id, to_warehouse_id, status, ...)
- **调拨明细**: transfer_items (id, transfer_order_id, product_id, quantity)

## 5. 模块功能

### 5.1 采购管理
- 采购单创建/编辑/审核/作废
- 采购入库（影响库存）
- 采购退货
- 供应商管理

### 5.2 销售管理
- 销售单创建/编辑/审核/作废
- 销售出库（影响库存）
- 销售退货
- 客户管理

### 5.3 库存管理
- 库存查询（按商品/仓库筛选）
- 库存盘点（创建盘点单 → 录入实盘 → 生成盈亏）
- 库存调拨（仓库间转移）
- 库存预警（低于安全库存提醒）

### 5.4 基础数据
- 商品管理（CRUD + 批量导入）
- 分类管理
- 供应商管理
- 仓库管理
- 客户管理

### 5.5 报表中心
- 采购报表（按供应商/商品/时间统计）
- 销售报表（按客户/商品/时间统计）
- 库存报表（库存周转、呆滞分析）
- 利润统计（毛利/净利）

### 5.6 用户权限
- 租户内多用户
- 基于角色的权限控制（RBAC）
- 权限粒度: 模块级（采购/销售/库存/报表）

### 5.7 财务管理（后期）
- 应收应付
- 收支流水
- 利润核算

## 6. 前端页面结构

### Web 管理后台

```
/login
/register
/dashboard                    — 工作台
/purchases                    — 采购管理
/purchases/new               — 新建采购单
/purchases/:id               — 采购单详情
/purchases/returns           — 采购退货
/sales                        — 销售管理
/sales/new                   — 新建销售单
/sales/:id                   — 销售单详情
/sales/returns               — 销售退货
/inventory                    — 库存管理
/inventory/query             — 库存查询
/inventory/stocktake         — 库存盘点
/inventory/transfer          — 库存调拨
/products                     — 商品管理
/categories                   — 分类管理
/suppliers                    — 供应商管理
/warehouses                   — 仓库管理
/customers                    — 客户管理
/reports/purchases           — 采购报表
/reports/sales               — 销售报表
/reports/inventory           — 库存报表
/reports/profit              — 利润统计
/settings                     — 系统设置
/settings/users              — 用户管理
/settings/roles              — 角色管理
```

### 微信小程序页面

```
pages/index/index             — 首页（快捷操作入口）
pages/scan/index             — 扫码录入
pages/voice/index            — 语音录入
pages/photo/index            — 拍照录入
pages/purchase/new           — 快速入库
pages/sale/new               — 快速出库
pages/inventory/query        — 库存查询
pages/orders/list            — 单据列表
pages/orders/detail          — 单据详情
```

## 7. 三种输入方式

### 7.1 扫码
- **Web**: html5-qrcode 库调用摄像头扫描条码 → 匹配商品信息 → 自动填入表单
- **小程序**: wx.scanCode 原生扫码 → 匹配商品信息 → 自动填入表单

### 7.2 语音
- **Web**: Web Speech API SpeechRecognition → 语音转文字 → NLP 解析（操作+商品+数量+价格）→ 自动填入表单
- **小程序**: 微信录音 + 语音识别 → NLP 解析 → 自动填入表单

### 7.3 拍照
- **Web**: MediaDevices.getUserMedia 拍照 → 上传 → OCR 识别（阿里云OCR/PaddleOCR）→ 提取商品信息
- **小程序**: wx.chooseMedia 拍照/选图 → 上传 → OCR 识别 → 提取商品信息

## 8. 数据流示例: 采购入库

```
用户语音 "进10箱茅台，单价2800"
  → 语音转文字
  → NLP 解析: {type: "采购入库", product: "茅台", quantity: "10箱", unit_price: 2800}
  → 模糊匹配商品库，找到茅台 (1箱=6瓶)
  → 生成采购单草稿
  → 用户确认
  → 提交 → 后端创建采购单 + 采购明细
  → 确认入库 → 更新库存 (inventory.quantity += 60)
  → 记录库存流水
```

## 9. 验收标准

- [x] 多租户完全隔离，数据互不可见
- [ ] Web 端管理后台可正常使用全部进销存功能
- [ ] 微信小程序端支持快捷扫码/语音/拍照录入
- [ ] 语音输入可正确解析中文自然语言（商品+数量+价格）
- [ ] 扫码可识别常见商品条码（EAN-13, Code128, QR）
- [ ] 拍照 OCR 可识别商品标签/单据文字
- [ ] 库存变动自动记录流水，可追溯
- [ ] 报表数据准确
