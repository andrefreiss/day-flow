import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  name?: string;

  @IsOptional()
  @Matches(/^#[0-9a-fA-F]{6}$/)
  color?: string;
}
