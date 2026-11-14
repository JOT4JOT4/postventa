import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PositiveIdPipe } from '../positive-id.pipe';
import { CreateRefundDto } from './create-refund.dto';
import { RefundsService } from './refunds.service';

@Controller('postventa/solicitudes/:id/reembolsos')
export class RefundsController {
  constructor(private readonly refunds: RefundsService) {}

  @Get()
  findForCase(@Param('id', PositiveIdPipe) id: number) {
    return this.refunds.findForCase(id);
  }

  @Post()
  create(@Param('id', PositiveIdPipe) id: number, @Body() input: CreateRefundDto) {
    return this.refunds.create(id, input);
  }
}
