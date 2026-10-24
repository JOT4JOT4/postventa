import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PendingPurchaseGateway } from './pending-purchase.gateway';
import { PurchaseGateway } from './request.types';
import { RequestEntity } from './request.entity';
import { RequestItemEntity } from './request-item.entity';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';

@Module({
  imports: [TypeOrmModule.forFeature([RequestEntity, RequestItemEntity])],
  controllers: [RequestsController],
  providers: [RequestsService, { provide: PurchaseGateway, useClass: PendingPurchaseGateway }],
})
export class RequestsModule {}
