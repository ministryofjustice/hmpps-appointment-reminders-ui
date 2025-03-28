import { LocalDate } from '@js-joda/core'
import { Notification, NotifyClient } from 'notifications-node-client'
import getAllNotifications from './notifyUtils'

describe('getAllNotifications', () => {
  const mockClient = {
    getNotifications: jest.fn(),
  } as unknown as jest.Mocked<NotifyClient>

  it('should fetch and filter notifications within the date range', async () => {
    const from = LocalDate.parse('2024-03-01')
    const to = LocalDate.parse('2024-03-10')
    const notifications = [
      { sent_at: '2024-03-02T08:00:00Z' },
      { sent_at: '2024-03-05T12:00:00Z' },
      { sent_at: '2024-03-12T15:30:00Z' },
    ] as Notification[]

    mockClient.getNotifications.mockResolvedValue({
      data: { notifications, links: { current: 'https://example.com/api' } },
    })

    const result = await getAllNotifications(mockClient, from, to)
    expect(result).toHaveLength(2)
  })

  it('should handle pagination correctly', async () => {
    const from = LocalDate.parse('2024-03-01')
    const to = LocalDate.parse('2024-03-10')

    mockClient.getNotifications
      .mockResolvedValueOnce({
        data: {
          notifications: [{ sent_at: '2024-03-05T12:00:00Z' } as Notification],
          links: { current: 'https://example.com/api', next: 'https://example.com/api?older_than=2' },
        },
      })
      .mockResolvedValueOnce({
        data: {
          notifications: [{ sent_at: '2024-03-03T08:00:00Z' } as Notification],
          links: { current: 'https://example.com/api?older_than=2' },
        },
      })

    const result = await getAllNotifications(mockClient, from, to)
    expect(result).toHaveLength(2)
  })

  it('should return an empty array if no notifications match the date range', async () => {
    const from = LocalDate.parse('2024-03-01')
    const to = LocalDate.parse('2024-03-10')

    mockClient.getNotifications.mockResolvedValue({
      data: {
        notifications: [{ sent_at: '2024-02-25T14:00:00Z' } as Notification],
        links: { current: 'https://example.com/api' },
      },
    })

    const result = await getAllNotifications(mockClient, from, to)
    expect(result).toHaveLength(0)
  })
})
