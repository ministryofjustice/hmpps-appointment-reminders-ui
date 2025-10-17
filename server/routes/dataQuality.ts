import express, { RequestHandler, Router } from 'express'
import { DateTimeFormatter, LocalDate } from '@js-joda/core'
import { Parser } from '@json2csv/plainjs'
import type { Services } from '../services'
import config from '../config'
import { addUrlParameters, asNumber } from '../utils/url'
import DeliusClient, { DataQualityEntry, Page } from '../data/deliusClient'
import getPaginationLinks from '../utils/pagination'

export default function dataQualityRoutes(router: Router, { auditService, authenticationClient }: Services): Router {
  router.get(
    '/data-quality/invalid',
    renderDataQualityList(
      'invalid',
      async (deliusClient: DeliusClient, providerCode: string, page: number, sort?: string) =>
        deliusClient.getInvalidMobileNumbers(providerCode, page, sort),
    ),
  )

  router.get(
    '/data-quality/invalid/csv',
    renderCsv('invalid', async (deliusClient: DeliusClient, providerCode: string) =>
      deliusClient.getInvalidMobileNumbers(providerCode, 1, null, 100000),
    ),
  )

  router.get(
    '/data-quality/missing',
    renderDataQualityList(
      'missing',
      async (deliusClient: DeliusClient, providerCode: string, page: number, sort?: string) =>
        deliusClient.getMissingMobileNumbers(providerCode, page, sort),
    ),
  )

  router.get(
    '/data-quality/missing/csv',
    renderCsv('missing', async (deliusClient: DeliusClient, providerCode: string) =>
      deliusClient.getMissingMobileNumbers(providerCode, 1, null, 100000),
    ),
  )

  router.get(
    '/data-quality/duplicates',
    renderDataQualityList(
      'duplicates',
      async (deliusClient: DeliusClient, providerCode: string, page: number, sort?: string) =>
        deliusClient.getDuplicateMobileNumbers(providerCode, page, sort),
    ),
  )

  router.get(
    '/data-quality/duplicates/csv',
    renderCsv('duplicates', async (deliusClient: DeliusClient, providerCode: string) =>
      deliusClient.getDuplicateMobileNumbers(providerCode, 1, null, 100000),
    ),
  )

  function renderDataQualityList(
    template: string,
    getData: (
      deliusClient: DeliusClient,
      providerCode: string,
      page: number,
      sort?: string,
    ) => Promise<Page<DataQualityEntry>>,
  ): RequestHandler {
    return async (req: express.Request, res: express.Response, _: express.NextFunction) => {
      await auditService.logPageView('DATA_QUALITY', { who: res.locals.user.username, correlationId: req.id })
      const sort = req.query.sort as string | undefined
      const page = asNumber(req.query.page, 1)
      const providerCode = req.query.provider as string
      const deliusClient = new DeliusClient(authenticationClient)
      const providers = await deliusClient.getEnabledUserProviders(req.user.username)
      if (!providerCode || !providers.find(p => p.code === providerCode)) {
        res.redirect('/autherror')
        return
      }

      const [dataQualityCount, data] = await Promise.all([
        deliusClient.getInvalidMobileNumberCount(providerCode),
        getData(deliusClient, providerCode, page, sort),
      ])
      const crns = data.content.map(d => d.crn)
      const limitedAccess = await deliusClient.getUserAccess(req.user.username, crns)
      res.render(`pages/data-quality/${template}`, {
        template,
        dataQualityCount,
        providerCode,
        providerName: Object.values(config.notify.providers).find(p => p.code === providerCode).name,
        rows: data.content
          .map(item => {
            if (
              limitedAccess.access
                .filter(access => access.userExcluded || access.userRestricted)
                .map(access => access.crn)
                .includes(item.crn)
            ) {
              return {
                name: '*** ***',
                crn: item.crn,
                mobileNumber: '***********',
                manager: { name: '*** ***', email: null },
                probationDeliveryUnit: '***',
              }
            }
            return item
          })
          .map(item => [
            { text: item.name },
            { text: item.crn },
            { text: item.mobileNumber ?? '' },
            item.manager.email
              ? {
                  html: `<a href='mailto:${item.manager.email}'>${item.manager.name}</a>`,
                  attributes: { 'data-sort-value': item.manager.name },
                }
              : { text: item.manager.name },
            { text: item.probationDeliveryUnit },
            {
              html: `<a href="${config.delius.deeplinkUrl}/NDelius-war/delius/JSP/deeplink.xhtml?component=CaseSummary&CRN=${item.crn}" target="_delius">Open in NDelius ↗</a>`,
            },
          ]),
        pagination: getPaginationLinks(
          page,
          data.page.totalPages,
          data.page.totalElements,
          pageNumber => addUrlParameters(req, { page: pageNumber.toString() }),
          data.page.size,
        ),
      })
    }
  }

  function renderCsv(
    template: string,
    getData: (deliusClient: DeliusClient, providerCode: string) => Promise<Page<DataQualityEntry>>,
  ) {
    return async (req: express.Request, res: express.Response, _: express.NextFunction) => {
      const providerCode = req.query.provider as string
      const formatter = DateTimeFormatter.ofPattern('yyyy-MM-dd')
      const filename = `${template}-mobile-numbers-${LocalDate.now().format(formatter)}.csv`

      const deliusClient = new DeliusClient(authenticationClient)
      const results = await getData(deliusClient, providerCode)
      const csvContent = new Parser({
        fields: [
          { label: 'CRN', value: 'crn' },
          { label: 'Name', value: 'name' },
          { label: 'Manager name', value: 'manager.name' },
          { label: 'Manager email', value: 'manager.email' },
          { label: 'Mobile number', value: 'mobileNumber' },
          { label: 'Probation delivery unit', value: 'probationDeliveryUnit' },
        ],
      }).parse(results.content)
      res.type('text/csv').attachment(filename).send(csvContent)
    }
  }

  return router
}
