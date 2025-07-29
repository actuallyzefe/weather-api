import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { WeatherService } from './weather.service';
import { WeatherController } from './weather.controller';
import { PrismaService } from '../database/prisma.service';

@Module({
  controllers: [WeatherController],
  providers: [WeatherService, PrismaService],
  exports: [WeatherService],
})
export class WeatherModule {}
