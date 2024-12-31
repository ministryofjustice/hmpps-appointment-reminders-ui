import { Request, Router } from 'express'
import { Notification, NotifyClient } from 'notifications-node-client'

import { DateTimeFormatter, LocalDate, ZonedDateTime } from '@js-joda/core'
import { Parser } from '@json2csv/plainjs'
import type { Services } from '../services'
import config from '../config'
import { convertToTitleCase, dateTimeFormatter, groupByCount } from '../utils/utils'
import { asArray, removeURLParameter } from '../utils/url'

const notifyClient: NotifyClient = config.notify.customUrl
  ? new NotifyClient(config.notify.customUrl, config.notify.apiKey)
  : new NotifyClient(config.notify.apiKey)

export default function routes({ auditService }: Services): Router {
  const router = Router()

  router.get('/', async (req, res, next) => {
    await auditService.logPageView('HOME_PAGE', { who: res.locals.user.username, correlationId: req.id })

    const filters: Filters = {
      date: req.query.date
        ? LocalDate.parse(req.query.date as string, DateTimeFormatter.ofPattern('d/M/yyyy'))
        : LocalDate.now(),
      keywords: req.query.keywords as string,
      status: asArray(req.query.status),
      template: asArray(req.query.template),
      provider: asArray(req.query.provider),
    }
    const notifications = await getAllNotifications(filters.date)
    const availableFilterOptions = await getAvailableFilterOptions(notifications, filters, req)

    const headers = [{ text: 'To' }, { text: 'Message' }, { text: 'Status' }]
    const results = notifications
      .filter(n => filterByKeywords(n, filters.keywords))
      .filter(n => filters.status.length === 0 || filters.status.includes(n.status))
      .filter(n => filters.template.length === 0 || filters.template.includes(n.template.id))
      .map(n => [
        {
          html: `<a href="/notification/${n.id}" class="govuk-!-font-weight-bold govuk-!-margin-bottom-1">${n.phone_number}</a><div class="secondary-text">${n.reference.split(':')[0]}</div>`,
        },
        {
          html: `<p class="govuk-!-margin-bottom-1">${n.body}</p><time class="secondary-text" datetime="${n.sent_at}">Sent on ${ZonedDateTime.parse(n.sent_at).format(dateTimeFormatter)}</div>`,
        },
        { text: mapStatus(n.status) },
      ])

    res.render('pages/list', { availableFilterOptions, filters, headers, results })
  })

  router.get('/csv', async (req, res, next) => {
    const date = req.query.date
      ? LocalDate.parse(req.query.date as string, DateTimeFormatter.ofPattern('d/M/yyyy'))
      : LocalDate.now()
    const csvParser = new Parser({
      fields: ['id', 'reference', 'phone_number', 'body', 'status', 'sent_at', 'completed_at'],
    })

    res
      .type('text/csv')
      .attachment(`appointment-reminders-${date.format(DateTimeFormatter.ofPattern('yyyy-MM-dd'))}.csv`)
      .send(csvParser.parse(await getAllNotifications(date)))
  })

  router.get('/notification/:id', async (req, res, next) => {
    await auditService.logPageView('NOTIFICATION', { who: res.locals.user.username, correlationId: req.id })

    const notification = (await notifyClient.getNotificationById(req.params.id)).data
    const templateName = (await notifyClient.getTemplateById(notification.template.id)).data.name
    const crn = notification.reference.split(':')[0]
    const previousNotifications = (await notifyClient.getNotifications('sms', null, crn, req.params.id)).data
      .notifications
    res.render('pages/notification', { notification, templateName, previousNotifications })
  })

  return router
}

async function getAllNotifications(date: LocalDate): Promise<Notification[]> {
  const notifications: Notification[] = []
  let olderThanId = null
  while (true) {
    const response = await notifyClient.getNotifications('sms', null, null, olderThanId) // eslint-disable-line no-await-in-loop
    const page = response.data.notifications.filter(n => ZonedDateTime.parse(n.sent_at).toLocalDate().isEqual(date))
    notifications.push(...page)
    const moreResults =
      page.length > 0 ||
      response.data.notifications.some(n => ZonedDateTime.parse(n.sent_at).toLocalDate().isAfter(date))
    if (moreResults && response.data.links.next) {
      olderThanId = new URL(response.data.links.next).searchParams.get('older_than')
      if (!olderThanId) return notifications
    } else {
      return notifications
    }
  }
}

function mapStatus(status: string): string {
  return convertToTitleCase(status).replaceAll('-', ' ')
}

function filterByKeywords(notification: Notification, keywords?: string): boolean {
  if (!keywords) return true
  return [notification.phone_number, notification.body, notification.reference, mapStatus(notification.status)].some(
    str => str?.toLowerCase()?.includes(keywords.toLowerCase()),
  )
}

async function getAvailableFilterOptions(notifications: Notification[], filters: Filters, req: Request) {
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

  // hard-coded for now until we support more providers
  const providers = [
    {
      description: 'East of England',
      text: `East of England (${notifications.length})`,
      value: 'N56',
      checked: filters.provider.includes('N56'),
    },
  ]

  const asCategories: FilterCategory[] = []
  addCategory(asCategories, filters.status, statuses, 'Status', 'status', req)
  addCategory(asCategories, filters.template, templates, 'Template', 'template', req)
  addCategory(asCategories, filters.provider, providers, 'Provider', 'provider', req)

  return { statuses, templates, providers, asCategories }
}

function addCategory(
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

interface Filters {
  date: LocalDate
  status: string[]
  template: string[]
  provider: string[]
  keywords: string
}

interface FilterCategory {
  heading: { text: string }
  items: { text: string; href: string }[]
}
