-- Migration: Fix orderNo per-tenant uniqueness + add tenantId to StocktakeItem
-- Date: 2026-05-27

-- 1. PurchaseOrder: drop global unique on orderNo, add per-tenant unique
ALTER TABLE "purchase_orders" DROP CONSTRAINT IF EXISTS "purchase_orders_order_no_key";
CREATE UNIQUE INDEX IF NOT EXISTS "purchase_orders_tenant_id_order_no_key"
  ON "purchase_orders" ("tenant_id", "order_no");

-- 2. SaleOrder: drop global unique on orderNo, add per-tenant unique
ALTER TABLE "sale_orders" DROP CONSTRAINT IF EXISTS "sale_orders_order_no_key";
CREATE UNIQUE INDEX IF NOT EXISTS "sale_orders_tenant_id_order_no_key"
  ON "sale_orders" ("tenant_id", "order_no");

-- 3. StocktakeItem: add tenantId column, backfill from parent stocktake
ALTER TABLE "stocktake_items" ADD COLUMN IF NOT EXISTS "tenant_id" UUID;

UPDATE "stocktake_items" si
   SET "tenant_id" = s."tenant_id"
  FROM "stocktakes" s
 WHERE si."stocktake_id" = s."id"
   AND si."tenant_id" IS NULL;

ALTER TABLE "stocktake_items" ALTER COLUMN "tenant_id" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "stocktake_items_tenant_id_idx"
  ON "stocktake_items" ("tenant_id");

-- Add FK constraint
ALTER TABLE "stocktake_items"
  ADD CONSTRAINT "stocktake_items_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;
