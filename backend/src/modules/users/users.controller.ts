import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('用户')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: '获取租户下所有用户' })
  async findAll(@TenantId() tenantId: string, @Query() query: { search?: string; page?: number; limit?: number }) {
    return this.usersService.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取用户详情' })
  async findById(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.usersService.findById(tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: '创建用户' })
  async create(@TenantId() tenantId: string, @Body() dto: CreateUserDto) {
    return this.usersService.create(tenantId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新用户' })
  async update(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '禁用用户' })
  async remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.usersService.remove(tenantId, id);
  }

  @Post(':id/role')
  @ApiOperation({ summary: '分配角色' })
  async assignRole(@TenantId() tenantId: string, @Param('id') id: string, @Body('roleId') roleId: string) {
    return this.usersService.assignRole(tenantId, id, roleId);
  }

  // Super admin endpoints — manage users across tenants
  @Get('admin/all')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: '超级管理员获取指定租户的用户' })
  async findAllAdmin(@Query('tenantId') tenantId: string, @Query() query: { search?: string; page?: number; limit?: number }) {
    return this.usersService.findAll(tenantId, query);
  }

  @Post('admin')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: '超级管理员在指定租户创建用户' })
  async createAdmin(@Body() dto: CreateUserDto & { tenantId: string }) {
    return this.usersService.create(dto.tenantId, dto);
  }

  @Patch('admin/:id')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: '超级管理员更新指定租户的用户' })
  async updateAdmin(@Query('tenantId') tenantId: string, @Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(tenantId, id, dto);
  }

  @Delete('admin/:id')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: '超级管理员禁用指定租户的用户' })
  async removeAdmin(@Query('tenantId') tenantId: string, @Param('id') id: string) {
    return this.usersService.remove(tenantId, id);
  }

  @Post('admin/:id/role')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: '超级管理员分配指定租户的用户角色' })
  async assignRoleAdmin(@Query('tenantId') tenantId: string, @Param('id') id: string, @Body('roleId') roleId: string) {
    return this.usersService.assignRole(tenantId, id, roleId);
  }
}
