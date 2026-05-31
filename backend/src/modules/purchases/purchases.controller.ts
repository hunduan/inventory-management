import { Controller, Get, Post, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PurchasesService } from './purchases.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto, ReceiveItemDto } from './dto/update-purchase.dto';

@ApiTags('采购')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/purchases')
export class PurchasesController {
  constructor(private purchasesService: PurchasesService) {}

  @Get()
  @ApiOperation({ summary: '采购单列表' })
  async findAll(@TenantId() tenantId: string, @Query() query: any) {
    return this.purchasesService.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: '采购单详情' })
  async findById(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.purchasesService.findById(tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: '创建采购单' })
  async create(@TenantId() tenantId: string, @CurrentUser() user: any, @Body() dto: CreatePurchaseDto) {
    return this.purchasesService.create(tenantId, user.id, dto);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: '确认采购单' })
  async confirm(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.purchasesService.confirm(tenantId, id);
  }

  @Post(':id/receive')
  @ApiOperation({ summary: '采购入库' })
  async receive(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.purchasesService.receive(tenantId, id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: '作废采购单' })
  async cancel(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.purchasesService.cancel(tenantId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: '编辑采购单（仅 DRAFT/CONFIRMED）' })
  async update(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdatePurchaseDto) {
    return this.purchasesService.update(tenantId, id, dto);
  }

  @Post(':id/receive-item')
  @ApiOperation({ summary: '单行入库' })
  async receiveItem(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: ReceiveItemDto) {
    return this.purchasesService.receiveItem(tenantId, id, dto.itemId, dto.quantity);
  }
}
