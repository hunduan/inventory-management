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
  async getAlerts(@TenantId() tenantId: string, @Query('threshold') threshold?: string) {
    return this.inventoryService.getAlerts(tenantId, threshold ? parseInt(threshold, 10) : 10);
  }

  @Get('logs')
  @ApiOperation({ summary: '库存变动记录' })
  async getLogs(@TenantId() tenantId: string, @Query() query: any) {
    return this.inventoryService.getLogs(tenantId, query);
  }
}
