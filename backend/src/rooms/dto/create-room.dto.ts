import {
  IsDateString,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  readonly title: string;

  @IsEmail()
  readonly coordinatorEmail: string;

  @IsOptional()
  @IsDateString()
  readonly startDate?: string;

  @IsOptional()
  @IsDateString()
  readonly endDate?: string;

  @IsOptional()
  @IsIn(['es', 'en'])
  readonly lang?: 'es' | 'en';
}
