import type { Account, AuthResponse, Category, Course, Sign, TwoFactorSetup } from '../types/api'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8081'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('tunisign_token')
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
    ...init,
  })

  if (!response.ok) {
    throw new Error('Une erreur est survenue. Vérifiez que le backend est démarré.')
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export const api = {
  categories: () => request<Category[]>('/categories'),
  courses: () => request<Course[]>('/courses'),
  signs: () => request<Sign[]>('/signs'),
  login: (email: string, password: string, twoFactorCode?: string) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password, twoFactorCode }) }),
  register: (firstName: string, lastName: string, email: string, password: string) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ firstName, lastName, email, password }),
    }),
  account: () => request<Account>('/account'),
  updateAccount: (firstName: string, lastName: string, email: string) =>
    request<Account>('/account', { method: 'PUT', body: JSON.stringify({ firstName, lastName, email }) }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<void>('/account/password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }),
  setupTwoFactor: () => request<TwoFactorSetup>('/account/2fa/setup', { method: 'POST' }),
  enableTwoFactor: (code: string) => request<void>('/account/2fa/enable', { method: 'POST', body: JSON.stringify({ code }) }),
}
