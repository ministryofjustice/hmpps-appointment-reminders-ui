import { Request } from 'express'

export function getAbsoluteUrl(req: Request): string {
  return `${req.protocol}://${req.get('host')}${req.originalUrl}`
}

export function removeURLParameter(url: string | Request, key: string, value?: string): string {
  const newUrl = new URL(typeof url === 'string' ? url : getAbsoluteUrl(url))
  newUrl.searchParams.delete(key, value)
  return newUrl.toString()
}
