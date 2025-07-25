import { Request } from 'express'
import { ParsedQs } from 'qs'
import { DateTimeFormatter, LocalDate } from '@js-joda/core'

export function getAbsoluteUrl(req: Request): string {
  return `${req.protocol}://${req.get('host')}${req.originalUrl}`
}

export function removeURLParameter(url: string | Request, key: string, value?: string): string {
  const newUrl = new URL(typeof url === 'string' ? url : getAbsoluteUrl(url))
  newUrl.searchParams.delete(key, value)
  return newUrl.toString()
}

export function addUrlParameters(url: string | Request, params?: Record<string, string | string[]>): string {
  const newUrl = new URL(typeof url === 'string' ? url : getAbsoluteUrl(url))
  if (params)
    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        newUrl.searchParams.delete(`${key}[]`)
        value.forEach(v => newUrl.searchParams.append(`${key}[]`, v.toString()))
      } else {
        newUrl.searchParams.set(key, value.toString())
      }
    })
  return newUrl.toString()
}

export function asArray(param: undefined | string | ParsedQs | (string | ParsedQs)[]): string[] {
  if (param === undefined) return []
  return Array.isArray(param) ? (param as string[]) : [param as string]
}

export function asNumber(param: undefined | string | ParsedQs | (string | ParsedQs)[], defaultValue?: number): number {
  if (param === undefined) return defaultValue
  return parseFloat(param as string)
}

export function asDate(
  date: null | undefined | string | ParsedQs | (string | ParsedQs)[],
  defaultValue: LocalDate = LocalDate.now().minusDays(1),
): LocalDate {
  return date ? LocalDate.parse(date as string, DateTimeFormatter.ofPattern('d/M/yyyy')) : defaultValue
}
