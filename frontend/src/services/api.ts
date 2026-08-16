import type { Account, AuthResponse, Category, CertificateCredential, Course, Sign, SignPrediction, TwoFactorSetup } from '../types/api'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8081'
const AI_URL = import.meta.env.VITE_AI_URL ?? 'http://localhost:8000'

async function request<T>(path: string, init?: RequestInit, authenticated = true): Promise<T> {
  const token = authenticated ? localStorage.getItem('tunisign_token') : null
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
    ...init,
  })

  if (!response.ok) {
    const message = await response.text().catch(() => '')
    throw new Error(message || 'Une erreur est survenue. Vérifiez que le backend est démarré.')
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
  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  verifyTwoFactor: (email: string, code: string) =>
    request<AuthResponse>('/auth/2fa/verify', { method: 'POST', body: JSON.stringify({ email, code }) }),
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
  issueCertificate: (courseId: number, earnedBadges: number) =>
    request<CertificateCredential>(`/certificates/course/${courseId}/issue`, {
      method: 'POST',
      body: JSON.stringify({ earnedBadges }),
    }),
  verifyCertificate: (verificationCode: string) =>
    request<CertificateCredential>(`/certificates/verify/${encodeURIComponent(verificationCode)}`, undefined, false),
  predictSign: async (image: Blob): Promise<SignPrediction> => {
    const form = new FormData()
    form.append('image', image, 'webcam-capture.jpg')
    const response = await fetch(`${AI_URL}/predict`, { method: 'POST', body: form })
    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { detail?: string } | null
      throw new Error(payload?.detail || `Service IA indisponible (${response.status})`)
    }
    return response.json() as Promise<SignPrediction>
  },
}
