import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { StocktakeService } from './stocktake.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateStocktakeDto } from './dto/create-stocktake.dto';

@ApiTags('盘点')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/stocktakes')
export class StocktakeController {
  constructor(private stocktakeService: StocktakeService) {}

  @Get()
  @ApiOperation({ summary: '盘点单列表' })
  async findAll(@TenantId() tenantId: string, @Query() query: any) {
    return this.stocktakeService.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: '盘点单详情' })
  async findById(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.stocktakeService.findById(tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: '创建盘点单' })
  async create(@TenantId() tenantId: string, @CurrentUser() user: any, @Body() dto: CreateStocktakeDto) {
    return this.stocktakeService.create(tenantId, user.id, dto);
  }

  @Post(':id/start')
  @ApiOperation({ summary: '开始盘点' })
  async start(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.stocktakeService.start(tenantId, id);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: '完成盘点' })
  async complete(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.stocktakeService.complete(tenantId, id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: '作废盘点单' })
  async cancel(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.stocktakeService.cancel(tenantId, id);
  }
}
