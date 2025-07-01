import { dataAccess } from '../data'
import AuditService from './auditService'

export const services = () => {
  const { applicationInfo, hmppsAuditClient, authenticationClient } = dataAccess()

  const auditService = new AuditService(hmppsAuditClient)

  return {
    applicationInfo,
    auditService,
    authenticationClient,
  }
}

export type Services = ReturnType<typeof services>
