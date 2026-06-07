import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Res, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { StocktakeService } from './stocktake.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateStocktakeDto } from './dto/create-stocktake.dto';
import { UpdateStocktakeItemDto, CompleteStocktakeDto } from './dto/update-stocktake.dto';
import { Response } from 'express';

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

  @Get('import-template')
  @ApiOperation({ summary: '下载盘点导入模板' })
  async downloadTemplate(@TenantId() tenantId: string, @Res() res: Response) {
    const buffer = await this.stocktakeService.getImportTemplate(tenantId);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=stocktake-import-template.xlsx');
    res.send(buffer);
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

  @Post(':id/import')
  @ApiOperation({ summary: '导入盘点数据' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async importExcel(@TenantId() tenantId: string, @Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('请上传Excel文件');
    return this.stocktakeService.importFromExcel(tenantId, id, file);
  }

  @Post(':id/start')
  @ApiOperation({ summary: '开始盘点' })
  async start(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.stocktakeService.start(tenantId, id);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: '完成盘点' })
  async complete(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto?: CompleteStocktakeDto) {
    return this.stocktakeService.complete(tenantId, id, dto?.items);
  }

  @Patch(':id/items/:itemId')
  @ApiOperation({ summary: '更新盘点项实际数量' })
  async updateItem(@TenantId() tenantId: string, @Param('id') id: string, @Param('itemId') itemId: string, @Body() dto: UpdateStocktakeItemDto) {
    return this.stocktakeService.updateItem(tenantId, id, itemId, dto.actualQuantity);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: '作废盘点单' })
  async cancel(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.stocktakeService.cancel(tenantId, id);
  }
}
