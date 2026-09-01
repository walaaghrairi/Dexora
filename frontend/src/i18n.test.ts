import { describe, expect, it } from 'vitest'
import { translate } from './i18n'

describe('translate', () => {
  it('returns the requested locale', () => {
    expect(translate('fr', 'nav.login')).toBe('Se connecter')
    expect(translate('en', 'nav.login')).toBe('Sign in')
    expect(translate('ar', 'nav.login')).toBe('دخول')
  })

  it('interpolates values without leaving template placeholders', () => {
    expect(translate('fr', 'home.memberTitle', { name: ', Amine' }))
      .toBe('Prêt(e) à continuer, Amine ?')
  })
})
