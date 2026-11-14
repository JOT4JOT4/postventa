import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ResolveCaseDto } from './resolve-case.dto';
import { UpdateCaseStatusDto } from './update-case-status.dto';
import { CasesService } from './cases.service';
import { PositiveIdPipe } from '../positive-id.pipe';

@Controller('postventa/solicitudes')
export class CasesController {
  constructor(private readonly cases: CasesService) {}

  @Get()
  findAll() {
    return this.cases.findAll();
  }

  @Get(':id')
  findOne(@Param('id', PositiveIdPipe) id: number) {
    return this.cases.findById(id);
  }

  @Patch(':id/estado')
  @HttpCode(200)
  updateStatus(
    @Param('id', PositiveIdPipe) id: number,
    @Body() dto: UpdateCaseStatusDto,
  ) {
    return this.cases.updateStatus(id, dto);
  }

  @Post(':id/resolucion')
  resolve(
    @Param('id', PositiveIdPipe) id: number,
    @Body() dto: ResolveCaseDto,
  ) {
    return this.cases.resolve(id, dto);
  }

  @Get(':id/historial')
  getHistory(@Param('id', PositiveIdPipe) id: number) {
    return this.cases.getHistory(id);
  }
}
