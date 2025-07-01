import { asSystem, RestClient } from '@ministryofjustice/hmpps-rest-client'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import logger from '../../logger'

export default class DeliusClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Delius Client', config.apis.delius, logger, authenticationClient)
  }

  async getUserAccess(username: string): Promise<{ providers: Provider[] }> {
    return super.get({ path: `/users/${username}/providers` }, asSystem())
  }
}

export interface Provider {
  code: string
  name: string
}
