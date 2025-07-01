/*
 * Do appinsights first as it does some magic instrumentation work, i.e. it affects other 'require's
 * In particular, applicationinsights automatically collects bunyan logs
 */
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { buildAppInsightsClient, initialiseAppInsights } from '../utils/azureAppInsights'
import applicationInfoSupplier from '../applicationInfo'
import { createRedisClient } from './redisClient'
import RedisTokenStore from './tokenStore/redisTokenStore'
import InMemoryTokenStore from './tokenStore/inMemoryTokenStore'
import config from '../config'
import HmppsAuditClient from './hmppsAuditClient'
import logger from '../../logger'

const applicationInfo = applicationInfoSupplier()
initialiseAppInsights()
buildAppInsightsClient(applicationInfo)

type RestClientBuilder<T> = (token: string) => T

export const dataAccess = () => ({
  applicationInfo,
  authenticationClient: new AuthenticationClient(
    config.apis.hmppsAuth,
    logger,
    config.redis.enabled ? new RedisTokenStore(createRedisClient()) : new InMemoryTokenStore(),
  ),
  hmppsAuditClient: new HmppsAuditClient(config.sqs.audit),
})

export type DataAccess = ReturnType<typeof dataAccess>

export { AuthenticationClient, RestClientBuilder, HmppsAuditClient }
