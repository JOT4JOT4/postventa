import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestEntity } from '../requests/request.entity';
import { ReturnEntity } from './return.entity';
import { ReturnsController } from './returns.controller';
import { ReturnsService } from './returns.service';

@Module({
  imports: [TypeOrmModule.forFeature([ReturnEntity, RequestEntity])],
  controllers: [ReturnsController],
  providers: [ReturnsService],
})
export class ReturnsModule {}
