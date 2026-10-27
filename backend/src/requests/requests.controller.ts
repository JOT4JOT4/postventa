import { Body, Controller, Get, Param, ParseIntPipe, Post, BadRequestException } from '@nestjs/common';
import { CreateRequestDto } from './create-request.dto';
import { RequestsService } from './requests.service';

@Controller('postventa')
export class RequestsController {
  constructor(private readonly requests: RequestsService) {}

  @Get('compras/:id')
  purchaseContext(@Param('id', new ParseIntPipe({
    exceptionFactory: () => new BadRequestException('El identificador de compra debe ser un entero.'),
  })) id: number) {
    if (id < 1 || id > 2147483647) {
      throw new BadRequestException('El identificador de compra no es válido.');
    }
    return this.requests.purchaseContext(id);
  }

  @Post('solicitudes')
  create(@Body() input: CreateRequestDto) {
    return this.requests.create(input);
  }
}
