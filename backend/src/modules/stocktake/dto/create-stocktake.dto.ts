import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStocktakeDto {
  @ApiPropertyOptional()
  @IsString()
  warehouseId!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  remark?: string;
}
