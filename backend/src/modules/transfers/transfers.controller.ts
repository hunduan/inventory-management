import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TransfersService } from './transfers.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateTransferDto } from './dto/create-transfer.dto';

@ApiTags('调拨')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/transfers')
export class TransfersController {
  constructor(private transfersService: TransfersService) {}

  @Get()
  @ApiOperation({ summary: '调拨单列表' })
  async findAll(@TenantId() tenantId: string, @Query() query: any) {
    return this.transfersService.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: '调拨单详情' })
  async findById(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.transfersService.findById(tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: '创建调拨单' })
  async create(@TenantId() tenantId: string, @CurrentUser() user: any, @Body() dto: CreateTransferDto) {
    return this.transfersService.create(tenantId, user.id, dto);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: '确认调拨单' })
  async confirm(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.transfersService.confirm(tenantId, id);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: '完成调拨' })
  async complete(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.transfersService.complete(tenantId, id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: '作废调拨单' })
  async cancel(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.transfersService.cancel(tenantId, id);
  }
}
