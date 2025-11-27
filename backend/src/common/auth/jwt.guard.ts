import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { verify } from 'jsonwebtoken';
import { UserRole } from '../../domain/entities/user.entity';
import { RequestUser } from './roles.guard';

type JwtPayload = { sub?: string; role?: UserRole; email?: string; id?: string };

@Injectable()
export class JwtGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ headers: any; user?: RequestUser }>();
    const token = this.extractBearer(request.headers);
    if (!token) throw new UnauthorizedException('Token tidak ditemukan');
    if (!process.env.JWT_SECRET) throw new UnauthorizedException('JWT secret belum dikonfigurasi');

    try {
      const payload = verify(token, process.env.JWT_SECRET) as JwtPayload;
      request.user = {
        id: payload.sub ?? payload.id,
        role: payload.role,
        email: payload.email,
      };
      return true;
    } catch (err) {
      throw new UnauthorizedException('Token tidak valid');
    }
  }

  private extractBearer(headers: Record<string, any>): string | null {
    const auth = headers?.authorization || headers?.Authorization;
    if (!auth || typeof auth !== 'string') return null;
    const [scheme, token] = auth.split(' ');
    if (scheme !== 'Bearer' || !token) return null;
    return token;
  }
}
