import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ALL_USER_ROLES, UserRole } from '../auth/auth.types';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ResolveCaseDto } from './resolve-case.dto';
import { UpdateCaseStatusDto } from './update-case-status.dto';
import { CasesService } from './cases.service';

@UseGuards(AuthGuard, RolesGuard)
@Controller('postventa/solicitudes')
export class CasesController {
  constructor(private readonly cases: CasesService) {}

  @Get()
  @Roles(...ALL_USER_ROLES)
  findAll() {
    return this.cases.findAll();
  }

  @Get(':id')
  @Roles(...ALL_USER_ROLES)
  findOne(@Param('id', new ParseIntPipe({
    exceptionFactory: () => new BadRequestException('El identificador del caso debe ser un entero.'),
  })) id: number) {
    return this.cases.findById(id);
  }

  @Patch(':id/estado')
  @HttpCode(200)
  @Roles(UserRole.Administrator, UserRole.Coordinator)
  updateStatus(
    @Param('id', new ParseIntPipe({
      exceptionFactory: () => new BadRequestException('El identificador del caso debe ser un entero.'),
    })) id: number,
    @Body() dto: UpdateCaseStatusDto,
  ) {
    return this.cases.updateStatus(id, dto);
  }

  @Post(':id/resolucion')
  @Roles(UserRole.Administrator, UserRole.Coordinator)
  resolve(
    @Param('id', new ParseIntPipe({
      exceptionFactory: () => new BadRequestException('El identificador del caso debe ser un entero.'),
    })) id: number,
    @Body() dto: ResolveCaseDto,
  ) {
    return this.cases.resolve(id, dto);
  }

  @Get(':id/historial')
  @Roles(...ALL_USER_ROLES)
  getHistory(@Param('id', new ParseIntPipe({
    exceptionFactory: () => new BadRequestException('El identificador del caso debe ser un entero.'),
  })) id: number) {
    return this.cases.getHistory(id);
  }
}
