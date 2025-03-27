import { LocalDate } from '@js-joda/core'
import { Notification, NotifyClient } from 'notifications-node-client'
import { Request } from 'express'
import { removeURLParameter } from './url'
import { convertToTitleCase } from './utils'
import { Provider } from '../data/deliusClient'

export interface Filters {
  from: LocalDate
  to: LocalDate
  status: string[]
  template: string[]
  provider: string
  keywords: string
}

export interface FilterCategory {
  heading: { text: string }
  items: { text: string; href: string }[]
}

export function groupByCount<T>(list: T[], keyFn: (item: T) => string): [string, number][] {
  return Object.entries(
    list.reduce(
      (acc, item) => {
        const keyValue = keyFn(item)
        acc[keyValue] = (acc[keyValue] ?? 0) + 1
        return acc
      },
      {} as Record<string, number>,
    ),
  ).sort((a, b) => b[1] - a[1])
}

export function mapStatus(status: string): string {
  return convertToTitleCase(status).replaceAll('-', ' ')
}

export function filterByKeywords(notification: Notification, keywords?: string): boolean {
  if (!keywords) return true
  return [notification.phone_number, notification.body, notification.reference, mapStatus(notification.status)].some(
    str => str?.toLowerCase()?.includes(keywords.toLowerCase()),
  )
}

export async function getAvailableFilterOptions(
  notifications: Notification[],
  filters: Filters,
  userProviders: Provider[],
  notifyClient: NotifyClient,
  req: Request,
) {
  const statuses = groupByCount(notifications, n => n.status).map(([status, count]) => {
    return {
      description: mapStatus(status),
      text: `${mapStatus(status)} (${count})`,
      value: status,
      checked: filters.status.includes(status),
    }
  })

  const templates = await Promise.all(
    groupByCount(notifications, n => n.template.id).map(async ([templateId, count]) => {
      const { name } = (await notifyClient.getTemplateById(templateId)).data
      return {
        description: name,
        text: `${name} (${count})`,
        value: templateId,
        checked: filters.template.includes(templateId),
      }
    }),
  )

  const providers = userProviders.map(p => ({
    description: p.name,
    text: p.name,
    value: p.code,
    checked: filters.provider === p.code,
  }))

  const asCategories: FilterCategory[] = []
  addCategory(asCategories, filters.status, statuses, 'Status', 'status', req)
  addCategory(asCategories, filters.template, templates, 'Template', 'template', req)

  return { statuses, templates, providers, asCategories }
}

export function addCategory(
  categories: FilterCategory[],
  selectedItems: string[],
  availableItems: { value: string; description: string }[],
  heading: string,
  parameterName: string,
  req: Request,
) {
  if (selectedItems.length > 0) {
    categories.push({
      heading: { text: heading },
      items: selectedItems
        .map(filterValue => ({
          text: availableItems.find(i => i.value === filterValue)?.description,
          href: removeURLParameter(req, parameterName, filterValue),
        }))
        .filter(i => i.text),
    })
  }
}
