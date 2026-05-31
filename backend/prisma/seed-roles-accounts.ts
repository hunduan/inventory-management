import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/inout_dev?schema=public' });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('开始创建采购/销售角色和账号...\n');

  const tenants = await prisma.tenant.findMany();
  console.log(`找到 ${tenants.length} 个租户\n`);

  for (const tenant of tenants) {
    console.log(`━━━ ${tenant.name} (${tenant.slug}) ━━━`);

    let purchaserRole = await prisma.role.findFirst({
      where: { tenantId: tenant.id, name: '采购员' },
    });
    if (!purchaserRole) {
      purchaserRole = await prisma.role.create({
        data: {
          tenantId: tenant.id,
          name: '采购员',
          permissions: ['purchases:read', 'purchases:create', 'purchases:update'],
        },
      });
      console.log(`  ✅ 角色: ${purchaserRole.name}`);
    } else {
      await prisma.role.update({
        where: { id: purchaserRole.id },
        data: { permissions: ['purchases:read', 'purchases:create', 'purchases:update'] },
      });
      console.log(`  ✅ 角色已存在: ${purchaserRole.name}`);
    }

    let salesRole = await prisma.role.findFirst({
      where: { tenantId: tenant.id, name: '销售员' },
    });
    if (!salesRole) {
      salesRole = await prisma.role.create({
        data: {
          tenantId: tenant.id,
          name: '销售员',
          permissions: ['sales:read', 'sales:create', 'sales:update'],
        },
      });
      console.log(`  ✅ 角色: ${salesRole.name}`);
    } else {
      await prisma.role.update({
        where: { id: salesRole.id },
        data: { permissions: ['sales:read', 'sales:create', 'sales:update'] },
      });
      console.log(`  ✅ 角色已存在: ${salesRole.name}`);
    }

    // Fix admin role to use correct permission format
    const adminRole = await prisma.role.findFirst({
      where: { tenantId: tenant.id, name: 'admin' },
    });
    if (adminRole) {
      await prisma.role.update({
        where: { id: adminRole.id },
        data: {
          permissions: [
            'products:read', 'products:create', 'products:update', 'products:delete',
            'purchases:read', 'purchases:create', 'purchases:update', 'purchases:delete',
            'sales:read', 'sales:create', 'sales:update', 'sales:delete',
            'inventory:read', 'inventory:update',
            'warehouses:read', 'warehouses:create', 'warehouses:update', 'warehouses:delete',
            'stocktakes:read', 'stocktakes:create', 'stocktakes:update', 'stocktakes:delete',
            'transfers:read', 'transfers:create', 'transfers:update', 'transfers:delete',
            'reports:read',
            'users:read', 'users:create', 'users:update', 'users:delete',
            'roles:read', 'roles:create', 'roles:update', 'roles:delete',
          ],
        },
      });
      console.log('  ✅ 修复 admin 角色权限格式');
    }

    const passwordHash = bcrypt.hashSync('test123', 10);
    const emailSuffix = tenant.slug === 'demo' ? 'demo.com' : `${tenant.slug}.com`;
    const prefix = tenant.slug === 'demo' ? '' : `${tenant.slug}-`;

    const purchaserEmail = `${prefix}purchase@${emailSuffix}`;
    const existingPurchaser = await prisma.user.findFirst({ where: { tenantId: tenant.id, email: purchaserEmail } });
    if (!existingPurchaser) {
      await prisma.user.create({
        data: {
          tenantId: tenant.id, email: purchaserEmail, passwordHash, name: '采购员', roleId: purchaserRole.id,
        },
      });
      console.log(`  ✅ 账号: ${purchaserEmail} / test123`);
    } else {
      console.log(`  ⏭️  账号已存在: ${purchaserEmail}`);
    }

    const salesEmail = `${prefix}sales@${emailSuffix}`;
    const existingSales = await prisma.user.findFirst({ where: { tenantId: tenant.id, email: salesEmail } });
    if (!existingSales) {
      await prisma.user.create({
        data: {
          tenantId: tenant.id, email: salesEmail, passwordHash, name: '销售员', roleId: salesRole.id,
        },
      });
      console.log(`  ✅ 账号: ${salesEmail} / test123`);
    } else {
      console.log(`  ⏭️  账号已存在: ${salesEmail}`);
    }

    console.log('');
  }

  console.log('所有采购/销售角色和账号创建完成!');
  console.log('══════════════════════════════════════');
  console.log('新账号登录信息:');
  console.log('  purchase@demo.com / test123');
  console.log('  sales@demo.com / test123');
  console.log('  test-a-purchase@test-a.com / test123');
  console.log('  test-a-sales@test-a.com / test123');
  console.log('  test-b-purchase@test-b.com / test123');
  console.log('  test-b-sales@test-b.com / test123');
  console.log('══════════════════════════════════════');
}

main()
  .catch((e) => {
    console.error('创建失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
