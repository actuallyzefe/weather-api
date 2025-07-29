import {
  Injectable,
  BadRequestException,
  Logger,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { WeatherQueryDto } from './dto/weather-query.dto';
import {
  OpenWeatherResponse,
  WeatherData,
} from './interfaces/weather.interface';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import axios from 'axios';

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);
  private readonly apiKey: string;
  private readonly apiUrl: string;
  private readonly cacheTtl: number;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.apiKey = this.configService.get('openweather.apiKey');
    this.apiUrl = this.configService.get('openweather.apiUrl');
    this.cacheTtl = this.configService.get('cache.weatherTtl');

    if (!this.apiKey) {
      throw new Error('OpenWeather API key is required');
    }
  }

  async getWeather(
    weatherQueryDto: WeatherQueryDto,
    userId: string,
  ): Promise<WeatherData> {
    const { city, country, lat, lon } = weatherQueryDto;

    if (!city && (!lat || !lon)) {
      throw new BadRequestException(
        'Either city name or coordinates (lat, lon) must be provided',
      );
    }

    const cacheKey = this.generateCacheKey(weatherQueryDto);

    let weatherData = await this.cacheManager.get<WeatherData>(cacheKey);

    if (!weatherData) {
      weatherData = await this.fetchWeatherFromAPI(weatherQueryDto);

      await this.cacheManager.set(cacheKey, weatherData, this.cacheTtl * 1000);
      this.logger.log(`Weather data cached for key: ${cacheKey}`);
    } else {
      this.logger.log(`Weather data retrieved from cache for key: ${cacheKey}`);
    }

    await this.saveWeatherQuery(weatherData, userId, cacheKey);

    return weatherData;
  }

  private async fetchWeatherFromAPI(
    weatherQueryDto: WeatherQueryDto,
  ): Promise<WeatherData> {
    const { city, country, lat, lon } = weatherQueryDto;

    let url = `${this.apiUrl}/weather?appid=${this.apiKey}&units=metric`;

    if (city) {
      url += `&q=${encodeURIComponent(city)}${country ? `,${country}` : ''}`;
    } else {
      url += `&lat=${lat}&lon=${lon}`;
    }

    try {
      this.logger.log(
        `Fetching weather data from: ${url.replace(this.apiKey, '[API_KEY]')}`,
      );

      const response = await axios.get<OpenWeatherResponse>(url);
      const data = response.data;

      return this.transformWeatherData(data);
    } catch (error) {
      this.logger.error(
        'Failed to fetch weather data:',
        error.response?.data || error.message,
      );

      if (error.response?.status === 404) {
        throw new BadRequestException('City not found');
      } else if (error.response?.status === 401) {
        throw new BadRequestException('Invalid API key');
      } else {
        throw new BadRequestException('Failed to fetch weather data');
      }
    }
  }

  private transformWeatherData(data: OpenWeatherResponse): WeatherData {
    return {
      city: data.name,
      country: data.sys.country,
      latitude: data.coord.lat,
      longitude: data.coord.lon,
      temperature: data.main.temp,
      description: data.weather[0].description,
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      windSpeed: data.wind.speed,
      windDeg: data.wind.deg,
      visibility: data.visibility,
      feelsLike: data.main.feels_like,
      icon: data.weather[0].icon,
    };
  }

  private generateCacheKey(weatherQueryDto: WeatherQueryDto): string {
    const { city, country, lat, lon } = weatherQueryDto;

    if (city) {
      return `weather:${city.toLowerCase()}${
        country ? `:${country.toLowerCase()}` : ''
      }`;
    } else {
      return `weather:${lat}:${lon}`;
    }
  }

  private async saveWeatherQuery(
    weatherData: WeatherData,
    userId: string,
    cacheKey: string,
  ) {
    try {
      await this.prisma.weatherQuery.upsert({
        where: { cacheKey },
        update: {
          temperature: weatherData.temperature,
          description: weatherData.description,
          humidity: weatherData.humidity,
          pressure: weatherData.pressure,
          windSpeed: weatherData.windSpeed,
          windDeg: weatherData.windDeg,
          visibility: weatherData.visibility,
          feelsLike: weatherData.feelsLike,
          icon: weatherData.icon,
          queryTime: new Date(),
        },
        create: {
          userId,
          city: weatherData.city,
          country: weatherData.country,
          latitude: weatherData.latitude,
          longitude: weatherData.longitude,
          temperature: weatherData.temperature,
          description: weatherData.description,
          humidity: weatherData.humidity,
          pressure: weatherData.pressure,
          windSpeed: weatherData.windSpeed,
          windDeg: weatherData.windDeg,
          visibility: weatherData.visibility,
          uvIndex: null,
          feelsLike: weatherData.feelsLike,
          icon: weatherData.icon,
          cacheKey,
        },
      });

      this.logger.log(
        `Weather query saved/updated for user: ${userId}, cache key: ${cacheKey}`,
      );
    } catch (error) {
      this.logger.error('Failed to save weather query:', error);
    }
  }

  async getUserWeatherHistory(userId: string, limit = 10, offset = 0) {
    return this.prisma.weatherQuery.findMany({
      where: { userId },
      orderBy: { queryTime: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        city: true,
        country: true,
        temperature: true,
        description: true,
        humidity: true,
        pressure: true,
        windSpeed: true,
        feelsLike: true,
        icon: true,
        queryTime: true,
      },
    });
  }

  async getAllWeatherHistory(limit = 50, offset = 0) {
    return this.prisma.weatherQuery.findMany({
      orderBy: { queryTime: 'desc' },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });
  }

  async getWeatherStats() {
    const totalQueries = await this.prisma.weatherQuery.count();
    const uniqueCities = await this.prisma.weatherQuery.groupBy({
      by: ['city'],
      _count: true,
    });
    const queriesLast24h = await this.prisma.weatherQuery.count({
      where: {
        queryTime: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    return {
      totalQueries,
      uniqueCities: uniqueCities.length,
      queriesLast24h,
      topCities: uniqueCities
        .sort((a, b) => b._count - a._count)
        .slice(0, 10)
        .map((item) => ({
          city: item.city,
          count: item._count,
        })),
    };
  }
}
