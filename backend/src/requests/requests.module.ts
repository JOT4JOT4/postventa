import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabasePurchaseGateway } from './database-purchase.gateway';
import { RequestRegistrationEntity } from './request-registration.entity';
import { PurchaseGateway } from './request.types';
import { RequestEntity } from './request.entity';
import { RequestItemEntity } from './request-item.entity';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';

@Module({
  imports: [TypeOrmModule.forFeature([RequestEntity, RequestRegistrationEntity, RequestItemEntity])],
  controllers: [RequestsController],
  providers: [RequestsService, { provide: PurchaseGateway, useClass: DatabasePurchaseGateway }],
})
export class RequestsModule {}
