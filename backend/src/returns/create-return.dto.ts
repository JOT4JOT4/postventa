import { Transform } from 'class-transformer';
import { IsDateString, IsInt, IsString, Length, Matches, Max, Min } from 'class-validator';

export class CreateReturnDto {
  @IsInt({ message: 'La línea de compra debe ser un identificador entero.' })
  @Min(1, { message: 'La línea de compra debe ser positiva.' })
  @Max(2147483647, { message: 'La línea de compra está fuera de rango.' })
  purchaseItemId!: number;

  @IsInt({ message: 'La cantidad debe ser un número entero.' })
  @Min(1, { message: 'La cantidad debe ser mayor que cero.' })
  @Max(2147483647, { message: 'La cantidad está fuera de rango.' })
  quantity!: number;

  @Matches(/^(?!0000)\d{4}-\d{2}-\d{2}$/, { message: 'La fecha debe tener formato AAAA-MM-DD.' })
  @IsDateString({ strict: true }, { message: 'La fecha de devolución no es válida.' })
  returnDate!: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString({ message: 'El motivo debe ser un texto.' })
  @Length(1, 2000, { message: 'El motivo debe contener entre 1 y 2000 caracteres.' })
  reason!: string;
}
