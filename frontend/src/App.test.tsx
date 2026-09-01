import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

const apiMock = vi.hoisted(() => ({
  aiHealth: vi.fn().mockRejectedValue(new Error('offline')),
  categories: vi.fn().mockResolvedValue([]),
  courses: vi.fn().mockResolvedValue([]),
  signs: vi.fn().mockResolvedValue([]),
  account: vi.fn().mockResolvedValue({
    id: 7,
    firstName: 'Amine',
    lastName: 'Trabelssi',
    email: 'amine@example.com',
    role: 'STUDENT',
    twoFactorEnabled: false,
    avatarKey: 'signer',
    emailVerified: true,
    active: true,
    authProvider: 'LOCAL',
  }),
  verifyCertificate: vi.fn(),
  verifyEmail: vi.fn(),
}))

vi.mock('./services/api', () => ({ api: apiMock }))
vi.mock('./components/GoogleSignInButton', () => ({
  GoogleSignInButton: () => <div data-testid="google-sign-in" />,
}))

describe('App authentication boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not expose the private navigation to a guest', async () => {
    render(<App />)

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Se connecter' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Mon espace' })).not.toBeInTheDocument()
  })

  it('redirects a guest to authentication before opening lessons', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Découvrir les leçons' }))

    expect(await screen.findByRole('heading', { name: 'Se connecter' })).toBeInTheDocument()
    expect(screen.getByTestId('google-sign-in')).toBeInTheDocument()
  })

  it('shows private navigation only after a valid account is loaded', async () => {
    localStorage.setItem('tunisign_token', 'test-token')
    render(<App />)

    await waitFor(() => expect(apiMock.account).toHaveBeenCalledOnce())
    expect(await screen.findByRole('navigation')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mon espace' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Déconnexion' })).toBeInTheDocument()
  })
})
