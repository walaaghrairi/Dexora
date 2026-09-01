import type { Account, AdminDashboardStats, AiHealth, AuthResponse, Category, CertificateCredential, Course, EmailVerificationResponse, Sign, SignPrediction, TwoFactorSetup } from '../types/api'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8081'
const AI_URL = import.meta.env.VITE_AI_URL ?? 'http://localhost:8000'

async function readApiError(response: Response): Promise<string> {
  const fallback = 'Une erreur est survenue. Vérifiez que le backend est démarré.'
  const text = await response.text().catch(() => '')
  if (!text) return fallback

  try {
    const payload = JSON.parse(text) as {
      detail?: string
      message?: string
      title?: string
      errors?: Record<string, string>
    }
    const firstFieldError = payload.errors ? Object.values(payload.errors)[0] : undefined
    return firstFieldError || payload.detail || payload.message || payload.title || fallback
  } catch {
    return text
  }
}

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
    throw new Error(await readApiError(response))
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export const api = {
  aiHealth: async (): Promise<AiHealth> => {
    const response = await fetch(`${AI_URL}/health`)
    if (!response.ok) throw new Error(`Service IA indisponible (${response.status})`)
    return response.json() as Promise<AiHealth>
  },
  categories: () => request<Category[]>('/categories'),
  courses: () => request<Course[]>('/courses'),
  signs: () => request<Sign[]>('/signs'),
  adminStats: () => request<AdminDashboardStats>('/admin/stats'),
  adminUsers: () => request<Account[]>('/admin/users'),
  updateUserRole: (id: number, role: Account['role']) =>
    request<Account>(`/admin/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
  updateUserStatus: (id: number, active: boolean) =>
    request<Account>(`/admin/users/${id}/status`, { method: 'PUT', body: JSON.stringify({ active }) }),
  createCategory: (category: Omit<Category, 'id' | 'createdAt'>) =>
    request<Category>('/categories', { method: 'POST', body: JSON.stringify(category) }),
  updateCategory: (id: number, category: Omit<Category, 'id' | 'createdAt'>) =>
    request<Category>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(category) }),
  deleteCategory: (id: number) => request<void>(`/categories/${id}`, { method: 'DELETE' }),
  createCourse: (course: Omit<Course, 'id' | 'createdAt'>) =>
    request<Course>('/courses', { method: 'POST', body: JSON.stringify(course) }),
  updateCourse: (id: number, course: Omit<Course, 'id' | 'createdAt'>) =>
    request<Course>(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(course) }),
  deleteCourse: (id: number) => request<void>(`/courses/${id}`, { method: 'DELETE' }),
  createSign: (sign: Omit<Sign, 'id' | 'createdAt'>) =>
    request<Sign>('/signs', { method: 'POST', body: JSON.stringify(sign) }),
  updateSign: (id: number, sign: Omit<Sign, 'id' | 'createdAt'>) =>
    request<Sign>(`/signs/${id}`, { method: 'PUT', body: JSON.stringify(sign) }),
  deleteSign: (id: number) => request<void>(`/signs/${id}`, { method: 'DELETE' }),
  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  verifyTwoFactor: (email: string, code: string) =>
    request<AuthResponse>('/auth/2fa/verify', { method: 'POST', body: JSON.stringify({ email, code }) }),
  register: (firstName: string, lastName: string, email: string, password: string) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ firstName, lastName, email, password }),
    }),
  googleLogin: (credential: string) =>
    request<AuthResponse>('/auth/google', { method: 'POST', body: JSON.stringify({ credential }) }, false),
  verifyEmail: (token: string) =>
    request<EmailVerificationResponse>(`/auth/email/verify?token=${encodeURIComponent(token)}`, undefined, false),
  resendVerification: (email: string) =>
    request<EmailVerificationResponse>('/auth/email/resend', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }, false),
  account: () => request<Account>('/account'),
  updateAccount: (firstName: string, lastName: string, email: string, avatarKey: Account['avatarKey']) =>
    request<Account>('/account', { method: 'PUT', body: JSON.stringify({ firstName, lastName, email, avatarKey }) }),
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
  predictSequence: async (images: Blob[]): Promise<SignPrediction> => {
    const form = new FormData()
    images.forEach((image, index) => form.append('images', image, `webcam-sequence-${index}.jpg`))
    const response = await fetch(`${AI_URL}/predict-sequence`, { method: 'POST', body: form })
    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { detail?: string } | null
      throw new Error(payload?.detail || `Service vidéo IA indisponible (${response.status})`)
    }
    return response.json() as Promise<SignPrediction>
  },
}
