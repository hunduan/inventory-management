import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: { search?: string; page?: number; limit?: number }) {
    const where: any = {};
    if (query?.search) {
      where.OR = [
        { name: { contains: query.search } },
        { slug: { contains: query.search } },
      ];
    }
    const page = Number(query?.page) || 1;
    const limit = Number(query?.limit) || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.tenant.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.tenant.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('租户不存在');
    return tenant;
  }

  async create(data: { name: string; slug: string; logo?: string }) {
    const existing = await this.prisma.tenant.findUnique({ where: { slug: data.slug } });
    if (existing) throw new ConflictException('该标识已被使用');
    return this.prisma.tenant.create({ data });
  }

  async update(id: string, data: { name?: string; logo?: string }) {
    const result = await this.prisma.tenant.updateMany({ where: { id }, data });
    if (result.count === 0) throw new NotFoundException('租户不存在');
    return this.findById(id);
  }

  async remove(id: string) {
    const result = await this.prisma.tenant.updateMany({ where: { id }, data: { enabled: false } });
    if (result.count === 0) throw new NotFoundException('租户不存在');
    return this.findById(id);
  }
}
