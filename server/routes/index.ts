import { Router } from 'express'
import { NotifyClient } from 'notifications-node-client'

import { DateTimeFormatter, LocalDate } from '@js-joda/core'
import { Parser } from '@json2csv/plainjs'
import type { Services } from '../services'
import config from '../config'
import { formatDate, parseDate } from '../utils/utils'
import { asArray, asDate } from '../utils/url'
import DeliusClient from '../data/deliusClient'
import getAllNotifications from '../utils/notifyUtils'
import { filterByKeywords, Filters, getAvailableFilterOptions, mapStatus } from '../utils/filterUtils'

const notifyClients: Record<string, NotifyClient> = Object.fromEntries(
  Object.values(config.notify.providers).map(providerConfig => [
    providerConfig.code,
    config.notify.customUrl
      ? new NotifyClient(config.notify.customUrl, providerConfig.apiKey)
      : new NotifyClient(providerConfig.apiKey),
  ]),
)

export default function routes({ auditService, authenticationClient }: Services): Router {
  const router = Router()

  router.get('/', async (req, res, next) => {
    await auditService.logPageView('HOME_PAGE', { who: res.locals.user.username, correlationId: req.id })

    const providers = await userProviders(req.user.username)
    if (!providers.length) {
      res.redirect('/autherror')
      return
    }

    const filters: Filters = {
      from: asDate(req.query.from),
      to: asDate(req.query.to),
      keywords: req.query.keywords as string,
      status: asArray(req.query.status),
      template: asArray(req.query.template),
      provider: (req.query.provider as string) ?? providers[0].code,
    }
    const minDate = LocalDate.now().minusDays(90)
    const maxDate = LocalDate.now()
    const errors = {} as Record<string, string>
    if (filters.from.isBefore(minDate)) errors.from = 'Cannot be more than 90 days in the past'
    if (filters.from.isAfter(maxDate)) errors.to = 'Please select a date in the past'
    if (filters.from.isAfter(filters.to)) errors.to = 'Must be on or after the "From" date'
    if (filters.from.isBefore(filters.to.minusDays(7))) errors.from = 'Must be within 7 days of the "To" date'
    if (filters.to.isAfter(maxDate)) errors.to = 'Please select a date in the past'
    if (Object.keys(errors).length > 0) {
      res.render('pages/list', { filters, minDate, maxDate, errors })
      return
    }

    const notifyClient = notifyClients[filters.provider]
    const notifications = await getAllNotifications(notifyClient, filters.from, filters.to)
    const availableFilterOptions = await getAvailableFilterOptions(notifications, filters, providers, notifyClient, req)

    const headers = [{ text: 'To' }, { text: 'Message' }, { text: 'Status' }]
    const results = notifications
      .filter(n => filterByKeywords(n, filters.keywords))
      .filter(n => filters.status.length === 0 || filters.status.includes(n.status))
      .filter(n => filters.template.length === 0 || filters.template.includes(n.template.id))
      .map(n => [
        {
          html: `<a href="/notification/${filters.provider}/${n.id}" class="govuk-!-font-weight-bold govuk-!-margin-bottom-1">${n.phone_number}</a><div class="secondary-text">${n.reference}</div>`,
        },
        {
          html: `<p class="govuk-!-margin-bottom-1">${n.body}</p>
          <time class="secondary-text" datetime="${n.sent_at}" title="${n.sent_at}">
            Sent on ${formatDate(parseDate(n.sent_at))}
          </time>`,
        },
        { text: mapStatus(n.status) },
      ])

    res.render('pages/list', { availableFilterOptions, filters, minDate, maxDate, headers, results })
  })

  router.get('/csv', async (req, res, next) => {
    const from = asDate(req.query.from)
    const to = asDate(req.query.to)
    const providerCode = req.query.provider as string
    const formatter = DateTimeFormatter.ofPattern('yyyy-MM-dd')
    const filename = from.isEqual(to)
      ? `appointment-reminders-${from.format(formatter)}.csv`
      : `appointment-reminders-${from.format(formatter)}-to-${to.format(formatter)}.csv`

    const notifications = await getAllNotifications(notifyClients[providerCode], from, to)
    const csvContent = new Parser({
      fields: ['id', 'reference', 'phone_number', 'body', 'status', 'sent_at', 'completed_at'],
    }).parse(notifications)

    res.type('text/csv').attachment(filename).send(csvContent)
  })

  router.get('/notification/:provider/:id', async (req, res, next) => {
    await auditService.logPageView('NOTIFICATION', { who: res.locals.user.username, correlationId: req.id })

    const notifyClient = notifyClients[req.params.provider]
    const notification = (await notifyClient.getNotificationById(req.params.id)).data
    const templateName = (await notifyClient.getTemplateById(notification.template.id)).data.name
    const crn = notification.reference
    const previousNotifications = (await notifyClient.getNotifications('sms', null, crn, req.params.id)).data
      .notifications
    res.render('pages/notification', { notification, templateName, previousNotifications })
  })

  async function userProviders(username: string) {
    const response = await new DeliusClient(authenticationClient).getUserAccess(username)
    const enabledProviders = Object.keys(notifyClients)
    return response.providers.filter(provider => enabledProviders.includes(provider.code))
  }

  return router
}
