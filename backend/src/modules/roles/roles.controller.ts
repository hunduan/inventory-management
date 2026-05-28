import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
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
}
