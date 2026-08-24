import { Response } from 'express'

export interface ApiErrorBody {
  code: string
  message: string
  details?: unknown
}

export const sendError = (
  res: Response,
  status: number,
  code: string,
  message: string,
  details?: unknown,
) => res.status(status).json({ error: { code, message, requestId: res.getHeader('x-request-id') || undefined, ...(details === undefined ? {} : { details }) } })

export const sendInternalError = (res: Response, code: string, message: string) => {
  return sendError(res, 500, code, message)
}
