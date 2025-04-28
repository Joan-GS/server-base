import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Authorization token is required');
    }

    const token = authHeader.split(' ')[1];
    const decoded = this.jwtService.decode(token) as { sub: string };

    if (!decoded?.sub) {
      throw new UnauthorizedException('Invalid token');
    }

    request.user = { userId: decoded.sub };
    return true;
  }
}