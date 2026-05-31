import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: QueryProductDto) {
    const where: any = { tenantId };
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { barcode: { contains: query.search } },
        { sku: { contains: query.search } },
      ];
    }
    if (query.categoryId) where.categoryId = query.categoryId;

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where, include: { category: true }, skip, take: limit, orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { data: items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(tenantId: string, id: string) {
    const product = await this.prisma.product.findFirst({ where: { id, tenantId }, include: { category: true } });
    if (!product) throw new NotFoundException('商品不存在');
    return product;
  }

  async findByBarcode(tenantId: string, barcode: string) {
    return this.prisma.product.findFirst({ where: { tenantId, barcode } });
  }

  async create(tenantId: string, dto: CreateProductDto) {
    return this.prisma.product.create({
      data: { ...dto, tenantId, salePrice: dto.salePrice || 0, costPrice: dto.costPrice || 0 } as any,
    });
  }

  async update(tenantId: string, id: string, dto: UpdateProductDto) {
    const result = await this.prisma.product.updateMany({ where: { id, tenantId }, data: dto as any });
    if (result.count === 0) throw new NotFoundException('商品不存在');
    return this.findById(tenantId, id);
  }

  async remove(tenantId: string, id: string) {
    const result = await this.prisma.product.updateMany({ where: { id, tenantId }, data: { enabled: false } });
    if (result.count === 0) throw new NotFoundException('商品不存在');
    return this.findById(tenantId, id);
  }
}
