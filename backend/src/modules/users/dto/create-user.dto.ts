import { IsString, IsEmail, IsOptional, IsBoolean, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: '邮箱' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: '密码', minLength: 6 })
  @IsString() @MinLength(6)
  password!: string;

  @ApiProperty({ description: '姓名' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: '手机号' })
  @IsOptional() @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: '角色 ID' })
  @IsOptional() @IsString()
  roleId?: string;

  @ApiPropertyOptional({ description: '是否启用', default: true })
  @IsOptional() @IsBoolean()
  enabled?: boolean;
}
