import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('库存')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/inventory')
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Get()
  @ApiOperation({ summary: '库存列表' })
  async findAll(@TenantId() tenantId: string, @Query() query: any) {
    return this.inventoryService.findAll(tenantId, query);
  }

  @Get('alerts')
  @ApiOperation({ summary: '库存预警' })
  @ApiQuery({ name: 'threshold', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getAlerts(
    @TenantId() tenantId: string,
    @Query('threshold') threshold?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.inventoryService.getAlerts(
      tenantId,
      threshold ? parseInt(threshold, 10) : 10,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('logs')
  @ApiOperation({ summary: '库存变动记录' })
  async getLogs(@TenantId() tenantId: string, @Query() query: any) {
    return this.inventoryService.getLogs(tenantId, query);
  }

  @Get('history')
  @ApiOperation({ summary: '历史库存快照 — 查询指定日期的库存' })
  @ApiQuery({ name: 'date', required: true, type: String, description: '日期 ISO 字符串' })
  async getHistory(@TenantId() tenantId: string, @Query() query: any) {
    return this.inventoryService.getHistory(tenantId, query);
  }
}
