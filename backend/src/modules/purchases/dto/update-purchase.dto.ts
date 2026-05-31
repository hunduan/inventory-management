import { IsString, IsOptional, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

class UpdatePurchaseItemDto {
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
  unitCost?: number;
}

export class UpdatePurchaseDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  supplierId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  warehouseId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  remark?: string;

  @ApiPropertyOptional({ type: [UpdatePurchaseItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatePurchaseItemDto)
  @IsOptional()
  items?: UpdatePurchaseItemDto[];
}

export class ReceiveItemDto {
  @ApiPropertyOptional()
  @IsString()
  itemId!: string;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsNumber()
  quantity!: number;
}
