import { DateTimeFormatter } from '@js-joda/core'
import { Locale } from '@js-joda/locale_en'

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

export function groupByCount<T>(list: T[], keyFn: (item: T) => string): [string, number][] {
  return Object.entries(
    list.reduce(
      (acc, item) => {
        const keyValue = keyFn(item)
        acc[keyValue] = (acc[keyValue] ?? 0) + 1
        return acc
      },
      {} as Record<string, number>,
    ),
  ).sort((a, b) => b[1] - a[1])
}

export const dateTimeFormatter = DateTimeFormatter.ofPattern("eeee, d MMMM 'at' HH:mma").withLocale(Locale.ENGLISH)
