import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('租户')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/tenants')
export class TenantsController {
  constructor(private tenantsService: TenantsService) {}

  @Get()
  @ApiOperation({ summary: '获取租户信息' })
  async getProfile(@TenantId() tenantId: string) {
    return this.tenantsService.findById(tenantId);
  }

  @Patch()
  @ApiOperation({ summary: '更新租户信息' })
  async update(@TenantId() tenantId: string, @Body() data: { name?: string; logo?: string }) {
    return this.tenantsService.update(tenantId, data);
  }

  @Get('admin/all')
  @ApiOperation({ summary: '管理员获取所有租户' })
  async findAll(@Query() query: { search?: string; page?: number; limit?: number }) {
    return this.tenantsService.findAll(query);
  }

  @Post('admin')
  @ApiOperation({ summary: '管理员创建租户' })
  async create(@Body() data: { name: string; slug: string; logo?: string }) {
    return this.tenantsService.create(data);
  }

  @Delete('admin/:id')
  @ApiOperation({ summary: '管理员禁用租户' })
  async remove(@Param('id') id: string) {
    return this.tenantsService.remove(id);
  }
}
