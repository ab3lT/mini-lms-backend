import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Validates the JWT on every request it guards (via passport-jwt strategy
 * registered as 'jwt'). Apply this before RolesGuard on any protected route.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
