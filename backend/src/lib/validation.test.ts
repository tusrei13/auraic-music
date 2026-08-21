import { describe, expect, it } from 'vitest'
import { isNonEmptyString, parsePositiveInteger } from './validation'

describe('request validation helpers', () => {
  it('accepts positive integer ids and rejects invalid values', () => {
    expect(parsePositiveInteger('12')).toBe(12)
    expect(parsePositiveInteger(0)).toBeNull()
    expect(parsePositiveInteger('12.5')).toBeNull()
    expect(parsePositiveInteger('abc')).toBeNull()
  })

  it('accepts non-empty strings only', () => {
    expect(isNonEmptyString('Auraic')).toBe(true)
    expect(isNonEmptyString('   ')).toBe(false)
    expect(isNonEmptyString(null)).toBe(false)
  })
})
