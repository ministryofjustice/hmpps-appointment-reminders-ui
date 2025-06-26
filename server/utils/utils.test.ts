import { ZonedDateTime } from '@js-joda/core'
import { convertToTitleCase, europeLondon, formatDate, initialiseName, parseDate } from './utils'

describe('convert to title case', () => {
  it.each([
    [null, null, ''],
    ['empty string', '', ''],
    ['Lower case', 'robert', 'Robert'],
    ['Upper case', 'ROBERT', 'Robert'],
    ['Mixed case', 'RoBErT', 'Robert'],
    ['Multiple words', 'RobeRT SMiTH', 'Robert Smith'],
    ['Leading spaces', '  RobeRT', '  Robert'],
    ['Trailing spaces', 'RobeRT  ', 'Robert  '],
    ['Hyphenated', 'Robert-John SmiTH-jONes-WILSON', 'Robert-John Smith-Jones-Wilson'],
  ])('%s convertToTitleCase(%s, %s)', (_: string, a: string, expected: string) => {
    expect(convertToTitleCase(a)).toEqual(expected)
  })
})

describe('initialise name', () => {
  it.each([
    [null, null, null],
    ['Empty string', '', null],
    ['One word', 'robert', 'r. robert'],
    ['Two words', 'Robert James', 'R. James'],
    ['Three words', 'Robert James Smith', 'R. Smith'],
    ['Double barrelled', 'Robert-John Smith-Jones-Wilson', 'R. Smith-Jones-Wilson'],
  ])('%s initialiseName(%s, %s)', (_: string, a: string, expected: string) => {
    expect(initialiseName(a)).toEqual(expected)
  })
})

describe('format date', () => {
  it.each([
    [null, null, ''],
    ['Outside DST', ZonedDateTime.of(2025, 1, 1, 12, 0, 0, 0, europeLondon), 'Wednesday, 1 January at 12:00PM'],
    ['Inside DST', ZonedDateTime.of(2025, 6, 1, 12, 0, 0, 0, europeLondon), 'Sunday, 1 June at 12:00PM'],
  ])('%s formatDate(%s, %s)', (_: string, input: ZonedDateTime, expected: string) => {
    expect(formatDate(input)).toEqual(expected)
  })
})

describe('parse date', () => {
  it.each([
    [null, null, null],
    ['Outside DST', '2025-01-25T18:01:38.868727Z', ZonedDateTime.of(2025, 1, 25, 18, 1, 38, 868727000, europeLondon)],
    ['Inside DST', '2025-06-25T17:01:38.868727Z', ZonedDateTime.of(2025, 6, 25, 18, 1, 38, 868727000, europeLondon)],
  ])('%s parseDate(%s, %s)', (_: string, input: string, expected: ZonedDateTime) => {
    expect(parseDate(input)).toEqual(expected)
  })
})
