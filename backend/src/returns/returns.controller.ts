import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PositiveIdPipe } from '../positive-id.pipe';
import { CreateReturnDto } from './create-return.dto';
import { ReturnsService } from './returns.service';

@Controller('postventa/solicitudes/:id/devoluciones')
export class ReturnsController {
  constructor(private readonly returns: ReturnsService) {}

  @Get()
  findForCase(@Param('id', PositiveIdPipe) id: number) {
    return this.returns.findForCase(id);
  }

  @Post()
  create(@Param('id', PositiveIdPipe) id: number, @Body() input: CreateReturnDto) {
    return this.returns.create(id, input);
  }
}
