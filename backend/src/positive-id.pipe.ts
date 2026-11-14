import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class PositiveIdPipe implements PipeTransform<string | number, number> {
  transform(value: string | number): number {
    const id = typeof value === 'number' ? value : /^\d+$/.test(value) ? Number(value) : NaN;
    if (!Number.isSafeInteger(id) || id < 1 || id > 2147483647) {
      throw new BadRequestException('El identificador debe ser un entero positivo dentro del rango permitido.');
    }
    return id;
  }
}
