import {
  IsString,
  IsInt,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { HighlightAreaDto } from './highlight-area.dto';

export class AddWordDto {
  @IsString()
  roomId: string;

  @IsString()
  @MaxLength(100)
  term: string;

  @IsInt()
  @Min(0)
  page: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => HighlightAreaDto)
  coords: HighlightAreaDto[];
}
