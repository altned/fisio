import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../domain/entities/user.entity';
import { ROLES_KEY } from './roles.decorator';

export type RequestUser = { id?: string; role?: UserRole };

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest<{ user?: RequestUser; headers: any }>();
    const user = this.resolveUser(request);
    if (!user || !user.role) {
      throw new ForbiddenException('Akses ditolak: role tidak ditemukan');
    }
    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Akses ditolak: role tidak sesuai');
    }
    request.user = user;
    return true;
  }

  private resolveUser(request: { user?: RequestUser; headers?: any }): RequestUser | null {
    if (request.user?.role) return request.user;
    const roleHeader = request.headers?.['x-user-role'] ?? request.headers?.['X-User-Role'];
    const idHeader = request.headers?.['x-user-id'] ?? request.headers?.['X-User-Id'];
    if (roleHeader) {
      return { id: idHeader, role: String(roleHeader).toUpperCase() as UserRole };
    }
    return null;
  }
}
