import { asSystem, RestClient } from '@ministryofjustice/hmpps-rest-client'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import superagent from 'superagent'
import config from '../config'
import logger from '../../logger'
import notifyClients from './notifyClients'

export default class DeliusClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Delius Client', config.apis.delius, logger, authenticationClient)
  }

  async getUserDatasets(username: string): Promise<{ providers: Provider[] }> {
    return super.get({ path: `/users/${username}/providers` }, asSystem())
  }

  async getEnabledUserProviders(username: string): Promise<Provider[]> {
    const response = await this.getUserDatasets(username)
    const enabledProviders = Object.keys(notifyClients)
    return response.providers.filter(provider => enabledProviders.includes(provider.code))
  }

  async getUserAccess(username: string, crns: string[]): Promise<UserAccess> {
    return super.post({ path: `/users/${username}/access`, data: crns }, asSystem())
  }

  async getInvalidMobileNumberCount(providerCode: string): Promise<string> {
    return (
      await super.get<superagent.Response>(
        { path: `/data-quality/${providerCode}/invalid-mobile-numbers/count`, raw: true },
        asSystem(),
      )
    ).text
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

  async getDuplicateMobileNumbers(providerCode: string, page: number, sort?: string): Promise<Page<DataQualityEntry>> {
    return super.get(
      {
        path: `/data-quality/${providerCode}/duplicate-mobile-numbers`,
        query: `page=${page - 1}${this.mapSort(sort, `&sort=mobileNumber,desc`)}`,
      },
      asSystem(),
    )
  }

  mapSort(sortStr?: string, defaultSort: string = '&sort=forename,asc&sort=surname,asc'): string {
    let sort = defaultSort
    if (sortStr) {
      const sortOptions = sortStr.split('.')
      const field = sortOptions[0]
      const direction = sortOptions.length > 1 && sortOptions[1] === 'descending' ? 'desc' : 'asc'

      if (field === 'Name') sort = `&sort=forename,${direction}&sort=surname,${direction}`
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

export interface CaseAccess {
  crn: string
  userExcluded: boolean
  userRestricted: boolean
  exclusionMessage?: string
  restrictionMessage?: string
}

export interface UserAccess {
  access: CaseAccess[]
}
