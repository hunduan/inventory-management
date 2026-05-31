import { IsNumber, IsOptional, Min, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateStocktakeItemDto {
  @ApiProperty()
  @IsNumber()
  @Min(0)
  actualQuantity!: number;
}

export class CompleteStocktakeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  items?: Record<string, number>;
}
