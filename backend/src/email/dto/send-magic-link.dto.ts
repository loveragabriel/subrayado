import { IsEmail, IsIn, IsOptional, IsUrl } from 'class-validator';

export class SendMagicLinkDto {
  @IsEmail()
  email: string;

  @IsUrl()
  verifyUrl: string;

  @IsIn(['es', 'en'])
  @IsOptional()
  lang?: 'es' | 'en';
}
