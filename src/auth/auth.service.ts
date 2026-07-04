import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * Verifies username/password against the stored bcrypt hash. There is no
   * self-registration path - accounts only exist because an admin created
   * them via UsersModule (or the seed script for the first Super Admin).
   */
  async validateUser(username: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid username or password');
    }

    return user;
  }

  async login(username: string, password: string) {
    const user = await this.validateUser(username, password);

    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      classId: user.classId,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        classId: user.classId,
      },
    };
  }
}
