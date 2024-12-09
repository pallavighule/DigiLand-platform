import { APP_FILTER } from '@nestjs/core';
import { Module, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { config } from '../config/config';
import { validationSchema } from '../config/validation';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health/health.controller';
import { ExceptionHandler } from './common/exception.handler';
import { LandNftModule } from './land-nft/land-nft.module';

@Module({
  imports: [
    TerminusModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
      envFilePath: `${process.cwd()}/.env`,
      validationSchema: validationSchema,
    }),
    LandNftModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: ExceptionHandler,
    },
  ],
})
export class AppModule {}
