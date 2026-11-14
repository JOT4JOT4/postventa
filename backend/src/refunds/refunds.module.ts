import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestEntity } from '../requests/request.entity';
import { RefundEntity } from './refund.entity';
import { RefundsController } from './refunds.controller';
import { RefundsService } from './refunds.service';

@Module({
  imports: [TypeOrmModule.forFeature([RefundEntity, RequestEntity])],
  controllers: [RefundsController],
  providers: [RefundsService],
})
export class RefundsModule {}
