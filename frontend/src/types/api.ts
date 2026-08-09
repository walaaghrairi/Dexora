export type Category = {
  id: number
  name: string
  description?: string
}

export type Course = {
  id: number
  title: string
  description?: string
  categoryId?: number
  pathId?: number
}

export type Sign = {
  id: number
  word: string
  description?: string
  imageUrl?: string
  videoUrl?: string
  difficulty?: 'DEBUTANT' | 'INTERMEDIAIRE' | 'AVANCE'
  modelLabel: string
  courseId?: number
}

export type AuthResponse = { token?: string; twoFactorRequired?: boolean; email?: string }

export type Account = {
  id: number
  firstName: string
  lastName: string
  email: string
  twoFactorEnabled: boolean
}

export type TwoFactorSetup = { secret: string; otpAuthUri: string }
