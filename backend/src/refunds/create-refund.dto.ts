import { Transform } from 'class-transformer';
import { IsString, Matches } from 'class-validator';

export class CreateRefundDto {
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value)
  @IsString({ message: 'El monto debe enviarse como texto decimal.' })
  @Matches(/^(?:[1-9]\d{0,12}(?:\.\d{1,2})?|0\.(?:0[1-9]|[1-9]\d?))$/, {
    message: 'El monto debe ser positivo, sin separador de miles, con hasta 13 enteros y 2 decimales.',
  })
  amount!: string;
}
