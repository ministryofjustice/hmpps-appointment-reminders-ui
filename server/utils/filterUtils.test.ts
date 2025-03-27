import { Notification } from 'notifications-node-client'
import { Request } from 'express'
import { groupByCount, mapStatus, filterByKeywords, addCategory, FilterCategory } from './filterUtils'

const mockRequest = {
  query: {},
  get(_: 'host') {
    return 'localhost'
  },
} as Request

describe('groupByCount', () => {
  it('should group items by a given key function', () => {
    const items = [{ type: 'A' }, { type: 'B' }, { type: 'A' }]
    const result = groupByCount(items, item => item.type)
    expect(result).toEqual([
      ['A', 2],
      ['B', 1],
    ])
  })
})

describe('mapStatus', () => {
  it('should convert status to title case and replace hyphens with spaces', () => {
    expect(mapStatus('pending-approval')).toBe('Pending Approval')
    expect(mapStatus('COMPLETED')).toBe('Completed')
  })
})

describe('filterByKeywords', () => {
  const notification = {
    phone_number: '123456789',
    body: 'Your request is approved',
    reference: 'REF123',
    status: 'pending-approval',
  } as Notification

  it('should return true if no keywords are provided', () => {
    expect(filterByKeywords(notification)).toBe(true)
  })

  it('should match keywords in phone number', () => {
    expect(filterByKeywords(notification, '123')).toBe(true)
  })

  it('should match keywords in body', () => {
    expect(filterByKeywords(notification, 'approved')).toBe(true)
  })

  it('should match keywords in reference', () => {
    expect(filterByKeywords(notification, 'REF')).toBe(true)
  })

  it('should match keywords in mapped status', () => {
    expect(filterByKeywords(notification, 'Pending Approval')).toBe(true)
  })

  it('should return false if keywords are not found', () => {
    expect(filterByKeywords(notification, 'denied')).toBe(false)
  })
})

describe('addCategory', () => {
  it('should add a category when selected items are present', () => {
    const categories: FilterCategory[] = []
    addCategory(categories, ['A'], [{ value: 'A', description: 'Category A' }], 'Test Category', 'param', mockRequest)
    expect(categories).toEqual([
      {
        heading: { text: 'Test Category' },
        items: [{ text: 'Category A', href: expect.any(String) }],
      },
    ])
  })

  it('should not add a category when no selected items are present', () => {
    const categories: FilterCategory[] = []
    addCategory(categories, [], [{ value: 'A', description: 'Category A' }], 'Test Category', 'param', mockRequest)
    expect(categories).toEqual([])
  })
})
