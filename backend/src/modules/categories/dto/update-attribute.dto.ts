import { PartialType } from '@nestjs/swagger';
import { CreateCategoryAttributeDto } from './create-attribute.dto';

export class UpdateCategoryAttributeDto extends PartialType(CreateCategoryAttributeDto) {}
