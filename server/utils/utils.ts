import { DateTimeFormatter, TemporalAccessor, ZonedDateTime, ZoneId } from '@js-joda/core'
import { Locale } from '@js-joda/locale_en'
import '@js-joda/timezone'

const properCase = (word: string): string =>
  word.length >= 1 ? word[0].toUpperCase() + word.toLowerCase().slice(1) : word

const isBlank = (str: string): boolean => !str || /^\s*$/.test(str)

/**
 * Converts a name (first name, last name, middle name, etc.) to proper case equivalent, handling double-barreled names
 * correctly (i.e. each part in a double-barreled is converted to proper case).
 * @param name name to be converted.
 * @returns name converted to proper case.
 */
const properCaseName = (name: string): string => (isBlank(name) ? '' : name.split('-').map(properCase).join('-'))

export const convertToTitleCase = (sentence: string): string =>
  isBlank(sentence) ? '' : sentence.split(' ').map(properCaseName).join(' ')

export const initialiseName = (fullName?: string): string | null => {
  // this check is for the authError page
  if (!fullName) return null

  const array = fullName.split(' ')
  return `${array[0][0]}. ${array.reverse()[0]}`
}

export const dateTimeFormatter = DateTimeFormatter.ofPattern("eeee, d MMMM 'at' HH:mma").withLocale(Locale.ENGLISH)
export const europeLondon = ZoneId.of('Europe/London')

export const formatDate = (date?: TemporalAccessor, pattern?: string): string => {
  if (!date) return ''
  const formatter = pattern ? DateTimeFormatter.ofPattern(pattern).withLocale(Locale.ENGLISH) : dateTimeFormatter
  if (date instanceof ZonedDateTime) {
    return formatter.format(date.withZoneSameInstant(europeLondon))
  }
  return formatter.format(date)
}

export const parseDate = (dateString?: string): ZonedDateTime =>
  dateString ? ZonedDateTime.parse(dateString).withZoneSameInstant(europeLondon) : null
