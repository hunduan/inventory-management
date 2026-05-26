import { IsString, IsOptional } from 'class-validator';

export class CreateSupplierDto {
  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  contact?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  address?: string;
}
