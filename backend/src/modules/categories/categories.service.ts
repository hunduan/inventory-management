import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.category.findMany({
      where: { tenantId },
      orderBy: { sortOrder: 'asc' },
      include: { attributes: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async create(tenantId: string, data: { name: string; parentId?: string; sortOrder?: number }) {
    return this.prisma.category.create({ data: { ...data, tenantId } });
  }

  async update(tenantId: string, id: string, data: { name?: string; parentId?: string; sortOrder?: number }) {
    const result = await this.prisma.category.updateMany({ where: { id, tenantId }, data });
    if (result.count === 0) throw new NotFoundException('分类不存在');
    return this.findById(tenantId, id);
  }

  async findById(tenantId: string, id: string) {
    const item = await this.prisma.category.findFirst({
      where: { id, tenantId },
      include: { attributes: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!item) throw new NotFoundException('分类不存在');
    return item;
  }

  async remove(tenantId: string, id: string) {
    const result = await this.prisma.category.deleteMany({ where: { id, tenantId } });
    if (result.count === 0) throw new NotFoundException('分类不存在');
  }

  // === Attribute CRUD ===

  async findAttributes(tenantId: string, categoryId: string) {
    await this.findById(tenantId, categoryId);
    return this.prisma.categoryAttribute.findMany({
      where: { tenantId, categoryId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createAttribute(tenantId: string, categoryId: string, data: { name: string; fieldType?: string; options?: string[]; required?: boolean; sortOrder?: number }) {
    await this.findById(tenantId, categoryId);
    return this.prisma.categoryAttribute.create({
      data: { ...data, tenantId, categoryId },
    });
  }

  async updateAttribute(tenantId: string, categoryId: string, id: string, data: { name?: string; fieldType?: string; options?: string[]; required?: boolean; sortOrder?: number }) {
    const result = await this.prisma.categoryAttribute.updateMany({ where: { id, tenantId, categoryId }, data });
    if (result.count === 0) throw new NotFoundException('属性不存在');
    return this.prisma.categoryAttribute.findFirst({ where: { id, tenantId } });
  }

  async removeAttribute(tenantId: string, categoryId: string, id: string) {
    const result = await this.prisma.categoryAttribute.deleteMany({ where: { id, tenantId, categoryId } });
    if (result.count === 0) throw new NotFoundException('属性不存在');
  }

  async reorderAttributes(tenantId: string, categoryId: string, ids: string[]) {
    await this.findById(tenantId, categoryId);
    await Promise.all(
      ids.map((id, index) =>
        this.prisma.categoryAttribute.updateMany({
          where: { id, tenantId, categoryId },
          data: { sortOrder: index },
        }),
      ),
    );
    return this.findAttributes(tenantId, categoryId);
  }
}
