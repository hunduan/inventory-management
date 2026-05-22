# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

进销存管理系统 — Multi-tenant inventory management system. Web management backend + WeChat mini program.

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Taro 4 + React 18 + TypeScript + Tailwind CSS |
| Backend | NestJS 11 + TypeScript |
| ORM | Prisma 7 + PostgreSQL |
| Auth | JWT (passport-jwt) |
| Frontend State | Zustand 4 |

## Commands

### Backend (`backend/`)

```bash
# Build (use tsc, NOT nest build — TypeScript 6 incompatibility)
npm run build          # tsc

# Run
npm run start          # node dist/main
npm run start:dev      # build then watch (tsc && node --watch dist/main)

# Database (Prisma 7 — requires prisma.config.ts, uses @prisma/adapter-pg)
npx prisma migrate dev         # Apply dev migrations
npx prisma migrate reset       # Reset DB (requires env var: PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION=true)
npx prisma generate            # Re-generate client
npm run seed                   # Seed demo data

# Database URL format (for prisma.config.ts):
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/inout_dev?schema=public
```

### Frontend (`client/`)

```bash
# Taro 4 uses 'h5' platform type (NOT 'web')
npm run dev:h5         # Start H5 dev server (watch mode)
npm run build:h5       # Production build
npm run dev:weapp      # WeChat mini program dev
npm run build:weapp    # WeChat mini program build
```

## Code Architecture

### Backend — NestJS Module Structure

```
backend/src/
  main.ts                          # Entry: CORS, ValidationPipe, Swagger
  app.module.ts                    # Root module, registers all feature modules
  common/
    decorators/                    # @TenantId(), @Permissions() decorators
    filters/http-exception.filter.ts   # Global exception filter (统一错误响应)
    guards/roles.guard.ts          # Global permission guard (check DB role permissions)
    prisma/prisma.service.ts       # PrismaClient with PrismaPg adapter
  modules/
    auth/                          # Login, register, JWT strategy
    products/                      # CRUD, barcode search, category filter
    categories/                    # CRUD
    suppliers/                     # CRUD
    customers/                     # CRUD
    warehouses/                    # CRUD
    purchases/                     # PO flow: DRAFT → CONFIRMED → RECEIVED → cancels
    sales/                         # SO flow: DRAFT → CONFIRMED → DELIVERED → cancels
    inventory/                     # Stock query, logs
    stocktake/                     # DRAFT → IN_PROGRESS → COMPLETED → cancels
    transfers/                     # DRAFT → CONFIRMED → COMPLETED → cancels
    reports/                       # Dashboard stats, purchase/sale/profit reports
    upload/                        # File upload (images: jpeg/png/gif/webp, audio: mpeg/wav/ogg/mp4)
    tenants/
    users/
```

### Backend Key Patterns

- **Multi-tenant isolation**: Every table has `tenantId` field. All queries filter by `tenantId`. The `@TenantId()` decorator extracts tenant from JWT.
- **TOCTOU prevention**: All updates use `updateMany({ where: { id, tenantId } })` with `result.count === 0` check — atomic tenant validation.
- **Soft delete**: Products, categories, suppliers, customers, warehouses use `enabled: false` instead of hard delete.
- **Status machine**: PurchaseOrder/SaleOrder/Stocktake/Transfer use enum status with controlled transitions.
- **Global guards**: `RolesGuard` checks permissions from DB role, applied globally via `APP_GUARD`.
- **API prefix**: All routes under `/api/` with Swagger docs at `/api/docs`.
- **Prisma 7 specifics**: Requires `prisma.config.ts` at project root, `PrismaPg` adapter in constructor, no `url` in schema `datasource` block.

### Frontend — Taro 4 Structure

```
client/src/
  app.tsx                           # App wrapper (renders this.props.children)
  app.config.ts                     # Route/page registrations (plain export, no @tarojs/taro import)
  app.less                          # Global styles
  components/layout/app-shell.tsx   # Shared page layout (header + content)
  pages/
    web/                            # H5 (management backend) pages
    mini/                           # WeChat mini program pages (scan/voice/photo input)
  services/                         # API client wrappers per module (uses utils/request.ts)
  store/auth.ts                     # Zustand auth store (token, user, login/logout/init)
  utils/request.ts                  # Taro.request wrapper with JWT header injection
```

### Frontend Key Patterns

- **API client**: `services/*.ts` files export objects with methods that call `api.get/post/patch/delete()` from `utils/request.ts`. The request utility injects `Authorization: Bearer <token>` header and handles 401 redirects.
- **Auth flow**: Login stores token + user via Zustand `useAuthStore` and `Taro.setStorageSync`. Auth state is initialized from storage at app start via `store/auth.ts:init()`.
- **Taro 4 specifics**: Platform type is `h5` (not `web`). Config exports plain objects. Requires `babel.config.js` with `babel-preset-taro`. Webpack 5.90.x (not 5.91+ — ProgressPlugin API incompatibility).
- **Layout**: All web pages wrap content in `<AppShell>`, which renders the header bar and content area with Tailwind classes.

## Important Prisma 7 Notes

- Schema `datasource` block has NO `url` property — connection string goes in `prisma.config.ts`
- Client uses `PrismaPg` adapter: `new PrismaPg({ connectionString: DATABASE_URL })`
- `migrate diff` uses `--to-schema` flag (NOT `--to-schema-datamodel`)
- Reset requires env: `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION=true`

## Database

PostgreSQL on localhost:5432, database `inout_dev`. Default seed credentials: `admin@demo.com` / `admin123`.
