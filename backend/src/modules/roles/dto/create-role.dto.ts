import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ description: '角色名称' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: '权限列表 (JSON 数组)', example: ['purchase.read', 'sale.*'] })
  @IsOptional()
  permissions?: string[];
}
