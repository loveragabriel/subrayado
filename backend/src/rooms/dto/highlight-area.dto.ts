import { IsInt, IsNumber, Min, Max } from 'class-validator';

export class HighlightAreaDto {
  @IsInt()
  @Min(0)
  pageIndex: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  left: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  top: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  width: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  height: number;
}
