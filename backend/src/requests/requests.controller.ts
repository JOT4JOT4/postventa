import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateRequestDto } from './create-request.dto';
import { RequestsService } from './requests.service';
import { PositiveIdPipe } from '../positive-id.pipe';

@Controller('postventa')
export class RequestsController {
  constructor(private readonly requests: RequestsService) {}

  @Get('compras/:id')
  purchaseContext(@Param('id', PositiveIdPipe) id: number) {
    return this.requests.purchaseContext(id);
  }

  @Post('solicitudes')
  create(@Body() input: CreateRequestDto) {
    return this.requests.create(input);
  }
}
