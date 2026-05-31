import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query?: { search?: string; page?: number; limit?: number }) {
    const where: any = { tenantId };
    if (query?.search) {
      where.OR = [
        { name: { contains: query.search } },
        { email: { contains: query.search } },
      ];
    }
    const page = Number(query?.page) || 1;
    const limit = Number(query?.limit) || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, phone: true, roleId: true, enabled: true, createdAt: true, updatedAt: true, role: true },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { data: items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(tenantId: string, id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId },
      select: { id: true, name: true, email: true, phone: true, roleId: true, enabled: true, createdAt: true, updatedAt: true, role: true },
    });
    if (!user) throw new NotFoundException('用户不存在');
    return user;
  }

  async create(tenantId: string, data: { email: string; password: string; name: string; phone?: string; roleId?: string }) {
    const existing = await this.prisma.user.findFirst({ where: { tenantId, email: data.email } });
    if (existing) throw new ConflictException('该邮箱已被使用');

    const passwordHash = await bcrypt.hash(data.password, 10);
    return this.prisma.user.create({
      data: {
        tenantId, email: data.email, passwordHash, name: data.name,
        phone: data.phone, roleId: data.roleId,
      },
      select: { id: true, name: true, email: true, phone: true, roleId: true, enabled: true, createdAt: true },
    });
  }

  async update(tenantId: string, id: string, data: { name?: string; email?: string; phone?: string; roleId?: string; enabled?: boolean }) {
    const result = await this.prisma.user.updateMany({ where: { id, tenantId }, data });
    if (result.count === 0) throw new NotFoundException('用户不存在');
    return this.findById(tenantId, id);
  }

  async remove(tenantId: string, id: string) {
    const result = await this.prisma.user.updateMany({ where: { id, tenantId }, data: { enabled: false } });
    if (result.count === 0) throw new NotFoundException('用户不存在');
    return this.findById(tenantId, id);
  }

  async assignRole(tenantId: string, id: string, roleId: string) {
    const result = await this.prisma.user.updateMany({ where: { id, tenantId }, data: { roleId } });
    if (result.count === 0) throw new NotFoundException('用户不存在');
    return this.findById(tenantId, id);
  }
}
