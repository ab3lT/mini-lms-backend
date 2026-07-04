// Mirrors the `Role` enum in prisma/schema.prisma. Kept as a plain TS enum
// (rather than importing the Prisma-generated one everywhere) so decorators
// and guards have a stable, framework-agnostic type to reference.
export enum Role {
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  ACCOUNTANT = 'ACCOUNTANT',
}
