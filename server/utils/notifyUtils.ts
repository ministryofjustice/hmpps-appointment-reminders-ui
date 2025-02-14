import { LocalDate, ZonedDateTime } from '@js-joda/core'
import { Notification, NotifyClient } from 'notifications-node-client'

export default async function getAllNotifications(client: NotifyClient, date: LocalDate): Promise<Notification[]> {
  const notifications: Notification[] = []
  let olderThanId = null
  while (true) {
    const response = await client.getNotifications('sms', null, null, olderThanId) // eslint-disable-line no-await-in-loop
    const page = response.data.notifications.filter(n => ZonedDateTime.parse(n.sent_at).toLocalDate().isEqual(date))
    notifications.push(...page)
    const moreResults =
      page.length > 0 ||
      response.data.notifications.some(n => ZonedDateTime.parse(n.sent_at).toLocalDate().isAfter(date))
    if (moreResults && response.data.links.next) {
      olderThanId = new URL(response.data.links.next).searchParams.get('older_than')
      if (!olderThanId) return notifications
    } else {
      return notifications
    }
  }
}
