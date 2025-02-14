import { Router } from 'express'
import { NotifyClient } from 'notifications-node-client'

import { DateTimeFormatter, LocalDate, ZonedDateTime } from '@js-joda/core'
import { Parser } from '@json2csv/plainjs'
import type { Services } from '../services'
import config from '../config'
import { dateTimeFormatter } from '../utils/utils'
import { asArray } from '../utils/url'
import DeliusClient from '../data/deliusClient'
import getAllNotifications from '../utils/notifyUtils'
import { Filters, filterByKeywords, getAvailableFilterOptions, mapStatus } from '../utils/filterUtils'

const notifyClients: Record<string, NotifyClient> = Object.fromEntries(
  Object.values(config.notify.providers).map(providerConfig => [
    providerConfig.code,
    config.notify.customUrl
      ? new NotifyClient(config.notify.customUrl, providerConfig.apiKey)
      : new NotifyClient(providerConfig.apiKey),
  ]),
)

export default function routes({ auditService, hmppsAuthClient }: Services): Router {
  const router = Router()

  router.get('/', async (req, res, next) => {
    await auditService.logPageView('HOME_PAGE', { who: res.locals.user.username, correlationId: req.id })

    const providers = await userProviders(req.user.username)
    if (!providers.length) {
      res.redirect('/autherror')
      return
    }

    const filters: Filters = {
      date: req.query.date
        ? LocalDate.parse(req.query.date as string, DateTimeFormatter.ofPattern('d/M/yyyy'))
        : LocalDate.now(),
      keywords: req.query.keywords as string,
      status: asArray(req.query.status),
      template: asArray(req.query.template),
      provider: (req.query.provider as string) ?? providers[0].code,
    }
    const notifyClient = notifyClients[filters.provider]
    const notifications = await getAllNotifications(notifyClient, filters.date)
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
    const providerCode = req.query.provider as string
    const csvParser = new Parser({
      fields: ['id', 'reference', 'phone_number', 'body', 'status', 'sent_at', 'completed_at'],
    })

    res
      .type('text/csv')
      .attachment(`appointment-reminders-${date.format(DateTimeFormatter.ofPattern('yyyy-MM-dd'))}.csv`)
      .send(csvParser.parse(await getAllNotifications(notifyClients[providerCode], date)))
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
    const token = await hmppsAuthClient.getSystemClientToken()
    const response = await new DeliusClient(token).getUserAccess(username)
    const enabledProviders = Object.keys(notifyClients)
    return response.providers.filter(provider => enabledProviders.includes(provider.code))
  }

  return router
}
