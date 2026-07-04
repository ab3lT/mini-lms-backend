import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum';

export const ROLES_KEY = 'roles';

/**
 * Marks a controller or handler as restricted to the given roles.
 * Must be paired with RolesGuard (applied globally in AppModule) - the
 * decorator alone does not enforce anything.
 *
 * @example
 * @Roles(Role.ADMIN)
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Post()
 * create() { ... }
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
