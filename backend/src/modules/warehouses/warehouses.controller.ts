import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { WarehousesService } from './warehouses.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';

@ApiTags('仓库')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/warehouses')
export class WarehousesController {
  constructor(private warehousesService: WarehousesService) {}

  @Get()
  @ApiOperation({ summary: '仓库列表' })
  async findAll(@TenantId() tenantId: string, @Query() query: { search?: string; page?: number; limit?: number }) {
    return this.warehousesService.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: '仓库详情' })
  async findById(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.warehousesService.findById(tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: '创建仓库' })
  async create(@TenantId() tenantId: string, @Body() dto: CreateWarehouseDto) {
    return this.warehousesService.create(tenantId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新仓库' })
  async update(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdateWarehouseDto) {
    return this.warehousesService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除仓库' })
  async remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.warehousesService.remove(tenantId, id);
  }
}
