import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/inout_dev?schema=public' });
const prisma = new PrismaClient({ adapter });

async function createTenantData(tenantSlug: string, tenantName: string, email: string, password: string) {
  const existing = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
  if (existing) {
    console.log(`⏭️  租户 ${tenantName} (${tenantSlug}) 已存在，跳过`);
    return;
  }

  const tenant = await prisma.tenant.create({ data: { name: tenantName, slug: tenantSlug } });
  console.log(`✅ 租户: ${tenant.name}`);

  const adminRole = await prisma.role.create({
    data: {
      tenantId: tenant.id, name: 'admin',
      permissions: JSON.stringify(['purchase.*', 'sale.*', 'inventory.*', 'product.*', 'report.*', 'setting.*']),
    },
  });

  const passwordHash = bcrypt.hashSync(password, 10);
  const admin = await prisma.user.create({
    data: { tenantId: tenant.id, email, passwordHash, name: '管理员', roleId: adminRole.id },
  });
  console.log(`✅ 用户: ${email} / ${password}`);

  const categories = await Promise.all([
    prisma.category.create({ data: { tenantId: tenant.id, name: '酒水饮料', sortOrder: 1 } }),
    prisma.category.create({ data: { tenantId: tenant.id, name: '休闲食品', sortOrder: 2 } }),
    prisma.category.create({ data: { tenantId: tenant.id, name: '粮油调味', sortOrder: 3 } }),
    prisma.category.create({ data: { tenantId: tenant.id, name: '日用百货', sortOrder: 4 } }),
  ]);
  console.log(`✅ 分类: ${categories.length} 个`);

  const tenantProducts = tenantSlug === 'test-a'
    ? [
        { name: '可口可乐330ml', barcode: '7901234567801', sku: 'KKL-001', unit: '罐', salePrice: 3, costPrice: 2, catIdx: 0 },
        { name: '百威啤酒500ml听装', barcode: '7901234567802', sku: 'BW-001', unit: '罐', salePrice: 8, costPrice: 5, catIdx: 0 },
        { name: '康师傅红烧牛肉面', barcode: '7901234567803', sku: 'KSF-001', unit: '桶', salePrice: 5, costPrice: 3.5, catIdx: 1 },
        { name: '伊利纯牛奶250ml', barcode: '7901234567804', sku: 'YL-001', unit: '盒', salePrice: 3.5, costPrice: 2.5, catIdx: 1 },
        { name: '海天酱油500ml', barcode: '7901234567805', sku: 'HT-001', unit: '瓶', salePrice: 10, costPrice: 7, catIdx: 2 },
      ]
    : [
        { name: '百事可乐330ml', barcode: '7901234567901', sku: 'BS-001', unit: '罐', salePrice: 3, costPrice: 2, catIdx: 0 },
        { name: '哈尔滨啤酒500ml', barcode: '7901234567902', sku: 'HEB-001', unit: '罐', salePrice: 6, costPrice: 4, catIdx: 0 },
        { name: '统一老坛酸菜面', barcode: '7901234567903', sku: 'TY-001', unit: '桶', salePrice: 4.5, costPrice: 3, catIdx: 1 },
        { name: '蒙牛纯牛奶250ml', barcode: '7901234567904', sku: 'MN-001', unit: '盒', salePrice: 3.5, costPrice: 2.5, catIdx: 1 },
        { name: '李锦记生抽500ml', barcode: '7901234567905', sku: 'LJJ-001', unit: '瓶', salePrice: 9, costPrice: 6, catIdx: 2 },
      ];

  const products = await Promise.all(
    tenantProducts.map((p) =>
      prisma.product.create({
        data: {
          tenantId: tenant.id, categoryId: categories[p.catIdx].id,
          name: p.name, barcode: p.barcode, sku: p.sku, unit: p.unit,
          salePrice: p.salePrice, costPrice: p.costPrice,
        },
      })
    )
  );
  console.log(`✅ 商品: ${products.length} 个`);

  const warehouseNames = tenantSlug === 'test-a'
    ? [{ name: '北京总仓', address: '北京市大兴区XX物流园' }, { name: '广州分仓', address: '广州市白云区XX路' }]
    : [{ name: '上海中心仓', address: '上海市青浦区XX路' }, { name: '深圳分仓', address: '深圳市宝安区XX街' }];

  const warehouses = await Promise.all(
    warehouseNames.map((w) => prisma.warehouse.create({ data: { tenantId: tenant.id, ...w } }))
  );
  console.log(`✅ 仓库: ${warehouses.length} 个`);

  const supplierNames = tenantSlug === 'test-a'
    ? [{ name: '北京食品批发商', phone: '13800001001', contact: '赵经理' }, { name: '广州饮料代理商', phone: '13800001002', contact: '钱经理' }]
    : [{ name: '上海粮油供应商', phone: '13800002001', contact: '孙经理' }, { name: '深圳百货批发商', phone: '13800002002', contact: '周经理' }];

  const suppliers = await Promise.all(
    supplierNames.map((s) => prisma.supplier.create({ data: { tenantId: tenant.id, ...s } }))
  );
  console.log(`✅ 供应商: ${suppliers.length} 个`);

  const customerNames = tenantSlug === 'test-a'
    ? [{ name: '朝阳区烟酒超市', phone: '13900001001', address: '北京市朝阳区' }, { name: '海淀区社区便利店', phone: '13900001002', address: '北京市海淀区' }]
    : [{ name: '浦东新区超市', phone: '13900002001', address: '上海市浦东新区' }, { name: '南山区便利店', phone: '13900002002', address: '深圳市南山区' }];

  const customers = await Promise.all(
    customerNames.map((c) => prisma.customer.create({ data: { tenantId: tenant.id, ...c } }))
  );
  console.log(`✅ 客户: ${customers.length} 个`);

  const po1 = await prisma.purchaseOrder.create({
    data: {
      tenantId: tenant.id, orderNo: `PO20260531-001-${tenantSlug.toUpperCase()}`,
      supplierId: suppliers[0].id, warehouseId: warehouses[0].id,
      totalAmount: Number(products[0].costPrice) * 100, status: 'RECEIVED', createdBy: admin.id,
      items: {
        create: [
          { tenantId: tenant.id, productId: products[0].id, quantity: 100, unitCost: products[0].costPrice, subtotal: Number(products[0].costPrice) * 100 },
          { tenantId: tenant.id, productId: products[1].id, quantity: 50, unitCost: products[1].costPrice, subtotal: Number(products[1].costPrice) * 50 },
        ],
      },
    },
  });

  const po2 = await prisma.purchaseOrder.create({
    data: {
      tenantId: tenant.id, orderNo: `PO20260531-002-${tenantSlug.toUpperCase()}`,
      supplierId: suppliers[0].id, warehouseId: warehouses[1].id,
      totalAmount: Number(products[2].costPrice) * 30, status: 'DRAFT', createdBy: admin.id,
      items: {
        create: [
          { tenantId: tenant.id, productId: products[2].id, quantity: 30, unitCost: products[2].costPrice, subtotal: Number(products[2].costPrice) * 30 },
        ],
      },
    },
  });
  console.log(`✅ 采购单: 2 个 (${po1.status}, ${po2.status})`);

  const invRecords = [
    { productIdx: 0, whIdx: 0, qty: 100, cost: products[0].costPrice },
    { productIdx: 1, whIdx: 0, qty: 50, cost: products[1].costPrice },
    { productIdx: 2, whIdx: 0, qty: 60, cost: products[2].costPrice },
    { productIdx: 3, whIdx: 0, qty: 200, cost: products[3].costPrice },
    { productIdx: 4, whIdx: 0, qty: 80, cost: products[4].costPrice },
    { productIdx: 0, whIdx: 1, qty: 30, cost: products[0].costPrice },
    { productIdx: 3, whIdx: 1, qty: 100, cost: products[3].costPrice },
  ];
  await Promise.all(
    invRecords.map((r) =>
      prisma.inventory.create({
        data: {
          tenantId: tenant.id, productId: products[r.productIdx].id,
          warehouseId: warehouses[r.whIdx].id, quantity: r.qty, unitCost: Number(r.cost),
        },
      })
    )
  );
  console.log(`✅ 库存记录: ${invRecords.length} 条`);

  const so1 = await prisma.saleOrder.create({
    data: {
      tenantId: tenant.id, orderNo: `SO20260531-001-${tenantSlug.toUpperCase()}`,
      customerId: customers[0].id, warehouseId: warehouses[0].id,
      totalAmount: Number(products[0].salePrice) * 5 + Number(products[1].salePrice) * 3,
      status: 'DELIVERED', createdBy: admin.id,
      items: {
        create: [
          { tenantId: tenant.id, productId: products[0].id, quantity: 5, unitPrice: products[0].salePrice, unitCost: products[0].costPrice, subtotal: Number(products[0].salePrice) * 5 },
          { tenantId: tenant.id, productId: products[1].id, quantity: 3, unitPrice: products[1].salePrice, unitCost: products[1].costPrice, subtotal: Number(products[1].salePrice) * 3 },
        ],
      },
    },
  });

  const so2 = await prisma.saleOrder.create({
    data: {
      tenantId: tenant.id, orderNo: `SO20260531-002-${tenantSlug.toUpperCase()}`,
      customerId: customers[1].id, warehouseId: warehouses[0].id,
      totalAmount: Number(products[2].salePrice) * 10 + Number(products[3].salePrice) * 20,
      status: 'CONFIRMED', createdBy: admin.id,
      items: {
        create: [
          { tenantId: tenant.id, productId: products[2].id, quantity: 10, unitPrice: products[2].salePrice, unitCost: products[2].costPrice, subtotal: Number(products[2].salePrice) * 10 },
          { tenantId: tenant.id, productId: products[3].id, quantity: 20, unitPrice: products[3].salePrice, unitCost: products[3].costPrice, subtotal: Number(products[3].salePrice) * 20 },
        ],
      },
    },
  });
  console.log(`✅ 销售单: 2 个 (${so1.status}, ${so2.status})`);

  await prisma.inventory.updateMany({
    where: { tenantId: tenant.id, productId: products[0].id, warehouseId: warehouses[0].id },
    data: { quantity: { decrement: 5 } },
  });
  await prisma.inventory.updateMany({
    where: { tenantId: tenant.id, productId: products[1].id, warehouseId: warehouses[0].id },
    data: { quantity: { decrement: 3 } },
  });
}

async function main() {
  console.log('开始创建测试租户数据...\n');

  await createTenantData('test-a', '测试企业A', 'testA@demo.com', 'test123');
  await createTenantData('test-b', '测试企业B', 'testB@demo.com', 'test123');

  console.log('\n所有测试数据创建完成!');
  console.log('══════════════════════════════════════');
  console.log('登录信息:');
  console.log('  租户A 邮箱: testA@demo.com  密码: test123');
  console.log('  租户B 邮箱: testB@demo.com  密码: test123');
  console.log('══════════════════════════════════════');
  console.log('\n两个租户数据完全隔离，分别有独立的:');
  console.log('  - 仓库 (2个)');
  console.log('  - 商品 (5个)');
  console.log('  - 供应商 (2个)');
  console.log('  - 客户 (2个)');
  console.log('  - 采购单 (2个: 1已入库, 1草稿)');
  console.log('  - 销售单 (2个: 1已发货, 1已确认)');
  console.log('  - 库存记录');
  console.log('\n登录不同账号应看到完全不同的数据。');
}

main()
  .catch((e) => {
    console.error('创建失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
