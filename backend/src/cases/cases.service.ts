import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CaseReader } from './case-reader';
import { CaseWriter } from './case-writer';
import { ResolveCaseDto } from './resolve-case.dto';
import { UpdateCaseStatusDto } from './update-case-status.dto';

@Injectable()
export class CasesService {
  private readonly reader: CaseReader;
  private readonly writer: CaseWriter;

  constructor(dataSource: DataSource) {
    this.reader = new CaseReader(dataSource);
    this.writer = new CaseWriter(dataSource);
  }

  findAll() { return this.reader.findAll(); }
  findById(id: number) { return this.reader.findById(id); }
  getHistory(id: number) { return this.reader.getHistory(id); }
  updateStatus(id: number, dto: UpdateCaseStatusDto) { return this.writer.updateStatus(id, dto); }
  resolve(id: number, dto: ResolveCaseDto) { return this.writer.resolve(id, dto); }
}
