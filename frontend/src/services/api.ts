import type { AuthResponse, Category, Course, Sign } from '../types/api'

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

  return response.json() as Promise<T>
}

export const api = {
  categories: () => request<Category[]>('/categories'),
  courses: () => request<Course[]>('/courses'),
  signs: () => request<Sign[]>('/signs'),
  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (firstName: string, lastName: string, email: string, password: string) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ firstName, lastName, email, password }),
    }),
}
