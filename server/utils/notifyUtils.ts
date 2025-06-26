import { LocalDate, ZonedDateTime } from '@js-joda/core'
import { Notification, NotifyClient } from 'notifications-node-client'
import { parseDate } from './utils'

export default async function getAllNotifications(
  client: NotifyClient,
  from: LocalDate,
  to: LocalDate,
): Promise<Notification[]> {
  const notifications: Notification[] = []
  let olderThanId = null
  while (true) {
    const response = await client.getNotifications('sms', null, null, olderThanId) // eslint-disable-line no-await-in-loop
    const page = response.data.notifications.filter(n => {
      const sentAt = parseDate(n.sent_at).toLocalDate().toEpochDay()
      return from.toEpochDay() <= sentAt && sentAt <= to.toEpochDay()
    })
    notifications.push(...page)

    // Fetch the next page of results if:
    // * the current page has results, or
    // * we have not yet worked back far enough to reach the "to" date
    const moreResults =
      page.length > 0 || response.data.notifications.some(n => ZonedDateTime.parse(n.sent_at).toLocalDate().isAfter(to))
    if (moreResults && response.data.links.next) {
      olderThanId = new URL(response.data.links.next).searchParams.get('older_than')
      if (!olderThanId) return notifications
    } else {
      return notifications
    }
  }
}
