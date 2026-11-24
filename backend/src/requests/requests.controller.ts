import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { ALL_USER_ROLES } from '../auth/auth.types';
import { Roles } from '../auth/roles.decorator';
import { CreateRequestDto } from './create-request.dto';
import { RequestsService } from './requests.service';

@UseGuards(AuthGuard, RolesGuard)
@Controller('postventa')
export class RequestsController {
  constructor(private readonly requests: RequestsService) {}

  @Get('compras/:id')
  @Roles(...ALL_USER_ROLES)
  purchaseContext(@Param('id', new ParseIntPipe({
    exceptionFactory: () => new BadRequestException('El identificador de compra debe ser un entero.'),
  })) id: number) {
    if (id < 1 || id > 2147483647) {
      throw new BadRequestException('El identificador de compra no es válido.');
    }
    return this.requests.purchaseContext(id);
  }

  @Post('solicitudes')
  @Roles(...ALL_USER_ROLES)
  create(@Body() input: CreateRequestDto) {
    return this.requests.create(input);
  }
}
