import { FastifyInstance } from "fastify"
import { renderForbidden } from "./forbidden"
import { renderPaymentError } from "./paymentError"
import { renderPaymentRequired } from "./paymentRequired"
import { renderServiceUnavailable } from "./serviceUnavailable"
import { renderNoAuth } from "./noAuth"
import { renderError } from "./error" 
import { renderNotFound } from "./notFound"

interface FastifyHttpError extends Error {
  statusCode?: number
}

export default function registerGlobalErrorHandler(server: FastifyInstance) {
  server.setErrorHandler((unknownError: unknown, request, reply) => {
    const error = unknownError as FastifyHttpError
    console.error(error)

    const statusCode = error.statusCode || 500


    switch (statusCode) {
      case 401:
        return renderNoAuth(request, reply)
      case 402:
        
        return renderPaymentRequired(request, reply) 
      case 403:
        return renderForbidden(request, reply)
      case 502:
        return renderServiceUnavailable(request, reply)
      default:
        
        return renderError(request, reply)
    }
  })
}