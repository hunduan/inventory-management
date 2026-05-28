import { IsString, IsEmail, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ description: '姓名' })
  @IsOptional() @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '邮箱' })
  @IsOptional() @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: '手机号' })
  @IsOptional() @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: '角色 ID' })
  @IsOptional() @IsString()
  roleId?: string;

  @ApiPropertyOptional({ description: '是否启用' })
  @IsOptional() @IsBoolean()
  enabled?: boolean;
}
