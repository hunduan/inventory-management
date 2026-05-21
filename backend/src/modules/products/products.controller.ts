import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';

@ApiTags('商品')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: '商品列表' })
  async findAll(@TenantId() tenantId: string, @Query() query: QueryProductDto) {
    return this.productsService.findAll(tenantId, query);
  }

  @Get('barcode/:barcode')
  @ApiOperation({ summary: '按条码查询' })
  async findByBarcode(@TenantId() tenantId: string, @Param('barcode') barcode: string) {
    return this.productsService.findByBarcode(tenantId, barcode);
  }

  @Get(':id')
  @ApiOperation({ summary: '商品详情' })
  async findById(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.productsService.findById(tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: '创建商品' })
  async create(@TenantId() tenantId: string, @Body() dto: CreateProductDto) {
    return this.productsService.create(tenantId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新商品' })
  async update(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除商品' })
  async remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.productsService.remove(tenantId, id);
  }
}
