import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../types/authenticated-user.interface';

/**
 * Pulls the JWT-decoded user (attached by JwtStrategy.validate) off the
 * request. Use in place of manually reading `req.user`.
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
