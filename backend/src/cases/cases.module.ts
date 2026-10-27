import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaseHistoryEntity } from './case-history.entity';
import { CaseResolutionEntity } from './case-resolution.entity';
import { CasesController } from './cases.controller';
import { CasesService } from './cases.service';
import { RequestEntity } from '../requests/request.entity';
import { RequestItemEntity } from '../requests/request-item.entity';
import { RequestRegistrationEntity } from '../requests/request-registration.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RequestEntity,
      RequestRegistrationEntity,
      RequestItemEntity,
      CaseResolutionEntity,
      CaseHistoryEntity,
    ]),
  ],
  controllers: [CasesController],
  providers: [CasesService],
})
export class CasesModule {}
