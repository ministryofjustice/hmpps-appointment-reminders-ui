/* eslint-disable no-param-reassign */
import path from 'path'
import nunjucks from 'nunjucks'
import express from 'express'
import fs from 'fs'
import { DateTimeFormatter, TemporalAccessor, ZonedDateTime } from '@js-joda/core'
import { Locale } from '@js-joda/locale_en'
import { convertToTitleCase, dateTimeFormatter, initialiseName } from './utils'
import config from '../config'
import logger from '../../logger'

export default function nunjucksSetup(app: express.Express): void {
  app.set('view engine', 'njk')

  app.locals.asset_path = '/assets/'
  app.locals.applicationName = 'Appointment Reminders'
  app.locals.environmentName = config.environmentName
  app.locals.environmentNameColour = config.environmentName === 'PRE-PRODUCTION' ? 'govuk-tag--green' : ''
  let assetManifest: Record<string, string> = {}

  try {
    const assetMetadataPath = path.resolve(__dirname, '../../assets/manifest.json')
    assetManifest = JSON.parse(fs.readFileSync(assetMetadataPath, 'utf8'))
  } catch (e) {
    if (process.env.NODE_ENV !== 'test') {
      logger.error(e, 'Could not read asset manifest file')
    }
  }

  const njkEnv = nunjucks.configure(
    [
      path.join(__dirname, '../../server/views'),
      'node_modules/govuk-frontend/dist/',
      'node_modules/@ministryofjustice/frontend/',
    ],
    {
      autoescape: true,
      express: app,
    },
  )

  njkEnv.addFilter('initialiseName', initialiseName)
  njkEnv.addFilter('assetMap', (url: string) => assetManifest[url] || url)
  njkEnv.addFilter('formatDate', (date: TemporalAccessor, pattern?: string) =>
    (pattern ? DateTimeFormatter.ofPattern(pattern) : dateTimeFormatter).withLocale(Locale.ENGLISH).format(date),
  )
  njkEnv.addFilter('parseDate', (dateString: string) => ZonedDateTime.parse(dateString))
  njkEnv.addFilter('toErrorList', (errors: Record<string, string>) =>
    Object.entries(errors).map(([key, value]) => ({ text: `${convertToTitleCase(key)}: ${value}`, href: `#${key}` })),
  )
}
