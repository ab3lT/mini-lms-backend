/**
 * Seeds the database with a single Super Admin account.
 * This is the ONLY way an initial account gets into the system - there is no
 * public registration endpoint. Every other user (moderators, teachers,
 * students, accountants) must be created afterwards by an admin via
 * POST /users.
 *
 * Usage: npm run seed
 * Reads SUPER_ADMIN_USERNAME / SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD from
 * .env (falls back to defaults below if not set).
 */
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const username = process.env.SUPER_ADMIN_USERNAME || 'superadmin';
  const email = process.env.SUPER_ADMIN_EMAIL || 'superadmin@example.com';
  const password = process.env.SUPER_ADMIN_PASSWORD || 'ChangeMe123!';

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    console.log(`Super Admin "${username}" already exists (id=${existing.id}). Skipping.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.create({
    data: {
      username,
      email,
      passwordHash,
      role: Role.ADMIN,
    },
  });

  console.log(`Created Super Admin account:`);
  console.log(`  username: ${admin.username}`);
  console.log(`  email: ${admin.email}`);
  console.log(`  password: ${password} (change this after first login)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
