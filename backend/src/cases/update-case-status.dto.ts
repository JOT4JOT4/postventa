import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { CaseStatus } from './case.types';

export class UpdateCaseStatusDto {
  @IsEnum(CaseStatus, { message: 'El estado indicado no es válido.' })
  status!: CaseStatus;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'La descripción debe ser texto.' })
  @MinLength(1, { message: 'La descripción no puede estar vacía.' })
  @MaxLength(4000, { message: 'La descripción no puede superar los 4000 caracteres.' })
  description?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'El motivo debe ser texto.' })
  @MinLength(1, { message: 'El motivo no puede estar vacío.' })
  @MaxLength(2000, { message: 'El motivo no puede superar los 2000 caracteres.' })
  reason?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'La nota debe ser texto.' })
  @MinLength(1, { message: 'La nota no puede estar vacía.' })
  @MaxLength(2000, { message: 'La nota no puede superar los 2000 caracteres.' })
  note?: string;
}
