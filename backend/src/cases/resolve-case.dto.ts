import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class ResolveCaseDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'La resolución debe ser texto.' })
  @MinLength(1, { message: 'Debes ingresar el texto de la resolución.' })
  @MaxLength(4000, { message: 'La resolución no puede superar los 4000 caracteres.' })
  resolution!: string;
}
