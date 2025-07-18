import { NotifyClient } from 'notifications-node-client'
import config from '../config'

const notifyClients: Record<string, NotifyClient> = Object.fromEntries(
  Object.values(config.notify.providers).map(providerConfig => [
    providerConfig.code,
    config.notify.customUrl
      ? new NotifyClient(config.notify.customUrl, providerConfig.apiKey)
      : new NotifyClient(providerConfig.apiKey),
  ]),
)
export default notifyClients
