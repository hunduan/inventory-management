import { Controller, Get, Post, Patch, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateCategoryAttributeDto } from './dto/create-attribute.dto';
import { UpdateCategoryAttributeDto } from './dto/update-attribute.dto';

@ApiTags('分类')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/categories')
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: '分类列表' })
  async findAll(@TenantId() tenantId: string) {
    return this.categoriesService.findAll(tenantId);
  }

  @Post()
  @ApiOperation({ summary: '创建分类' })
  async create(@TenantId() tenantId: string, @Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(tenantId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新分类' })
  async update(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除分类' })
  async remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.categoriesService.remove(tenantId, id);
  }

  // === Attribute Routes ===

  @Get(':categoryId/attributes')
  @ApiOperation({ summary: '分类属性列表' })
  async findAttributes(@TenantId() tenantId: string, @Param('categoryId') categoryId: string) {
    return this.categoriesService.findAttributes(tenantId, categoryId);
  }

  @Post(':categoryId/attributes')
  @ApiOperation({ summary: '创建分类属性' })
  async createAttribute(@TenantId() tenantId: string, @Param('categoryId') categoryId: string, @Body() dto: CreateCategoryAttributeDto) {
    return this.categoriesService.createAttribute(tenantId, categoryId, dto);
  }

  @Patch(':categoryId/attributes/:id')
  @ApiOperation({ summary: '更新分类属性' })
  async updateAttribute(@TenantId() tenantId: string, @Param('categoryId') categoryId: string, @Param('id') id: string, @Body() dto: UpdateCategoryAttributeDto) {
    return this.categoriesService.updateAttribute(tenantId, categoryId, id, dto);
  }

  @Delete(':categoryId/attributes/:id')
  @ApiOperation({ summary: '删除分类属性' })
  async removeAttribute(@TenantId() tenantId: string, @Param('categoryId') categoryId: string, @Param('id') id: string) {
    return this.categoriesService.removeAttribute(tenantId, categoryId, id);
  }

  @Put(':categoryId/attributes/reorder')
  @ApiOperation({ summary: '排序分类属性' })
  async reorderAttributes(@TenantId() tenantId: string, @Param('categoryId') categoryId: string, @Body() ids: string[]) {
    return this.categoriesService.reorderAttributes(tenantId, categoryId, ids);
  }
}
