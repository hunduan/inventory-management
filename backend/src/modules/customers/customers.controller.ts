import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('客户')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/customers')
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @Get()
  @ApiOperation({ summary: '客户列表' })
  async findAll(@TenantId() tenantId: string, @Query() query: { search?: string; page?: number; limit?: number }) {
    return this.customersService.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: '客户详情' })
  async findById(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.customersService.findById(tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: '创建客户' })
  async create(@TenantId() tenantId: string, @Body() data: { name: string; phone?: string; email?: string; address?: string; contact?: string; remark?: string }) {
    return this.customersService.create(tenantId, data);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新客户' })
  async update(@TenantId() tenantId: string, @Param('id') id: string, @Body() data: any) {
    return this.customersService.update(tenantId, id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除客户' })
  async remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.customersService.remove(tenantId, id);
  }
}
