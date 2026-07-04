import { Role } from '../enums/role.enum';

// Shape of req.user once JwtStrategy.validate() has run.
export interface AuthenticatedUser {
  userId: number;
  username: string;
  role: Role;
  classId: number | null;
}
