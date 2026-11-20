// src/app.module.ts
import { Module, ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import sequelizeConfig from './config/sequelize.config';
import { AuthModule } from './modules/auth/auth.module';
import { PlayersModule } from './modules/players/players.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    SequelizeModule.forRoot(sequelizeConfig),
    AuthModule,
    PlayersModule,
  ],
  providers: [
    // Validacion global: rechaza campos desconocidos y valores fuera de rango con 400.
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    },
  ],
})
export class AppModule {}
