import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SuppliersService } from './suppliers.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('供应商')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/suppliers')
export class SuppliersController {
  constructor(private suppliersService: SuppliersService) {}

  @Get()
  @ApiOperation({ summary: '供应商列表' })
  async findAll(@TenantId() tenantId: string, @Query() query: { search?: string; page?: number; limit?: number }) {
    return this.suppliersService.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: '供应商详情' })
  async findById(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.suppliersService.findById(tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: '创建供应商' })
  async create(@TenantId() tenantId: string, @Body() data: { name: string; phone?: string; email?: string; address?: string; contact?: string; remark?: string }) {
    return this.suppliersService.create(tenantId, data);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新供应商' })
  async update(@TenantId() tenantId: string, @Param('id') id: string, @Body() data: any) {
    return this.suppliersService.update(tenantId, id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除供应商' })
  async remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.suppliersService.remove(tenantId, id);
  }
}
