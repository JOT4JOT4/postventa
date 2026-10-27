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
} from '@nestjs/common';
import { ResolveCaseDto } from './resolve-case.dto';
import { UpdateCaseStatusDto } from './update-case-status.dto';
import { CasesService } from './cases.service';

@Controller('postventa/solicitudes')
export class CasesController {
  constructor(private readonly cases: CasesService) {}

  @Get()
  findAll() {
    return this.cases.findAll();
  }

  @Get(':id')
  findOne(@Param('id', new ParseIntPipe({
    exceptionFactory: () => new BadRequestException('El identificador del caso debe ser un entero.'),
  })) id: number) {
    return this.cases.findById(id);
  }

  @Patch(':id/estado')
  @HttpCode(200)
  updateStatus(
    @Param('id', new ParseIntPipe({
      exceptionFactory: () => new BadRequestException('El identificador del caso debe ser un entero.'),
    })) id: number,
    @Body() dto: UpdateCaseStatusDto,
  ) {
    return this.cases.updateStatus(id, dto);
  }

  @Post(':id/resolucion')
  resolve(
    @Param('id', new ParseIntPipe({
      exceptionFactory: () => new BadRequestException('El identificador del caso debe ser un entero.'),
    })) id: number,
    @Body() dto: ResolveCaseDto,
  ) {
    return this.cases.resolve(id, dto);
  }

  @Get(':id/historial')
  getHistory(@Param('id', new ParseIntPipe({
    exceptionFactory: () => new BadRequestException('El identificador del caso debe ser un entero.'),
  })) id: number) {
    return this.cases.getHistory(id);
  }
}
