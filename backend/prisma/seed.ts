import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/inout_dev?schema=public' });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 开始填充种子数据...');

  // 1. 创建租户
  const tenant = await prisma.tenant.create({
    data: {
      name: '演示企业',
      slug: 'demo',
    },
  });
  console.log(`✅ 租户: ${tenant.name}`);

  // 2. 创建角色
  const adminRole = await prisma.role.create({
    data: {
      tenantId: tenant.id,
      name: 'admin',
      permissions: JSON.stringify(['purchase.*', 'sale.*', 'inventory.*', 'product.*', 'report.*', 'setting.*']),
    },
  });
  console.log(`✅ 角色: ${adminRole.name}`);

  // 3. 创建管理员用户
  const passwordHash = bcrypt.hashSync('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'admin@demo.com',
      passwordHash,
      name: '管理员',
      roleId: adminRole.id,
    },
  });
  console.log(`✅ 管理员: ${admin.email} / admin123`);

  // 4. 创建分类
  const categories = await Promise.all([
    prisma.category.create({ data: { tenantId: tenant.id, name: '酒水饮料', sortOrder: 1 } }),
    prisma.category.create({ data: { tenantId: tenant.id, name: '休闲食品', sortOrder: 2 } }),
    prisma.category.create({ data: { tenantId: tenant.id, name: '粮油调味', sortOrder: 3 } }),
    prisma.category.create({ data: { tenantId: tenant.id, name: '日用百货', sortOrder: 4 } }),
  ]);
  console.log(`✅ 分类: ${categories.length} 个`);

  // 5. 创建商品
  const products = await Promise.all([
    prisma.product.create({ data: { tenantId: tenant.id, categoryId: categories[0].id, name: '茅台飞天53度', barcode: '6901234567890', sku: 'MT-001', unit: '瓶', salePrice: 2800, costPrice: 2200 } }),
    prisma.product.create({ data: { tenantId: tenant.id, categoryId: categories[0].id, name: '五粮液普五52度', barcode: '6901234567891', sku: 'WLY-001', unit: '瓶', salePrice: 1200, costPrice: 900 } }),
    prisma.product.create({ data: { tenantId: tenant.id, categoryId: categories[0].id, name: '青岛啤酒经典10听装', barcode: '6901234567892', sku: 'QD-001', unit: '箱', salePrice: 65, costPrice: 48 } }),
    prisma.product.create({ data: { tenantId: tenant.id, categoryId: categories[0].id, name: '农夫山泉550ml', barcode: '6901234567893', sku: 'NFSQ-001', unit: '瓶', salePrice: 2, costPrice: 1.2 } }),
    prisma.product.create({ data: { tenantId: tenant.id, categoryId: categories[1].id, name: '乐事薯片大包装', barcode: '6901234567894', sku: 'LS-001', unit: '包', salePrice: 12, costPrice: 8 } }),
    prisma.product.create({ data: { tenantId: tenant.id, categoryId: categories[1].id, name: '奥利奥饼干大盒装', barcode: '6901234567895', sku: 'AL-001', unit: '盒', salePrice: 18, costPrice: 13 } }),
    prisma.product.create({ data: { tenantId: tenant.id, categoryId: categories[1].id, name: '良品铺子坚果礼盒', barcode: '6901234567896', sku: 'LPPZ-001', unit: '盒', salePrice: 88, costPrice: 60 } }),
    prisma.product.create({ data: { tenantId: tenant.id, categoryId: categories[2].id, name: '金龙鱼花生油5L', barcode: '6901234567897', sku: 'JLY-001', unit: '桶', salePrice: 89, costPrice: 72 } }),
    prisma.product.create({ data: { tenantId: tenant.id, categoryId: categories[2].id, name: '十月稻田五常大米10kg', barcode: '6901234567898', sku: 'SYDT-001', unit: '袋', salePrice: 68, costPrice: 52 } }),
    prisma.product.create({ data: { tenantId: tenant.id, categoryId: categories[3].id, name: '维达抽纸3层100抽', barcode: '6901234567899', sku: 'WD-001', unit: '包', salePrice: 3.5, costPrice: 2.2 } }),
  ]);
  console.log(`✅ 商品: ${products.length} 个`);

  // 6. 创建仓库
  const warehouses = await Promise.all([
    prisma.warehouse.create({ data: { tenantId: tenant.id, name: '总仓', address: '北京市朝阳区XX路100号' } }),
    prisma.warehouse.create({ data: { tenantId: tenant.id, name: '分仓一', address: '上海市浦东新区XX路200号' } }),
  ]);
  console.log(`✅ 仓库: ${warehouses.length} 个`);

  // 7. 创建供应商
  const suppliers = await Promise.all([
    prisma.supplier.create({ data: { tenantId: tenant.id, name: '贵州茅台经销商', phone: '13800138001', contact: '张经理' } }),
    prisma.supplier.create({ data: { tenantId: tenant.id, name: '四川五粮液代理', phone: '13800138002', contact: '李经理' } }),
    prisma.supplier.create({ data: { tenantId: tenant.id, name: '青岛啤酒华北总代', phone: '13800138003', contact: '王经理' } }),
  ]);
  console.log(`✅ 供应商: ${suppliers.length} 个`);

  // 8. 创建客户
  const customers = await Promise.all([
    prisma.customer.create({ data: { tenantId: tenant.id, name: '老王烟酒店', phone: '13900139001', address: '北京市海淀区XX街' } }),
    prisma.customer.create({ data: { tenantId: tenant.id, name: '小李便利店', phone: '13900139002', address: '北京市西城区XX路' } }),
    prisma.customer.create({ data: { tenantId: tenant.id, name: '张记超市', phone: '13900139003', address: '北京市丰台区XX小区' } }),
  ]);
  console.log(`✅ 客户: ${customers.length} 个`);

  // 9. 创建采购单（已入库）
  const po1 = await prisma.purchaseOrder.create({
    data: {
      tenantId: tenant.id, orderNo: 'PO20260521-001',
      supplierId: suppliers[0].id, warehouseId: warehouses[0].id,
      totalAmount: 2200 * 5, status: 'RECEIVED', createdBy: admin.id,
      items: { create: [{ tenantId: tenant.id, productId: products[0].id, quantity: 5, unitCost: 2200, subtotal: 2200 * 5 }] },
    },
  });

  const po2 = await prisma.purchaseOrder.create({
    data: {
      tenantId: tenant.id, orderNo: 'PO20260521-002',
      supplierId: suppliers[1].id, warehouseId: warehouses[0].id,
      totalAmount: 900 * 10 + 48 * 20, status: 'RECEIVED', createdBy: admin.id,
      items: {
        create: [
          { tenantId: tenant.id, productId: products[1].id, quantity: 10, unitCost: 900, subtotal: 900 * 10 },
          { tenantId: tenant.id, productId: products[2].id, quantity: 20, unitCost: 48, subtotal: 48 * 20 },
        ],
      },
    },
  });

  const po3 = await prisma.purchaseOrder.create({
    data: {
      tenantId: tenant.id, orderNo: 'PO20260521-003',
      supplierId: suppliers[0].id, warehouseId: warehouses[1].id,
      totalAmount: 2200 * 3, status: 'DRAFT', createdBy: admin.id,
      items: { create: [{ tenantId: tenant.id, productId: products[0].id, quantity: 3, unitCost: 2200, subtotal: 2200 * 3 }] },
    },
  });
  console.log(`✅ 采购单: 3 个 (${po1.status}, ${po2.status}, ${po3.status})`);

  // 10. 创建库存（根据已入库采购单）
  await prisma.inventory.create({ data: { tenantId: tenant.id, productId: products[0].id, warehouseId: warehouses[0].id, quantity: 5, unitCost: 2200 } });
  await prisma.inventory.create({ data: { tenantId: tenant.id, productId: products[1].id, warehouseId: warehouses[0].id, quantity: 10, unitCost: 900 } });
  await prisma.inventory.create({ data: { tenantId: tenant.id, productId: products[2].id, warehouseId: warehouses[0].id, quantity: 20, unitCost: 48 } });
  // 给其他商品加一些初始库存
  await prisma.inventory.create({ data: { tenantId: tenant.id, productId: products[3].id, warehouseId: warehouses[0].id, quantity: 200, unitCost: 1.2 } });
  await prisma.inventory.create({ data: { tenantId: tenant.id, productId: products[4].id, warehouseId: warehouses[0].id, quantity: 50, unitCost: 8 } });
  await prisma.inventory.create({ data: { tenantId: tenant.id, productId: products[5].id, warehouseId: warehouses[0].id, quantity: 30, unitCost: 13 } });
  await prisma.inventory.create({ data: { tenantId: tenant.id, productId: products[6].id, warehouseId: warehouses[0].id, quantity: 15, unitCost: 60 } });
  await prisma.inventory.create({ data: { tenantId: tenant.id, productId: products[7].id, warehouseId: warehouses[0].id, quantity: 25, unitCost: 72 } });
  await prisma.inventory.create({ data: { tenantId: tenant.id, productId: products[8].id, warehouseId: warehouses[0].id, quantity: 40, unitCost: 52 } });
  await prisma.inventory.create({ data: { tenantId: tenant.id, productId: products[9].id, warehouseId: warehouses[0].id, quantity: 100, unitCost: 2.2 } });
  // 分仓库存
  await prisma.inventory.create({ data: { tenantId: tenant.id, productId: products[0].id, warehouseId: warehouses[1].id, quantity: 2, unitCost: 2300 } });
  await prisma.inventory.create({ data: { tenantId: tenant.id, productId: products[3].id, warehouseId: warehouses[1].id, quantity: 100, unitCost: 1.2 } });
  console.log(`✅ 库存记录: 12 条`);

  // 11. 创建销售单（已发货）
  const so1 = await prisma.saleOrder.create({
    data: {
      tenantId: tenant.id, orderNo: 'SO20260521-001',
      customerId: customers[0].id, warehouseId: warehouses[0].id,
      totalAmount: 2800 * 1, status: 'DELIVERED', createdBy: admin.id,
      items: { create: [{ tenantId: tenant.id, productId: products[0].id, quantity: 1, unitPrice: 2800, unitCost: 2200, subtotal: 2800 * 1 }] },
    },
  });

  const so2 = await prisma.saleOrder.create({
    data: {
      tenantId: tenant.id, orderNo: 'SO20260521-002',
      customerId: customers[1].id, warehouseId: warehouses[0].id,
      totalAmount: 65 * 2 + 12 * 5, status: 'CONFIRMED', createdBy: admin.id,
      items: {
        create: [
          { tenantId: tenant.id, productId: products[2].id, quantity: 2, unitPrice: 65, unitCost: 48, subtotal: 65 * 2 },
          { tenantId: tenant.id, productId: products[4].id, quantity: 5, unitPrice: 12, unitCost: 8, subtotal: 12 * 5 },
        ],
      },
    },
  });
  console.log(`✅ 销售单: 2 个 (${so1.status}, ${so2.status})`);

  // 12. 更新库存（扣减已发货的销售单）
  await prisma.inventory.updateMany({ where: { tenantId: tenant.id, productId: products[0].id, warehouseId: warehouses[0].id }, data: { quantity: { decrement: 1 } } });
  await prisma.inventoryLog.create({ data: { tenantId: tenant.id, productId: products[0].id, warehouseId: warehouses[0].id, type: 'SALE_OUT', quantity: -1, beforeQty: 5, afterQty: 4, refId: so1.id, refType: 'SALE_ORDER' } });

  console.log('\n🎉 种子数据填充完成!');
  console.log('──────────────────────────────────────');
  console.log('登录信息:');
  console.log('  邮箱: admin@demo.com');
  console.log('  密码: admin123');
  console.log('──────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('❌ 种子数据填充失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
