import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CanActivate } from '@nestjs/common';
import { Request } from 'express';

import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      if (!secret) {
        throw new Error('JWT_SECRET must be defined');
      }
      const payload = await this.jwtService.verifyAsync(token, {
        secret: secret,
      });
      if (payload && payload.role) {
        const rawRole = String(payload.role)
          .trim()
          .toUpperCase()
          .replace(/[\s_]/g, '');
        if (rawRole === 'ORGADMIN' || rawRole === 'ORGANIZATIONADMIN') {
          payload.role = 'ORG_ADMIN';
        } else if (rawRole === 'SYSTEMADMIN' || rawRole === 'ADMIN') {
          payload.role = 'SYSTEM_ADMIN';
        } else if (rawRole === 'ASSESSORADMIN') {
          payload.role = 'ASSESSOR_ADMIN';
        } else {
          payload.role = String(payload.role)
            .toUpperCase()
            .trim()
            .split(' ')
            .join('_');
        }
      }
      // 💡 We're assigning the payload to the request object here
      // so that we can access it in our route handlers
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
