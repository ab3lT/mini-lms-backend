import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../enums/role.enum';

/**
 * Enforces @Roles(...) restrictions at the guard level. Must run AFTER
 * JwtAuthGuard so request.user is populated. If a route has no @Roles()
 * metadata it is allowed through (any authenticated user) - every
 * role-restricted endpoint in this app explicitly declares its allowed
 * roles, so there is no reliance on "hiding" unauthorized actions client-side.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        `Role "${user?.role ?? 'anonymous'}" is not permitted to access this resource. Required: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
