import {
  IsString,
  IsInt,
  IsOptional,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { HighlightAreaDto } from './highlight-area.dto';

export class SendHighlightDto {
  @IsString()
  roomId: string;

  @IsInt()
  @Min(0)
  page: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => HighlightAreaDto)
  coords: HighlightAreaDto[];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  content?: string;
}
