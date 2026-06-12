import type { User as PrismaUser } from "../generated/prisma/client";

declare global {
  namespace Express {
    interface User extends PrismaUser {}
    interface Request {
      validated?: {
        body?: unknown;
        params?: unknown;
        query?: unknown;
      };
    }
  }
}

export {};
