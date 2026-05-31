# 功能需求描述指南

## 库存预警功能实现解析

### 后端核心逻辑

库存预警在 `backend/src/modules/inventory/inventory.service.ts:33-46`：

```typescript
async getAlerts(tenantId, threshold = 10, page = 1, limit = 20) {
  const where = { tenantId, quantity: { lte: threshold } };
  // 直接查询 Inventory 表，筛选 quantity <= threshold 的记录
  // 没有独立的预警表，没有定时任务，数据实时计算
}
```

**数据流**：每次入库/出库/调拨操作更新 `Inventory.quantity` → 查询时实时过滤 `quantity <= threshold` → 返回分页结果

**路由**：`inventory.controller.ts` — `GET /api/inventory/alerts?threshold=10&page=1&limit=20`

**完整链路**：
```
首页"库存预警"卡片点击
  → 跳转 /inventory?alerts=1（?alerts=1 触发预警模式）
  → 调用 GET /api/inventory/alerts
  → 后端查 Inventory 表 quantity <= 10 的记录
  → 返回 { data, total, page, limit, totalPages }
  → 前端表格渲染预警列表
```

---

## 如何准确描述功能需求

### 常见问题

| 问题类型 | 示例 | 后果 |
|---------|------|------|
| 只说现象不说范围 | "不显示" | 分不清是后端挂、API 格式不对、还是前端崩溃 |
| 多需求揉一句 | "加接口+绑定按钮+加切换按钮" | 容易遗漏，依赖关系不清晰 |
| 模糊动词 | "加一个接口"、"绑定"、"显示" | 缺少具体行为定义 |

### 需求描述公式

```
在 [哪个页面/模块]，[什么用户操作]，期望 [什么结果]
如果 [边界情况] 则 [如何处理]
数据从 [哪里来]，提交到 [哪里去]
```

### 示例对比

**❌ 原来的描述**：
> "后端需要加一个库存预警筛选的接口，并且绑定到首页的库存管理按钮，在库存管理模块的最上面加一个显示库存预警的按钮"

**✅ 优化的描述**：
> ## 功能：库存预警筛选与导航
>
> ### 1. 后端 API 分页改造
> - **位置**：`GET /api/inventory/alerts`
> - **当前**：返回扁平数组，前端无法分页
> - **目标**：支持 page/limit 参数，返回 `{ data, total, page, limit, totalPages }`
> - **过滤条件**：`quantity <= threshold`（默认 10），按数量升序
>
> ### 2. 首页预警卡片可点击
> - **位置**：`web/src/pages/dashboard/index.tsx` 库存预警 Card
> - **当前**：不可点击
> - **目标**：点击跳转 `/inventory?alerts=1`，鼠标悬浮变指针
>
> ### 3. 库存页添加预警切换按钮
> - **位置**：`web/src/pages/inventory/index.tsx` 筛选栏
> - **功能**：点击切换到预警模式（调用 alerts API），再次点击恢复列表
> - **URL 同步**：`?alerts=1` 自动添加/移除
> - **保留筛选**：切换模式时保留仓库筛选

### 参考模板

````markdown
## 功能：[名称]

### 1. [改动项]
- **位置**：文件路径或路由
- **当前行为**：
- **目标行为**：
- **边界条件**：

### 2. [改动项]
- **位置**：
- **当前问题**：
- **改造要求**：
- **数据流**：

> **验收标准**：
> - [ ] 条件 A 正常显示
> - [ ] 条件 B 有正确错误提示
> - [ ] 边界情况 C 不崩溃
````

### 关键原则

1. **指明位置** — 知道文件路径直接写，不知道说页面位置
2. **区分数据和 UI** — 调用哪个 API、响应格式、按钮位置分开描述
3. **说清状态变化** — 点击后表格/URL/按钮状态各自怎么变
4. **加验收标准** — 2-3 条可验证的条件判断是否做完
5. **一句一事** — 一个"并且"拆成一个列表项
