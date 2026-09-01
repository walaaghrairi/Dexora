import { afterEach, describe, expect, it, vi } from 'vitest'
import { api } from './api'

describe('API error handling', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('extracts the safe ProblemDetail message returned by Spring', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      title: 'Authentification refusée',
      detail: 'Identifiants ou code de sécurité invalides.',
      status: 401,
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/problem+json' },
    })))

    await expect(api.login('test@example.com', 'incorrect'))
      .rejects.toThrow('Identifiants ou code de sécurité invalides.')
  })

  it('does not replace a readable plain-text service error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('Service temporairement indisponible', {
      status: 503,
    })))

    await expect(api.login('test@example.com', 'incorrect'))
      .rejects.toThrow('Service temporairement indisponible')
  })
})
