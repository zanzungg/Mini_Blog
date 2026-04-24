import { Role } from '@prisma/client';

export type AuthUser = {
  sub: number;
  email: string;
  role: Role;
};
