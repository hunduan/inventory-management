import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class WarehousesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: { search?: string; page?: number; limit?: number }) {
    const where: any = { tenantId };
    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
      ];
    }
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.warehouse.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
      this.prisma.warehouse.count({ where }),
    ]);
    return { data: items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findTree(tenantId: string) {
    const warehouses = await this.prisma.warehouse.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
    const map = new Map<string, any>();
    const roots: any[] = [];
    for (const w of warehouses) {
      map.set(w.id, { ...w, children: [] });
    }
    for (const w of map.values()) {
      if (w.parentId && map.has(w.parentId)) {
        map.get(w.parentId)!.children.push(w);
      } else {
        roots.push(w);
      }
    }
    return roots;
  }

  async findById(tenantId: string, id: string) {
    const item = await this.prisma.warehouse.findFirst({
      where: { id, tenantId },
      include: { parent: true, children: true },
    });
    if (!item) throw new NotFoundException('仓库不存在');
    return item;
  }

  async create(tenantId: string, data: { name: string; parentId?: string; address?: string }) {
    if (data.parentId) {
      const parent = await this.prisma.warehouse.findFirst({ where: { id: data.parentId, tenantId } });
      if (!parent) throw new BadRequestException('父级仓库不存在');
    }
    return this.prisma.warehouse.create({ data: { ...data, tenantId } });
  }

  async update(tenantId: string, id: string, data: { name?: string; parentId?: string; address?: string }) {
    if (data.parentId === id) throw new BadRequestException('不能将自己设为父级仓库');
    if (data.parentId) {
      const parent = await this.prisma.warehouse.findFirst({ where: { id: data.parentId, tenantId } });
      if (!parent) throw new BadRequestException('父级仓库不存在');
      const descendants = await this.getDescendantIds(tenantId, id);
      if (descendants.has(data.parentId)) throw new BadRequestException('不能将子级仓库设为父级');
    }
    const result = await this.prisma.warehouse.updateMany({ where: { id, tenantId }, data });
    if (result.count === 0) throw new NotFoundException('仓库不存在');
    return this.findById(tenantId, id);
  }

  async remove(tenantId: string, id: string) {
    const children = await this.prisma.warehouse.count({ where: { parentId: id, tenantId, enabled: true } });
    if (children > 0) throw new BadRequestException('该仓库下有子仓库，无法删除');
    const result = await this.prisma.warehouse.updateMany({ where: { id, tenantId }, data: { enabled: false } });
    if (result.count === 0) throw new NotFoundException('仓库不存在');
    return this.findById(tenantId, id);
  }

  private async getDescendantIds(tenantId: string, id: string): Promise<Set<string>> {
    const all = await this.prisma.warehouse.findMany({ where: { tenantId }, select: { id: true, parentId: true } });
    const childrenMap = new Map<string, string[]>();
    for (const w of all) {
      if (w.parentId) {
        const list = childrenMap.get(w.parentId) || [];
        list.push(w.id);
        childrenMap.set(w.parentId, list);
      }
    }
    const result = new Set<string>();
    const stack = [id];
    while (stack.length > 0) {
      const current = stack.pop()!;
      const kids = childrenMap.get(current) || [];
      for (const kid of kids) {
        result.add(kid);
        stack.push(kid);
      }
    }
    return result;
  }
}
