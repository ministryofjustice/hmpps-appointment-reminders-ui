import config from '../config'
import RestClient from './restClient'

export default class DeliusClient extends RestClient {
  constructor(token: string) {
    super('Delius Client', config.apis.delius, token)
  }

  async getUserAccess(username: string): Promise<{ providers: Provider[] }> {
    return super.get({ path: `/users/${username}/providers` })
  }
}

export interface Provider {
  code: string
  name: string
}
