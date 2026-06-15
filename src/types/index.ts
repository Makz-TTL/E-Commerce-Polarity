import type {
  FastifyBaseLogger,
  FastifyInstance,
  RawReplyDefaultExpression,
  RawRequestDefaultExpression,
  RawServerDefault,
} from "fastify"
import { type ZodTypeProvider } from "fastify-type-provider-zod"

export type ZodFastifyInstance = FastifyInstance<
  RawServerDefault,
  RawRequestDefaultExpression,
  RawReplyDefaultExpression,
  FastifyBaseLogger,
  ZodTypeProvider
>

declare module "fastify" {
  interface Session {
    userId?: number;
    username?: string;
    tempUserData?: {
      name: string;
      lastName: string;
      userName: string;
      eMail: string;
      passwordHash: string;
      code: string;
    };
    tempPasswordData?: {
      newPasswordHash: string;
      code: string;
    };
  }
}