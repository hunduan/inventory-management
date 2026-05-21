import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
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
}
