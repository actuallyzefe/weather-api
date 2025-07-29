# Weather API - NestJS Backend

A comprehensive weather API built with NestJS featuring role-based access control, OpenWeather API integration, and Redis caching.

## Features

- ** Authentication & Authorization**: JWT-based authentication with role-based access control (Admin/User)
- ** Weather Data**: Integration with OpenWeather API for real-time weather information
- ** Caching**: Redis-based caching system with configurable TTL for optimal performance
- ** User Management**: Complete user management system with admin capabilities
- ** API Documentation**: Auto-generated Swagger documentation
- ** Data Validation**: Comprehensive input validation using class-validator
- ** Logging & Monitoring**: Request/response logging and error tracking
- ** Database**: PostgreSQL with Prisma ORM for efficient data management
- ** Docker Support**: Complete Docker development environment with hot reload

## Architecture

### System Design

This project follows a **modular monolith** architecture, providing the benefits of microservices organization while maintaining the simplicity of a single deployable unit.

#### Key Architectural Decisions:

1. **Modular Structure**: Each feature (Auth, Users, Weather) is organized in separate modules
2. **Role-Based Access Control**: Implemented using decorators and guards for clean separation
3. **Caching Strategy**: Multi-layer caching with Redis for external API responses
4. **Database Design**: Optimized schema with proper indexing and relationships
5. **Error Handling**: Global exception filters for consistent error responses

### Project Structure

```
src/
├── auth/                 # Authentication module
│   ├── dto/             # Data Transfer Objects
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
├── users/               # User management module
│   ├── dto/
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── users.module.ts
├── weather/             # Weather API module
│   ├── dto/
│   ├── interfaces/
│   ├── weather.controller.ts
│   ├── weather.service.ts
│   └── weather.module.ts
├── common/              # Shared utilities
│   ├── decorators/     # Custom decorators
│   ├── filters/        # Exception filters
│   ├── guards/         # Authentication guards
│   └── interceptors/   # Request/response interceptors
├── config/             # Configuration management
└── database/           # Database service
```

## Quick Start (Docker)

### Prerequisites

- Docker and Docker Compose
- OpenWeather API Key (get it free from [openweathermap.org](https://openweathermap.org/api))

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd weather-api
   ```

2. **Environment Setup**

   ```bash
   cp .env.example .env
   ```

   Update the `.env` file with your OpenWeather API key:

   ```env
   # Database Configuration
   DATABASE_URL=postgresql://weather_user:weather_pass@localhost:5433/weather_api?schema=public

   # Redis Configuration
   REDIS_HOST=localhost
   REDIS_PORT=6380

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key

   # OpenWeather API Configuration
   # Get your API key from: https://openweathermap.org/api
   OPENWEATHER_API_KEY=your_actual_api_key_here

   # Application Configuration
   NODE_ENV=development
   PORT=3000
   ```

3. **Start the application**

   ```bash
   # Start all services (API, Database, Redis, Adminer)
   docker-compose up --build
   ```

   The services will be available at:

   - **API**: http://localhost:3000
   - **Swagger Documentation**: http://localhost:3000/api/docs
   - **Database Admin (Adminer)**: http://localhost:8080
   - **Database**: localhost:5433
   - **Redis**: localhost:6380

4. **Initialize the database**

   ```bash
   # Run database migrations
   docker-compose exec app npx prisma migrate dev --name init
   ```

### Getting Started

1. **Access Swagger Documentation**: http://localhost:3000/api/docs
2. **Register a user**:
   ```bash
   curl -X POST http://localhost:3000/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email": "user@example.com", "username": "testuser", "password": "password123"}'
   ```
3. **Login to get JWT token**:
   ```bash
   curl -X POST http://localhost:3000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "user@example.com", "password": "password123"}'
   ```
4. **Use the token**: Add `Authorization: Bearer <your-jwt-token>` to your requests

## API Documentation

### Authentication Endpoints

| Method | Endpoint                      | Description                  | Access        |
| ------ | ----------------------------- | ---------------------------- | ------------- |
| POST   | `/api/v1/auth/register`       | Register new user            | Public        |
| POST   | `/api/v1/auth/login`          | User login                   | Public        |
| GET    | `/api/v1/auth/profile`        | Get current user profile     | Authenticated |
| POST   | `/api/v1/auth/admin/register` | Admin: Create user with role | Admin         |

### User Management Endpoints

| Method | Endpoint                   | Description         | Access     |
| ------ | -------------------------- | ------------------- | ---------- |
| GET    | `/api/v1/users`            | Get all users       | Admin      |
| GET    | `/api/v1/users/stats`      | Get user statistics | Admin      |
| GET    | `/api/v1/users/:id`        | Get user by ID      | Self/Admin |
| PATCH  | `/api/v1/users/:id/status` | Update user status  | Admin      |
| PATCH  | `/api/v1/users/:id/role`   | Update user role    | Admin      |

### Weather Endpoints

| Method | Endpoint                        | Description                | Access        |
| ------ | ------------------------------- | -------------------------- | ------------- |
| GET    | `/api/v1/weather/current`       | Get current weather        | Authenticated |
| GET    | `/api/v1/weather/history`       | Get user's weather history | Authenticated |
| GET    | `/api/v1/weather/admin/history` | Get all weather queries    | Admin         |
| GET    | `/api/v1/weather/admin/stats`   | Get weather statistics     | Admin         |

### Example API Calls

```bash
# Register a user
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "username": "testuser", "password": "password123"}'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'

# Get weather (replace TOKEN with your JWT)
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3000/api/v1/weather/current?city=London"

# Get user profile
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/v1/auth/profile
```

### Role-Based Access Control

#### User Roles:

- **USER**: Can query weather data and view own history
- **ADMIN**: Can manage users, view all weather queries, and access statistics

## Database Schema

### User Model

```typescript
{
  id: string (cuid)
  email: string (unique)
  username: string (unique)
  password: string (hashed)
  role: UserRole (ADMIN | USER)
  isActive: boolean
  createdAt: DateTime
  updatedAt: DateTime
  weatherQueries: WeatherQuery[]
  createdUsers: User[]         // Users created by this admin
  createdBy: User?             // Admin who created this user
  createdById: string?
}
```

### WeatherQuery Model

```typescript
{
  id: string(cuid);
  userId: string;
  city: string;
  country: string ? latitude : float;
  longitude: float;
  temperature: float;
  description: string;
  humidity: int;
  pressure: int;
  windSpeed: float;
  windDeg: int ? visibility : int ? uvIndex : float ? feelsLike : float;
  icon: string ? queryTime : DateTime;
  cacheKey: string(unique);
}
```

### CacheEntry Model

```typescript
{
  id: string(cuid);
  key: string(unique);
  value: Json;
  expiresAt: DateTime;
  createdAt: DateTime;
}
```

### Indexing Strategy

- Primary keys: `id` fields
- User lookups: `email`, `role`
- Weather queries: `userId`, `city`, `queryTime`, `cacheKey`
- Cache entries: `key`, `expiresAt`

## 🔧 Configuration

### Environment Variables

| Variable              | Description                  | Default     |
| --------------------- | ---------------------------- | ----------- |
| `DATABASE_URL`        | PostgreSQL connection string | Required    |
| `JWT_SECRET`          | JWT signing secret           | Required    |
| `OPENWEATHER_API_KEY` | OpenWeather API key          | Required    |
| `REDIS_HOST`          | Redis host                   | localhost   |
| `REDIS_PORT`          | Redis port                   | 6380        |
| `PORT`                | Application port             | 3000        |
| `NODE_ENV`            | Environment mode             | development |

### Docker Services

The application runs with the following services:

- **app**: NestJS application (port 3000)
- **db**: PostgreSQL database (port 5433 → 5432)
- **redis**: Redis cache (port 6380 → 6379)
- **adminer**: Database administration UI (port 8080)

### Caching Strategy

1. **Weather Data Caching**:

   - Cache key format: `weather:{city}:{country}` or `weather:{lat}:{lon}`
   - TTL: 5 minutes (configurable)
   - Fallback: In-memory cache if Redis unavailable

2. **Cache Invalidation**:
   - Automatic expiration based on TTL
   - Manual invalidation for critical updates

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch
```

## 🐳 Development Setup

### Docker Development (Current Setup)

The application is configured for Docker development with:

- **Hot Reload**: Source code changes automatically restart the application
- **Volume Mounting**: `./src` directory is mounted for live development
- **Development Dependencies**: All dev dependencies available in container
- **Database Persistence**: PostgreSQL data persisted between container restarts

### Useful Commands

```bash
# Start services
docker-compose up

# Start in detached mode
docker-compose up -d

# Rebuild containers
docker-compose up --build

# Stop services
docker-compose down

# View logs
docker-compose logs app

# Execute commands in container
docker-compose exec app npm run prisma:migrate

# Database management
docker-compose exec app npx prisma studio
```

### Local Development (Alternative)

If you prefer to run without Docker:

1. **Install dependencies**: `npm install`
2. **Setup PostgreSQL and Redis locally**
3. **Update .env** with local connection strings
4. **Run migrations**: `npm run prisma:migrate`
5. **Start development**: `npm run start:dev`

## 📈 Performance Optimizations

### Database Optimizations

- Proper indexing on frequently queried fields
- Connection pooling with Prisma
- Query optimization with selective field retrieval

### Caching Strategy

- Redis for external API responses
- In-memory fallback for high availability
- Configurable TTL based on data sensitivity

### API Performance

- Request/response compression
- Pagination for large datasets
- Efficient data serialization

## 🔐 Security Features

### Authentication & Authorization

- JWT with configurable expiration
- Role-based access control
- Password hashing with bcrypt

### Data Protection

- Input validation and sanitization
- SQL injection prevention with Prisma
- XSS protection through data validation

### API Security

- CORS configuration
- Request rate limiting (recommended)
- Error message sanitization

## 🛠️ Available Scripts

| Script                   | Description              |
| ------------------------ | ------------------------ |
| `npm run start:dev`      | Start development server |
| `npm run build`          | Build for production     |
| `npm run start`          | Start production server  |
| `npm run lint`           | Run ESLint               |
| `npm run test`           | Run unit tests           |
| `npm run test:e2e`       | Run end-to-end tests     |
| `npm run prisma:migrate` | Run database migrations  |
| `npm run prisma:studio`  | Open Prisma Studio       |

---

**Built with ❤️ using NestJS, Prisma, and TypeScript**
