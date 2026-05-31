# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

进销存管理系统 — Multi-tenant inventory management system. Two frontends (H5 web backend + WeChat mini program) sharing one NestJS API.

## Tech Stack

| Layer | Tech |
|-------|------|
| Backend | NestJS 11 + TypeScript |
| ORM | Prisma 7 + PostgreSQL |
| Auth | JWT (passport-jwt) |
| H5 Web | Vite 8 + React 19 + Ant Design 6 + Zustand 5 + React Router 7 |
| Mini Program | WeChat native (WXML/WXSS/TS) — Taro 4 (旧, client/) |

## Ant Design 6 Icon Rules

Ant Design 6 (`@ant-design/icons` v6) 移除了部分旧版图标，使用前务必确认存在性：

| 已知已移除 | 替代方案 |
|-----------|---------|
| `BuildingOutlined` | `HomeOutlined` 或 `ShopOutlined` |
| `ApiOutlined` | `CloudServerOutlined` |
| `ContainerOutlined` | `FolderOutlined` |

**预防措施**：
- 使用新图标前，先 `grep` 确认 `node_modules/@ant-design/icons/es/index.js` 中存在该导出
- 如果 build 报 `MISSING_EXPORT` 错误，说明图标已被移除，换一个同类图标
- 不确定时优先用基础图标（`HomeOutlined`、`ShopOutlined`、`TeamOutlined`、`SettingOutlined`），这些长期稳定

## Commands

### Backend (`backend/`)

```bash
npm run build          # tsc (NOT nest build — TypeScript 6 incompatibility)
npm run start          # node dist/main
npm run start:dev      # build then watch (tsc && node --watch dist/main)
npx prisma migrate dev         # Apply dev migrations
npx prisma migrate reset       # Reset DB (requires PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION=true)
npx prisma generate            # Re-generate client
npm run seed                   # Seed demo data
```

### Frontend (`client/`)

```bash
npm run dev:h5         # H5 dev server (watch mode)
npm run build:h5       # H5 production build → dist/h5
npm run dev:weapp      # WeChat mini program dev (watch mode)
npm run build:weapp    # WeChat mini program build → dist/weapp
```

## Architecture

### Backend — NestJS Modules (`backend/src/modules/`)

```
auth/          Login, register, JWT strategy
products/      CRUD, barcode search, category filter
categories/    CRUD
suppliers/     CRUD
customers/     CRUD
warehouses/    CRUD
purchases/     Status machine: DRAFT → CONFIRMED → RECEIVED (→ cancelled)
sales/         Status machine: DRAFT → CONFIRMED → DELIVERED (→ cancelled)
inventory/     Stock query, alerts, history logs
stocktake/     DRAFT → IN_PROGRESS → COMPLETED (→ cancelled)
transfers/     DRAFT → CONFIRMED → COMPLETED (→ cancelled)
reports/       Purchase/sale/profit reports with date range
upload/        File upload (image: jpeg/png/gif/webp, audio: mpeg/wav/ogg/mp4)
tenants/       Tenant CRUD
users/         User CRUD
```

Key backend patterns:
- **Multi-tenant isolation**: Every table has `tenantId`. All queries filter by it. `@TenantId()` decorator extracts tenant from JWT.
- **TOCTOU prevention**: Updates use `updateMany({ where: { id, tenantId } })` — count check on result.
- **Soft delete**: Products/categories/suppliers/customers/warehouses use `enabled: false`.
- **Global RolesGuard**: Checks permissions from DB role, applied via `APP_GUARD`.
- **API prefix**: All routes under `/api/`, Swagger at `/api/docs`.
- **Prisma 7**: `prisma.config.ts` at project root, `PrismaPg` adapter, no `url` in schema datasource block.

### Frontend — Structure (`client/src/`)

```
app.tsx                         # App wrapper
app.config.ts                   # Route registrations (plain object export)
app.less                        # Global styles + CSS variables + layout system
components/
  layout/app-shell.tsx          # Web page layout: sidebar + topbar + content area
  ui/KpiCard.tsx                # KPI metric card component
  ui/EmptyState.tsx             # Centered empty-state message
pages/
  web/                          # H5 management backend (13 pages)
  mini/                         # WeChat mini program (10 pages)
services/                       # API client wrappers (one per backend module)
store/auth.ts                   # Zustand auth store
utils/request.ts                # Taro.request wrapper, JWT header injection, 401 redirect
```

### Frontend Layout System

Web pages use `<AppShell>` which renders:
1. **Sidebar** (72px, collapsed by default): Logo icon + single-character nav initials (`.nav-initial`)
2. **Topbar**: Page title (derived from `PAGE_TITLES` map) + user avatar chip
3. **Content area**: Child content inside `<View className="main-content">`

The layout is defined in `app.less` using `.layout` (flex container), `.sidebar`, `.main-area` CSS classes. Responsive at 960px: sidebar becomes bottom nav bar, topbar hides.

### Frontend Design System (CSS variables in `app.less`)

```
--primary: #0f766e    --primary-hover: #0d9488
--bg: #f5f5f4         --surface: #ffffff
--text: #1c1917       --text-secondary: #78716c   --text-muted: #a8a29e
--border: #e7e5e4     --success: #16a34a          --warning: #d97706     --danger: #dc2626
```

Key CSS utility classes:
- `.card` — white surface + border-radius + border
- `.input-field` — styled input with focus ring
- `.badge`, `.badge-success`, `.badge-warning`, `.badge-danger`, `.badge-info` — status labels
- `.section-header` — page title row (flex, space-between)
- `.section-header-title` — bold heading inside section-header
- `.button-primary` — teal pill button
- `.button-secondary` — white outlined pill button
- `.form-grid` — auto-fit responsive form grid
- `.page-enter` — fadeInUp entrance animation

### Frontend Page Patterns

**List pages** (products, purchases, sales, inventory):
1. `<AppShell>` → `.section-header` with title + count + action button
2. Filter bar in `.card p-4 mb-6` (search input + dropdown pickers)
3. Data table in `.card overflow-hidden` (header row + data rows with bottom borders)
4. Pagination row (prev / page N of M / next)

**Dashboard**: quick action cards (`.card-grid` 4-column) → KPI row (3 `KpiCard`s) → two-column recent orders

**Mini pages**: standalone layouts (no AppShell). Teal header bar + `.card` content blocks.

### API Client Pattern

Each `services/*.ts` exports an object with methods:
```typescript
export const purchasesApi = {
  list: (params: string) => api.get(`/purchases?${params}`),
  getById: (id: string) => api.get(`/purchases/${id}`),
  create: (data: any) => api.post('/purchases', data),
  confirm: (id: string) => api.post(`/purchases/${id}/confirm`),
  // ...
};
```

`utils/request.ts` provides `api.get/post/patch/delete()`. It injects `Authorization: Bearer <token>` and handles 401 → redirect to login (platform-aware via `process.env.TARO_ENV`).

### Auth Flow

1. Login → `authApi.login()` → JWT token + user object
2. Stored in Zustand (`useAuthStore.setAuth()`) + `Taro.setStorageSync()`
3. On app start: `store/auth.ts:init()` reads from storage
4. 401 responses trigger `Taro.removeStorageSync('token')` + `Taro.reLaunch()` to login page

## WeChat Mini Program

- `project.config.json` at client root with `miniprogramRoot: "./dist/weapp"`
- `project.private.config.json` for local dev settings (urlCheck: false for localhost)
- Build output: `dist/weapp/` — open `client/` in WeChat DevTools
- Mini pages: login, index (home), scan, voice, photo, purchase, sale, orders (list+detail), products, inventory
- API_BASE_URL defined in `config/index.ts` via `defineConstants` — update for production HTTPS domain

## Taro Mini Program CSS Constraints

These constraints apply to WeChat mini program builds (`TARO_ENV=weapp`), NOT H5 builds:

| What NOT to use | Why | Alternative |
|----------------|-----|-------------|
| `display: 'flex'` in inline style | Compiled to empty string by Taro | Use `className="flex-row"` (defined in `app.less`) or omit `display`, only use `flexDirection: 'row'` |
| `paddingHorizontal`, `paddingVertical` | Not in Taro CSSProperties type | Use individual `paddingLeft/Right/Top/Bottom` |
| `shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius` | Not in Taro CSSProperties type | Use `boxShadow: '0 2px 8px rgba(0,0,0,0.06)'` |
| `gap` in flex layouts | May not render in mini program | Use `marginLeft`/`marginTop` on child elements instead |

General rule: **Prefer CSS classes over inline styles for layout properties.** Define reusable classes in `app.less`. See `.flex-row`, `.flex-col`, `.flex-1` utility classes already defined.

## Database

PostgreSQL on localhost:5432, database `inout_dev`. Default seed credentials: `admin@demo.com` / `admin123`.

Connection string format: `postgresql://postgres:postgres@localhost:5432/inout_dev?schema=public`
