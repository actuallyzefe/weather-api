import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: any }>();
    const { method, url, body, user } = request;
    const now = Date.now();

    const userInfo = user
      ? `User: ${user['username']} (${user['role']})`
      : 'Anonymous';

    this.logger.log(`→ ${method} ${url} - ${userInfo}`);

    if (method !== 'GET' && Object.keys(body || {}).length > 0) {
      const sanitizedBody = { ...body };
      if (sanitizedBody.password) sanitizedBody.password = '[REDACTED]';
      this.logger.debug(`Request body: ${JSON.stringify(sanitizedBody)}`);
    }

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - now;
          this.logger.log(`← ${method} ${url} - ${duration}ms - ${userInfo}`);
        },
        error: (error) => {
          const duration = Date.now() - now;
          this.logger.error(
            `← ${method} ${url} - ${duration}ms - Error: ${error.message} - ${userInfo}`,
          );
        },
      }),
    );
  }
}
