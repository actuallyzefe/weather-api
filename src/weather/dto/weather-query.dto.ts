import { IsString, IsOptional, IsLatitude, IsLongitude } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class WeatherQueryDto {
  @ApiProperty({
    description: 'City name',
    example: 'London',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({
    description: 'Country code (ISO 3166)',
    example: 'GB',
    required: false,
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({
    description: 'Latitude coordinate',
    example: 51.5074,
    required: false,
  })
  @IsOptional()
  @IsLatitude()
  lat?: number;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: -0.1278,
    required: false,
  })
  @IsOptional()
  @IsLongitude()
  lon?: number;
}
