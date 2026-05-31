-- DropForeignKey
ALTER TABLE "stocktake_items" DROP CONSTRAINT "stocktake_items_tenant_id_fkey";

-- DropIndex
DROP INDEX "purchase_orders_order_no_key";

-- DropIndex
DROP INDEX "purchase_orders_tenant_id_order_no_key";

-- DropIndex
DROP INDEX "sale_orders_order_no_key";

-- DropIndex
DROP INDEX "sale_orders_tenant_id_order_no_key";

-- AlterTable
ALTER TABLE "purchase_items" ADD COLUMN     "received_qty" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "sale_items" ADD COLUMN     "delivered_qty" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "stocktake_items" ADD CONSTRAINT "stocktake_items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
