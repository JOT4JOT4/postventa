import { Transform } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsEnum,
  IsInt, IsString, Max, MaxLength, Min, MinLength,
} from 'class-validator';
import { RequestType } from './request.types';

export class CreateRequestDto {
  @IsInt({ message: 'La compra debe tener un identificador entero.' })
  @Min(1, { message: 'El identificador de compra debe ser positivo.' })
  @Max(2147483647, { message: 'El identificador de compra es demasiado grande.' })
  purchaseId!: number;

  @IsArray({ message: 'Debes seleccionar los productos de la compra.' })
  @ArrayMinSize(1, { message: 'Selecciona al menos un producto.' })
  @ArrayMaxSize(100, { message: 'Puedes registrar hasta 100 líneas por solicitud.' })
  @ArrayUnique({ message: 'No repitas una línea de compra.' })
  @IsInt({ each: true, message: 'Las líneas de compra deben tener identificadores enteros.' })
  @Min(1, { each: true, message: 'Los identificadores de línea deben ser positivos.' })
  @Max(2147483647, { each: true, message: 'Un identificador de línea es demasiado grande.' })
  purchaseItemIds!: number[];

  @IsEnum(RequestType, { message: 'Selecciona un tipo de solicitud válido.' })
  type!: RequestType;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'El motivo debe ser texto.' })
  @MinLength(1, { message: 'Debes ingresar el motivo.' })
  @MaxLength(2000, { message: 'El motivo no puede superar los 2000 caracteres.' })
  reason!: string;
}
