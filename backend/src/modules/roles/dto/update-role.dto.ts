import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateRoleDto {
  @ApiPropertyOptional({ description: '角色名称' })
  @IsOptional() @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '权限列表 (JSON 数组)' })
  @IsOptional()
  permissions?: string[];
}
