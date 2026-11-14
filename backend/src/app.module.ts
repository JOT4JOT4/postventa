import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CasesModule } from './cases/cases.module';
import { RequestsModule } from './requests/requests.module';
import { databaseOptions } from './database/database-options';
import { RefundsModule } from './refunds/refunds.module';

@Module({
  imports: [
    RequestsModule,
    CasesModule,
    RefundsModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ...databaseOptions(name => config.get<string>(name)),
        autoLoadEntities: true,
      }),
    }),
  ],
})
export class AppModule {}
