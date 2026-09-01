export type Category = {
  id: number
  name: string
  description?: string
  createdAt?: string
}

export type Course = {
  id: number
  title: string
  description?: string
  categoryId?: number
  pathId?: number
  createdAt?: string
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
  createdAt?: string
}

export type AuthResponse = {
  token?: string
  twoFactorRequired?: boolean
  emailVerificationRequired?: boolean
  verificationEmailSent?: boolean
  email?: string
  message?: string
  developmentVerificationUrl?: string
}

export type EmailVerificationResponse = {
  verified: boolean
  emailSent: boolean
  message: string
  developmentVerificationUrl?: string
}

export type Account = {
  id: number
  firstName: string
  lastName: string
  email: string
  role: 'STUDENT' | 'TEACHER' | 'ADMIN'
  active: boolean
  createdAt?: string
  twoFactorEnabled: boolean
  avatarKey: 'signer' | 'scholar' | 'explorer'
  emailVerified: boolean
  authProvider: 'LOCAL' | 'GOOGLE' | 'BOTH'
}

export type AdminDashboardStats = {
  totalUsers: number
  activeUsers: number
  verifiedUsers: number
  twoFactorUsers: number
  students: number
  teachers: number
  admins: number
  categories: number
  courses: number
  signs: number
  completedCourses: number
  awardedBadges: number
  issuedCertificates: number
}

export type TwoFactorSetup = { secret: string; otpAuthUri: string }

export type CertificateCredential = {
  valid: boolean
  status: 'AUTHENTIC' | 'REVOKED' | 'INVALID_SIGNATURE' | 'CERTIFICATE_NOT_FOUND'
  verificationCode: string
  studentName?: string
  courseId?: number
  courseTitle?: string
  issuedAt?: string
  earnedBadges?: number
  requiredBadges?: number
  digitalSignature?: string
  signatureAlgorithm?: string
  publicKeyFingerprint?: string
  verificationUrl: string
  qrCodeDataUrl?: string
}

export type SignPrediction = {
  status: 'recognized' | 'no_hand'
  label: string
  confidence: number
  topPredictions: Array<{ label: string; confidence: number }>
  model: string
  inputShape: number[]
  orientation?: 'original' | 'mirrored'
  variants?: Array<{
    orientation: 'original' | 'mirrored'
    label: string
    confidence: number
    handDetected: boolean
  }>
  handDetected?: boolean
  handedness?: string | null
  motionRequired?: boolean
  landmarkRefinement?: {
    available: boolean
    applied: boolean
    label?: string
    confidence?: number
  }
}

export type AiHealth = {
  ready: boolean
  model: string
  inputShape: number[]
  classes: string[]
  sequenceModel?: string
  sequenceReady?: boolean
  capabilities?: {
    alphabet: boolean
    numbers: boolean
    firstSigns: boolean
  }
  error?: string | null
}
