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

  async getDataQualityStats(providerCode: string): Promise<DataQualityStats> {
    return super.get({ path: `/data-quality/${providerCode}/stats` }, asSystem())
  }

  async getInvalidMobileNumbers(providerCode: string, page: number, sort?: string): Promise<Page<DataQualityEntry>> {
    return super.get(
      {
        path: `/data-quality/${providerCode}/invalid-mobile-numbers`,
        query: `page=${page - 1}${this.mapSort(sort)}`,
      },
      asSystem(),
    )
  }

  async getMissingMobileNumbers(providerCode: string, page: number, sort?: string): Promise<Page<DataQualityEntry>> {
    return super.get(
      {
        path: `/data-quality/${providerCode}/missing-mobile-numbers`,
        query: `page=${page - 1}${this.mapSort(sort)}`,
      },
      asSystem(),
    )
  }

  mapSort(sortStr?: string): string {
    let sort = ''
    if (sortStr) {
      const sortOptions = sortStr.split('.')
      const field = sortOptions[0]
      const direction = sortOptions.length > 1 && sortOptions[1] === 'descending' ? 'desc' : 'asc'

      if (!field || field === 'Name') sort = `&sort=forename,${direction}&sort=surname,${direction}`
      if (field === 'CRN') sort = `&sort=crn,${direction}`
      if (field === 'Mobile number') sort = `&sort=mobileNumber,${direction}`
      if (field === 'Manager')
        sort = `&sort=manager.staff.forename,${direction}&sort=manager.staff.surname,${direction}`
      if (field === 'Probation delivery unit')
        sort = `&sort=manager.team.localAdminUnit.probationDeliveryUnit.description,${direction}`
    }
    return sort
  }
}

export interface Provider {
  code: string
  name: string
}

export interface DataQualityStats {
  invalid: number
  missing: number
}

export interface DataQualityEntry {
  crn: string
  name: string
  mobileNumber?: string
  manager: {
    name: string
    email?: string
  }
  probationDeliveryUnit: string
}

export interface Page<T> {
  content: T[]
  page: {
    number: number
    size: number
    totalPages: number
    totalElements: number
  }
}
