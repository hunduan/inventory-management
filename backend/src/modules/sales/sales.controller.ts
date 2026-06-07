import { Controller, Get, Post, Put, Param, Body, Query, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto, DeliverItemDto } from './dto/update-sale.dto';
import { Response } from 'express';

@ApiTags('销售')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/sales')
export class SalesController {
  constructor(private salesService: SalesService) {}

  @Get()
  @ApiOperation({ summary: '销售单列表' })
  async findAll(@TenantId() tenantId: string, @Query() query: any) {
    return this.salesService.findAll(tenantId, query);
  }

  @Get('export')
  @ApiOperation({ summary: '导出销售单Excel' })
  async exportExcel(@TenantId() tenantId: string, @Query() query: any, @Res() res: Response) {
    const buffer = await this.salesService.exportExcel(tenantId, query);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=sales-${Date.now()}.xlsx`);
    res.send(buffer);
  }

  @Get(':id')
  @ApiOperation({ summary: '销售单详情' })
  async findById(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.salesService.findById(tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: '创建销售单' })
  async create(@TenantId() tenantId: string, @CurrentUser() user: any, @Body() dto: CreateSaleDto) {
    return this.salesService.create(tenantId, user.id, dto);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: '确认销售单' })
  async confirm(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.salesService.confirm(tenantId, id);
  }

  @Post(':id/deliver')
  @ApiOperation({ summary: '销售出库' })
  async deliver(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.salesService.deliver(tenantId, id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: '作废销售单' })
  async cancel(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.salesService.cancel(tenantId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: '编辑销售单（仅 DRAFT/CONFIRMED）' })
  async update(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdateSaleDto) {
    return this.salesService.update(tenantId, id, dto);
  }

  @Post(':id/deliver-item')
  @ApiOperation({ summary: '单行出库' })
  async deliverItem(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: DeliverItemDto) {
    return this.salesService.deliverItem(tenantId, id, dto.itemId, dto.quantity);
  }
}
