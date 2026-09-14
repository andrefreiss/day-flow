import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  name: string;

  @Matches(/^#[0-9a-fA-F]{6}$/)
  color: string;
}
