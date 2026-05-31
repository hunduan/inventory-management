import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('角色')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/roles')
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Get()
  @ApiOperation({ summary: '获取所有角色' })
  async findAll(@TenantId() tenantId: string) {
    return this.rolesService.findAll(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取角色详情' })
  async findById(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.rolesService.findById(tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: '创建角色' })
  async create(@TenantId() tenantId: string, @Body() dto: CreateRoleDto) {
    return this.rolesService.create(tenantId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新角色' })
  async update(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除角色' })
  async remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.rolesService.remove(tenantId, id);
  }

  // Super admin endpoints — manage roles across tenants
  @Get('admin/all')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: '超级管理员获取指定租户的角色' })
  async findAllAdmin(@Query('tenantId') tenantId: string) {
    return this.rolesService.findAll(tenantId);
  }

  @Post('admin')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: '超级管理员在指定租户创建角色' })
  async createAdmin(@Query('tenantId') tenantId: string, @Body() dto: CreateRoleDto) {
    return this.rolesService.create(tenantId, dto);
  }

  @Patch('admin/:id')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: '超级管理员更新指定租户的角色' })
  async updateAdmin(@Query('tenantId') tenantId: string, @Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.update(tenantId, id, dto);
  }

  @Delete('admin/:id')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: '超级管理员删除指定租户的角色' })
  async removeAdmin(@Query('tenantId') tenantId: string, @Param('id') id: string) {
    return this.rolesService.remove(tenantId, id);
  }
}
