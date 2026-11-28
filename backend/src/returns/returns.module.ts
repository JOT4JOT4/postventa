import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestEntity } from '../requests/request.entity';
import { RequestRegistrationEntity } from '../requests/request-registration.entity';
import { DatabaseInventoryReturnGateway, InventoryReturnGateway } from './inventory-return.gateway';
import { ReturnEntity } from './return.entity';
import { ReturnsController } from './returns.controller';
import { ReturnsService } from './returns.service';

@Module({
  imports: [TypeOrmModule.forFeature([ReturnEntity, RequestEntity, RequestRegistrationEntity])],
  controllers: [ReturnsController],
  providers: [
    ReturnsService,
    { provide: InventoryReturnGateway, useClass: DatabaseInventoryReturnGateway },
  ],
})
export class ReturnsModule {}
