import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('报表')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('purchases')
  @ApiOperation({ summary: '采购报表' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  async purchaseReport(
    @TenantId() tenantId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.purchaseReport(tenantId, new Date(startDate), new Date(endDate));
  }

  @Get('sales')
  @ApiOperation({ summary: '销售报表' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  async saleReport(
    @TenantId() tenantId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.saleReport(tenantId, new Date(startDate), new Date(endDate));
  }

  @Get('profit')
  @ApiOperation({ summary: '利润报表' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  async profitReport(
    @TenantId() tenantId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.profitReport(tenantId, new Date(startDate), new Date(endDate));
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Dashboard 汇总数据' })
  async dashboard(@TenantId() tenantId: string) {
    return this.reportsService.dashboard(tenantId);
  }

  @Get('inventory-value')
  @ApiOperation({ summary: '库存价值报表' })
  async inventoryValue(@TenantId() tenantId: string) {
    return this.reportsService.inventoryValue(tenantId);
  }
}
