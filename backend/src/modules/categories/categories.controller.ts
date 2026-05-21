import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';

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
  async create(@TenantId() tenantId: string, @Body() data: { name: string; parentId?: string; sortOrder?: number }) {
    return this.categoriesService.create(tenantId, data);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新分类' })
  async update(@TenantId() tenantId: string, @Param('id') id: string, @Body() data: any) {
    return this.categoriesService.update(tenantId, id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除分类' })
  async remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.categoriesService.remove(tenantId, id);
  }
}
