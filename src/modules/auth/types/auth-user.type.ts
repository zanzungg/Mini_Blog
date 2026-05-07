import { Role } from '@prisma/client';

export type AuthUser = {
  userId: number;
  email: string;
  role: Role;
};
