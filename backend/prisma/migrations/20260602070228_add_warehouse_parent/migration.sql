-- AlterTable
ALTER TABLE "warehouses" ADD COLUMN     "parent_id" UUID;

-- AddForeignKey
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
