import { IsString, IsOptional, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

class UpdateSaleItemDto {
  @ApiPropertyOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsNumber()
  quantity?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsNumber()
  unitPrice?: number;
}

export class UpdateSaleDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  warehouseId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  remark?: string;

  @ApiPropertyOptional({ type: [UpdateSaleItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateSaleItemDto)
  @IsOptional()
  items?: UpdateSaleItemDto[];
}

export class DeliverItemDto {
  @ApiPropertyOptional()
  @IsString()
  itemId!: string;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsNumber()
  quantity!: number;
}
