import type {
  FastifyBaseLogger,
  FastifyInstance,
  RawReplyDefaultExpression,
  RawRequestDefaultExpression,
  RawServerDefault,
} from "fastify"
import { type ZodTypeProvider } from "fastify-type-provider-zod"

declare module "fastify" {
  interface Session {
    username?: string
  }
}

export type ZodFastifyInstance = FastifyInstance<
  RawServerDefault,
  RawRequestDefaultExpression,
  RawReplyDefaultExpression,
  FastifyBaseLogger,
  ZodTypeProvider
>

import "fastify"

declare module "fastify" {
  interface Session {
    username?: string;
    tempUserData?: {
      name: string;
      lastName: string;
      userName: string;
      eMail: string;
      passwordHash: string;
      code: string;
    };
  }
}