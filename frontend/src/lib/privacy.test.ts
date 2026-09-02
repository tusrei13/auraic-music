import { describe, expect, it, vi, beforeEach } from 'vitest'
import { getPrivacySettings, savePrivacySettings, type PrivacySettings } from '@/lib/api'

describe('privacy settings helpers', () => {
  beforeEach(() => {
    const store: Record<string, string> = {}
    const localStorageMock = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => { store[key] = value },
      clear: () => { Object.keys(store).forEach((key) => delete store[key]) },
    }
    vi.stubGlobal('window', { localStorage: localStorageMock })
  })

  it('returns default settings when nothing is stored', () => {
    expect(getPrivacySettings('user-1')).toEqual({ privateHistory: true, hideFromCharts: false, allowAnalytics: true })
  })

  it('saves and loads privacy settings from localStorage', () => {
    const settings: PrivacySettings = { privateHistory: false, hideFromCharts: true, allowAnalytics: false }
    savePrivacySettings('user-1', settings)
    expect(getPrivacySettings('user-1')).toEqual(settings)
  })

  it('falls back to defaults on invalid stored JSON', () => {
    ;(window.localStorage as any).setItem('auraic-privacy-user-1', 'not-json')
    expect(getPrivacySettings('user-1')).toEqual({ privateHistory: true, hideFromCharts: false, allowAnalytics: true })
  })
})
