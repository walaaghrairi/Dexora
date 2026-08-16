import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import { api } from './services/api'
import type { Account, Category, CertificateCredential, Course, Sign, SignPrediction, TwoFactorSetup } from './types/api'
import tunisignLogo from './assets/tunisign-sina-logo.png'
import { translate, type Language, type TranslationKey } from './i18n'

type Page = 'home' | 'catalogue' | 'dashboard' | 'rewards' | 'settings' | 'auth' | 'practice' | 'twoFactor' | 'verifyCertificate'
type PracticeStatus = 'idle' | 'analyzing' | 'ready' | 'no-hand'
type PracticeMode = 'learn' | 'practice' | 'quiz'
type RewardType = 'badge' | 'certificate'

const AUTO_ANALYSIS_INTERVAL_MS = 900
const STABLE_FRAME_COUNT = 2
const ACCEPTANCE_CONFIDENCE = 0.4
const MAX_CAPTURE_EDGE = 640
const COURSE_HELP_LIMIT = 4

function initialPage(): Page {
  return window.location.pathname.startsWith('/verify-certificate/') ? 'verifyCertificate' : 'home'
}

const demoCategories: Category[] = [
  { id: 101, name: 'Alphabet ASL', description: 'Les 26 lettres reconnues par le modèle actuel.' },
  { id: 102, name: 'Chiffres', description: 'Disponible avec le prochain modèle de reconnaissance.' },
]

const demoCourses: Course[] = [
  { id: 101, title: 'Alphabet A–Z', description: 'Observe, reproduis puis valide les 26 lettres avec un mini-test.', categoryId: 101 },
  { id: 102, title: 'Chiffres ASL', description: 'Bientôt disponible avec un modèle entraîné sur les chiffres.', categoryId: 102 },
]

const demoSigns: Sign[] = Array.from({ length: 26 }, (_, index) => {
  const letter = String.fromCharCode(65 + index)
  return {
    id: 1001 + index,
    word: `Lettre ${letter}`,
    description: `Observe la forme de la main, puis reproduis la lettre ${letter}.`,
    imageUrl: `https://commons.wikimedia.org/wiki/Special:Redirect/file/Sign_language_${letter}.svg`,
    difficulty: 'DEBUTANT',
    modelLabel: letter,
    courseId: 101,
  }
})

function App() {
  const [page, setPage] = useState<Page>(initialPage)
  const [categories, setCategories] = useState<Category[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [signs, setSigns] = useState<Sign[]>([])
  const [usesDemoData, setUsesDemoData] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [isRegistering, setIsRegistering] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(localStorage.getItem('tunisign_token')))
  const [account, setAccount] = useState<Account | null>(null)
  const [twoFactorSetup, setTwoFactorSetup] = useState<TwoFactorSetup | null>(null)
  const [pendingTwoFactorEmail, setPendingTwoFactorEmail] = useState('')
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('tunisign_theme') === 'dark')
  const [practiceStatus, setPracticeStatus] = useState<PracticeStatus>('idle')
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('learn')
  const [quizSign, setQuizSign] = useState<Sign | null>(null)
  const [finalTestSigns, setFinalTestSigns] = useState<Sign[]>([])
  const [finalTestIndex, setFinalTestIndex] = useState(0)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [reminderCycles, setReminderCycles] = useState(0)
  const [gestureReminderOpen, setGestureReminderOpen] = useState(false)
  const [learningQueue, setLearningQueue] = useState<Sign[]>([])
  const [courseHelpCredits, setCourseHelpCredits] = useState<Record<number, number>>({})
  const [showAsConfusionHint, setShowAsConfusionHint] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [prediction, setPrediction] = useState<SignPrediction | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const analysisInFlightRef = useRef(false)
  const recentPredictionsRef = useRef<Array<{ label: string; confidence: number }>>([])
  const expectedLabelRef = useRef('')
  const autoRecognitionPausedRef = useRef(false)
  const [celebrationOpen, setCelebrationOpen] = useState(false)
  const [sessionXp, setSessionXp] = useState(0)
  const [completedLessons, setCompletedLessons] = useState(0)
  const [sessionStreak, setSessionStreak] = useState(0)
  const [courseBadgeProgress, setCourseBadgeProgress] = useState<Record<number, number>>({})
  const [rewardType, setRewardType] = useState<RewardType>('badge')
  const [selectedCertificate, setSelectedCertificate] = useState<{ course: Course; credential: CertificateCredential } | null>(null)
  const [certificateLoadingId, setCertificateLoadingId] = useState<number | null>(null)
  const [certificateVerification, setCertificateVerification] = useState<CertificateCredential | null>(null)
  const [verificationLoading, setVerificationLoading] = useState(page === 'verifyCertificate')
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('tunisign_language')
    return saved === 'en' || saved === 'ar' ? saved : 'fr'
  })

  const t = (key: TranslationKey, values?: Record<string, string | number>) => translate(language, key, values)

  useEffect(() => {
    localStorage.setItem('tunisign_language', language)
    document.documentElement.lang = language
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
  }, [language])

  useEffect(() => {
    if (page !== 'verifyCertificate') return
    const match = window.location.pathname.match(/^\/verify-certificate\/([^/]+)$/)
    if (!match) {
      setCertificateVerification({
        valid: false,
        status: 'CERTIFICATE_NOT_FOUND',
        verificationCode: '',
        verificationUrl: window.location.href,
      })
      setVerificationLoading(false)
      return
    }

    const verificationCode = decodeURIComponent(match[1])
    setVerificationLoading(true)
    api.verifyCertificate(verificationCode)
      .then(setCertificateVerification)
      .catch(() => setCertificateVerification({
        valid: false,
        status: 'CERTIFICATE_NOT_FOUND',
        verificationCode,
        verificationUrl: window.location.href,
      }))
      .finally(() => setVerificationLoading(false))
  }, [page])

  useEffect(() => {
    Promise.allSettled([api.categories(), api.courses(), api.signs()])
      .then(([categoriesResult, coursesResult, signsResult]) => {
        const hasLearningData = categoriesResult.status === 'fulfilled' && coursesResult.status === 'fulfilled'
        if (!hasLearningData) {
          setCategories(demoCategories)
          setCourses(demoCourses)
          setSigns(demoSigns)
          setUsesDemoData(true)
          return
        }

        setCategories(categoriesResult.value)
        setCourses(coursesResult.value)
        setSigns(signsResult.status === 'fulfilled' ? signsResult.value : [])
        setUsesDemoData(false)
      })
      .catch(() => {
        setCategories(demoCategories)
        setCourses(demoCourses)
        setSigns(demoSigns)
        setUsesDemoData(true)
      })
      .finally(() => setLoading(false))
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) { setAccount(null); return }
    api.account().then(setAccount).catch(() => setNotice(translate(language, 'notice.profileLoad')))
  }, [isAuthenticated, language])

  useEffect(() => {
    const storageKey = `tunisign_badges_${account?.id ?? 'guest'}`
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}') as Record<number, number>
      setCourseBadgeProgress(saved)
      setCompletedLessons(Object.values(saved).reduce((total, value) => total + value, 0))
    } catch {
      setCourseBadgeProgress({})
      setCompletedLessons(0)
    }
  }, [account?.id])

  useEffect(() => {
    const storageKey = `tunisign_course_helps_${account?.id ?? 'guest'}`
    try {
      setCourseHelpCredits(JSON.parse(localStorage.getItem(storageKey) || '{}') as Record<number, number>)
    } catch {
      setCourseHelpCredits({})
    }
  }, [account?.id])

  useEffect(() => {
    if (page === 'practice') return
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setCameraActive(false)
    setPrediction(null)
    setPracticeStatus('idle')
  }, [page])

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
  }, [])

  useEffect(() => {
    const video = videoRef.current
    const stream = streamRef.current
    if (!cameraActive || !video || !stream) return

    video.srcObject = stream
    const playVideo = () => void video.play().catch(() => setNotice(translate(language, 'notice.cameraError')))
    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) playVideo()
    else video.addEventListener('loadedmetadata', playVideo, { once: true })

    return () => video.removeEventListener('loadedmetadata', playVideo)
  }, [cameraActive, language, practiceMode])

  const displayedCourses = useMemo(
    () => selectedCategory === null ? courses : courses.filter((course) => course.categoryId === selectedCategory),
    [courses, selectedCategory],
  )

  const earnedBadgeCount = Object.values(courseBadgeProgress).reduce((total, value) => total + value, 0)
  const earnedCertificateCount = courses.filter((course) => (courseBadgeProgress[course.id] ?? 0) >= badgeTotal(course)).length
  const selectedCourseSigns = selectedCourse
    ? signs.filter((sign) => sign.courseId === selectedCourse.id).sort((a, b) => a.modelLabel.localeCompare(b.modelLabel))
    : []
  const selectedCourseEarned = selectedCourse ? courseBadgeProgress[selectedCourse.id] ?? 0 : 0
  const selectedCourseComplete = selectedCourse ? selectedCourseEarned >= badgeTotal(selectedCourse) : false
  const fallbackPracticeSign = selectedCourseSigns[Math.min(selectedCourseEarned, Math.max(selectedCourseSigns.length - 1, 0))]
  const activePracticeSign = learningQueue[0] || fallbackPracticeSign
  const targetPracticeSign = practiceMode === 'quiz' ? quizSign : activePracticeSign
  const remainingHelpCredits = selectedCourse
    ? courseHelpCredits[selectedCourse.id] ?? COURSE_HELP_LIMIT
    : COURSE_HELP_LIMIT

  useEffect(() => {
    expectedLabelRef.current = targetPracticeSign?.modelLabel?.trim().toLocaleLowerCase() || ''
    recentPredictionsRef.current = []
    autoRecognitionPausedRef.current = false
    setFailedAttempts(0)
    setReminderCycles(0)
    setGestureReminderOpen(false)
    setShowAsConfusionHint(false)
    setPrediction(null)
    if (cameraActive && practiceMode !== 'learn') setPracticeStatus('analyzing')
  }, [cameraActive, practiceMode, targetPracticeSign?.id, targetPracticeSign?.modelLabel])

  const analyzeCurrentFrame = useCallback(async () => {
    if (analysisInFlightRef.current || autoRecognitionPausedRef.current) return
    const video = videoRef.current
    if (!video || !video.videoWidth || !video.videoHeight) return

    analysisInFlightRef.current = true
    try {
      const canvas = document.createElement('canvas')
      const scale = Math.min(1, MAX_CAPTURE_EDGE / Math.max(video.videoWidth, video.videoHeight))
      canvas.width = Math.max(1, Math.round(video.videoWidth * scale))
      canvas.height = Math.max(1, Math.round(video.videoHeight * scale))
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Canvas indisponible')
      context.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height,
      )
      const image = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Capture impossible')), 'image/jpeg', 0.9)
      })
      const result = await api.predictSign(image)
      if (result.status === 'no_hand' || !result.handDetected) {
        recentPredictionsRef.current = []
        setPrediction(null)
        setPracticeStatus('no-hand')
        return
      }
      const history = [...recentPredictionsRef.current, { label: result.label, confidence: result.confidence }]
        .slice(-STABLE_FRAME_COUNT)
      recentPredictionsRef.current = history
      const stable = history.length === STABLE_FRAME_COUNT && history.every((item) => item.label === history[0].label)

      if (!stable) {
        setPracticeStatus('analyzing')
        return
      }

      const averageConfidence = history.reduce((total, item) => total + item.confidence, 0) / history.length
      const stablePrediction = { ...result, confidence: averageConfidence }
      setPrediction(stablePrediction)
      setPracticeStatus('ready')
      const matchesExpected = !expectedLabelRef.current
        || result.label.toLocaleLowerCase() === expectedLabelRef.current
      const normalizedPrediction = result.label.trim().toLocaleLowerCase()
      const isAsConfusion = (expectedLabelRef.current === 'a' && normalizedPrediction === 's')
        || (expectedLabelRef.current === 's' && normalizedPrediction === 'a')
      setShowAsConfusionHint(isAsConfusion)
      if (matchesExpected && averageConfidence >= ACCEPTANCE_CONFIDENCE) {
        autoRecognitionPausedRef.current = true
        setFailedAttempts(0)
        setReminderCycles(0)
        setShowAsConfusionHint(false)
        setNotice(translate(language, 'notice.autoDetected', {
          label: result.label,
          score: Math.round(averageConfidence * 100),
        }))
      } else {
        setFailedAttempts((current) => {
          const next = current + 1
          if (next >= 6) {
            autoRecognitionPausedRef.current = true
            setReminderCycles((cycles) => Math.min(cycles + 1, 3))
            setGestureReminderOpen(true)
            setNotice(translate(language, 'notice.gestureReminder'))
          }
          return next
        })
      }
    } catch (error) {
      setPracticeStatus('idle')
      setNotice(error instanceof Error ? error.message : translate(language, 'notice.analysisError'))
    } finally {
      analysisInFlightRef.current = false
    }
  }, [language])

  useEffect(() => {
    if (!cameraActive || practiceMode === 'learn') return
    void analyzeCurrentFrame()
    const interval = window.setInterval(() => void analyzeCurrentFrame(), AUTO_ANALYSIS_INTERVAL_MS)
    return () => window.clearInterval(interval)
  }, [analyzeCurrentFrame, cameraActive, practiceMode, targetPracticeSign?.id])

  function categoryLabel(category: Category) {
    const keys: Record<string, TranslationKey> = { Salutations: 'category.greetings', 'Vie quotidienne': 'category.daily', 'Vocabulaire médical': 'category.medical' }
    return keys[category.name] ? t(keys[category.name]) : category.name
  }

  function courseTitle(course: Course) {
    const keys: Record<string, TranslationKey> = { 'Premiers signes': 'course.first', 'Ma famille': 'course.family', Urgences: 'course.emergency' }
    return keys[course.title] ? t(keys[course.title]) : course.title
  }

  function courseCopy(course: Course) {
    const keys: Record<string, TranslationKey> = { 'Premiers signes': 'course.firstCopy', 'Ma famille': 'course.familyCopy', Urgences: 'course.emergencyCopy' }
    return keys[course.title] ? t(keys[course.title]) : course.description || t('catalog.defaultCopy')
  }

  function badgeTotal(course: Course) {
    const lessonCount = signs.filter((sign) => sign.courseId === course.id).length
    return lessonCount || 3
  }

  function isCourseAvailable(course: Course) {
    const courseSigns = signs.filter((sign) => sign.courseId === course.id)
    return courseSigns.length > 0 && courseSigns.every((sign) => /^[A-Z]$/.test(sign.modelLabel))
  }

  function navigate(nextPage: Page) {
    setNotice('')
    if (window.location.pathname.startsWith('/verify-certificate/')) {
      window.history.pushState({}, '', '/')
    }
    setPage(nextPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function openCertificate(course: Course) {
    if (!isAuthenticated || !account) {
      setIsRegistering(false)
      navigate('auth')
      setNotice(t('notice.certificateLogin'))
      return
    }

    const earnedBadges = courseBadgeProgress[course.id] ?? 0
    if (earnedBadges < badgeTotal(course)) return

    setCertificateLoadingId(course.id)
    try {
      const credential = await api.issueCertificate(course.id, earnedBadges)
      if (!credential.valid) throw new Error(t('notice.certificateIssueError'))
      setSelectedCertificate({ course, credential })
    } catch (error) {
      setNotice(error instanceof Error && error.message ? error.message : t('notice.certificateIssueError'))
    } finally {
      setCertificateLoadingId(null)
    }
  }

  function startLesson(course: Course) {
    const orderedSigns = signs
      .filter((sign) => sign.courseId === course.id)
      .sort((a, b) => a.modelLabel.localeCompare(b.modelLabel))
    const earned = courseBadgeProgress[course.id] ?? 0
    setSelectedCourse(course)
    setLearningQueue(orderedSigns.slice(earned))
    setPracticeMode('learn')
    setQuizSign(null)
    setFinalTestSigns([])
    setFinalTestIndex(0)
    setFailedAttempts(0)
    setReminderCycles(0)
    setGestureReminderOpen(false)
    setShowAsConfusionHint(false)
    setPracticeStatus('idle')
    setPrediction(null)
    navigate('practice')
  }

  function beginPractice() {
    recentPredictionsRef.current = []
    autoRecognitionPausedRef.current = false
    setPracticeMode('practice')
    setPrediction(null)
    setPracticeStatus('idle')
  }

  function beginFinalTest() {
    const shuffled = [...selectedCourseSigns]
    for (let index = shuffled.length - 1; index > 0; index--) {
      const randomIndex = Math.floor(Math.random() * (index + 1))
      ;[shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]]
    }
    const testSigns = shuffled.slice(0, Math.min(5, shuffled.length))
    setFinalTestSigns(testSigns)
    setFinalTestIndex(0)
    setQuizSign(testSigns[0] || activePracticeSign || null)
    recentPredictionsRef.current = []
    autoRecognitionPausedRef.current = false
    setPracticeMode('quiz')
    setPrediction(null)
    setPracticeStatus('idle')
    setFailedAttempts(0)
    setGestureReminderOpen(false)
    setNotice(t('notice.finalTestReady'))
  }

  function finishPracticeStep() {
    if (!selectedCourse) return
    const isLastLetter = selectedCourseEarned + 1 >= badgeTotal(selectedCourse)
    if (isLastLetter) beginFinalTest()
    else completeLesson()
  }

  function resetForNextLetter() {
    recentPredictionsRef.current = []
    autoRecognitionPausedRef.current = false
    setPracticeMode('learn')
    setPrediction(null)
    setPracticeStatus('idle')
    setFailedAttempts(0)
    setReminderCycles(0)
    setGestureReminderOpen(false)
    setShowAsConfusionHint(false)
  }

  function deferCurrentLetter() {
    if (!activePracticeSign || learningQueue.length < 2) return
    const difficultSign = activePracticeSign
    setLearningQueue((current) => {
      const remaining = current.filter((sign) => sign.id !== difficultSign.id)
      return [...remaining, difficultSign]
    })
    resetForNextLetter()
    setNotice(t('notice.letterDeferred', { difficult: difficultSign.modelLabel }))
  }

  function useHelpForCurrentLetter() {
    if (!selectedCourse || !activePracticeSign || remainingHelpCredits <= 0 || practiceMode === 'quiz') return
    const nextCredits = remainingHelpCredits - 1
    const updatedCredits = { ...courseHelpCredits, [selectedCourse.id]: nextCredits }
    setCourseHelpCredits(updatedCredits)
    localStorage.setItem(`tunisign_course_helps_${account?.id ?? 'guest'}`, JSON.stringify(updatedCredits))
    setNotice(t('notice.helpUsed', { label: activePracticeSign.modelLabel, count: nextCredits }))
    completeLesson()
  }

  function advanceFinalTest() {
    const nextIndex = finalTestIndex + 1
    if (nextIndex >= finalTestSigns.length) {
      completeLesson()
      return
    }
    setFinalTestIndex(nextIndex)
    setQuizSign(finalTestSigns[nextIndex])
    recentPredictionsRef.current = []
    autoRecognitionPausedRef.current = false
    setPrediction(null)
    setPracticeStatus('analyzing')
    setFailedAttempts(0)
    setReminderCycles(0)
    setGestureReminderOpen(false)
  }

  function resumeAfterReminder() {
    if (reminderCycles >= 3) {
      if (practiceMode === 'quiz') {
        setFinalTestSigns((current) => {
          const reordered = [...current]
          const [difficultSign] = reordered.splice(finalTestIndex, 1)
          if (difficultSign) reordered.push(difficultSign)
          setQuizSign(reordered[finalTestIndex] || difficultSign || null)
          return reordered
        })
        setNotice(t('notice.testLetterDeferred'))
      } else if (activePracticeSign) {
        const difficultSign = activePracticeSign
        setLearningQueue((current) => {
          const remaining = current.filter((sign) => sign.id !== difficultSign.id)
          return [...remaining, difficultSign]
        })
        setPracticeMode('learn')
        setNotice(t('notice.letterDeferred', { difficult: difficultSign.modelLabel }))
      }
      setReminderCycles(0)
    } else {
      setNotice(t('notice.analysisResumed'))
    }
    recentPredictionsRef.current = []
    autoRecognitionPausedRef.current = false
    setPrediction(null)
    setPracticeStatus(practiceMode === 'quiz' || reminderCycles < 3 ? 'analyzing' : 'idle')
    setFailedAttempts(0)
    setGestureReminderOpen(false)
    setShowAsConfusionHint(false)
  }

  function toggleTheme() {
    setDarkMode((current) => {
      const next = !current
      localStorage.setItem('tunisign_theme', next ? 'dark' : 'light')
      return next
    })
  }

  async function startAnalysis() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      })
      streamRef.current = stream
      recentPredictionsRef.current = []
      autoRecognitionPausedRef.current = false
      setCameraActive(true)
      setPrediction(null)
      setPracticeStatus('analyzing')
      setNotice(t('notice.autoAnalysisStarted'))
    } catch {
      setNotice(t('notice.cameraError'))
    }
  }

  function completeLesson() {
    if (!selectedCourse) return
    const totalBadges = badgeTotal(selectedCourse)
    const currentBadges = courseBadgeProgress[selectedCourse.id] ?? 0
    const nextBadges = Math.min(currentBadges + 1, totalBadges)

    if (currentBadges >= totalBadges) {
      void openCertificate(selectedCourse)
      return
    }

    if (nextBadges > currentBadges) {
      const updatedProgress = { ...courseBadgeProgress, [selectedCourse.id]: nextBadges }
      setCourseBadgeProgress(updatedProgress)
      localStorage.setItem(`tunisign_badges_${account?.id ?? 'guest'}`, JSON.stringify(updatedProgress))
      setSessionXp((current) => current + 20)
      setCompletedLessons((current) => current + 1)
      setSessionStreak((current) => current + 1)
    }

    if (activePracticeSign) {
      setLearningQueue((current) => current.filter((sign) => sign.id !== activePracticeSign.id))
    }

    setRewardType(nextBadges >= totalBadges ? 'certificate' : 'badge')
    setPracticeMode('learn')
    setQuizSign(null)
    setFinalTestSigns([])
    setFinalTestIndex(0)
    setFailedAttempts(0)
    setReminderCycles(0)
    setGestureReminderOpen(false)
    setShowAsConfusionHint(false)
    setPrediction(null)
    setPracticeStatus('idle')
    setCelebrationOpen(true)
  }

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const email = String(data.get('email'))
    const password = String(data.get('password'))
    try {
      const response = isRegistering
        ? await api.register(String(data.get('firstName')), String(data.get('lastName')), email, password)
        : await api.login(email, password)
      if (response.twoFactorRequired && response.email) {
        setPendingTwoFactorEmail(response.email)
        navigate('twoFactor')
        setNotice(t('notice.twoFactorProtected'))
        return
      }
      if (!response.token) throw new Error(t('notice.loginError'))
      localStorage.setItem('tunisign_token', response.token)
      setIsAuthenticated(true)
      navigate('dashboard')
      setNotice(t('notice.loginWelcome'))
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t('notice.loginError'))
    }
  }

  function logout() {
    localStorage.removeItem('tunisign_token')
    setIsAuthenticated(false)
    navigate('home')
    setNotice(t('notice.logout'))
  }

  async function verifyTwoFactor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const code = String(new FormData(event.currentTarget).get('code'))
    try {
      const response = await api.verifyTwoFactor(pendingTwoFactorEmail, code)
      if (!response.token) throw new Error('Code invalide.')
      localStorage.setItem('tunisign_token', response.token)
      setIsAuthenticated(true); navigate('dashboard'); setNotice(t('notice.secureLogin'))
    } catch { setNotice(t('notice.invalid2fa')) }
  }

  async function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    try {
      const updated = await api.updateAccount(String(data.get('firstName')), String(data.get('lastName')), String(data.get('email')))
      setAccount(updated); setNotice(t('notice.profileSaved'))
    } catch { setNotice(t('notice.profileError')) }
  }

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    try { await api.changePassword(String(data.get('currentPassword')), String(data.get('newPassword'))); event.currentTarget.reset(); setNotice(t('notice.passwordSaved')) }
    catch { setNotice(t('notice.passwordError')) }
  }

  async function setupTwoFactor() {
    try { setTwoFactorSetup(await api.setupTwoFactor()) } catch { setNotice(t('notice.setup2faError')) }
  }

  async function enableTwoFactor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    try { await api.enableTwoFactor(String(data.get('code'))); setAccount((current) => current ? { ...current, twoFactorEnabled: true } : current); setTwoFactorSetup(null); setNotice(t('notice.twoFactorEnabled')) }
    catch { setNotice(t('notice.invalidCode')) }
  }

  const predictionScore = prediction ? Math.round(prediction.confidence * 100) : 0
  const expectedLabel = targetPracticeSign?.modelLabel?.trim() || ''
  const predictionMatches = Boolean(prediction) && (
    !expectedLabel || prediction!.label.toLocaleLowerCase() === expectedLabel.toLocaleLowerCase()
  )
  const predictionAccepted = predictionMatches && predictionScore >= ACCEPTANCE_CONFIDENCE * 100
  const isLastPracticeLetter = selectedCourse ? selectedCourseEarned + 1 >= badgeTotal(selectedCourse) : false
  const isLastFinalTestSign = finalTestIndex + 1 >= finalTestSigns.length

  return (
    <div className={`app-shell ${darkMode ? 'dark-mode' : ''}`} lang={language} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <header className="topbar">
        <button className="brand" onClick={() => navigate('home')} aria-label={`${t('nav.home')} TuniSign`}>
          <span className="brand-mark"><img src={tunisignLogo} alt="" /></span>
          <span className="brand-title"><strong>TuniSign</strong><small>{t('brand.subtitle')}</small></span>
        </button>
        <nav aria-label="Navigation principale">
          <button className={page === 'home' ? 'active' : ''} onClick={() => navigate('home')}>{t('nav.home')}</button>
          <button className={page === 'catalogue' || page === 'practice' ? 'active' : ''} onClick={() => navigate('catalogue')}>{t('nav.learn')}</button>
          <button className={page === 'dashboard' || page === 'settings' ? 'active' : ''} onClick={() => navigate('dashboard')}>{t('nav.space')}</button>
          <button className={page === 'rewards' ? 'active' : ''} onClick={() => navigate('rewards')}>{t('nav.rewards')}</button>
        </nav>
        <div className="topbar-actions">
          <label className="language-picker" aria-label="Language"><span>🌐</span><select value={language} onChange={(event) => setLanguage(event.target.value as Language)}><option value="fr">FR</option><option value="en">EN</option><option value="ar">عربي</option></select></label>
          <button className="theme-button" onClick={toggleTheme} aria-label={darkMode ? t('theme.light') : t('theme.dark')}>{darkMode ? '☀️' : '🌙'}</button>
          {isAuthenticated ? (
            <button className="ghost-button" onClick={logout}>{t('nav.logout')}</button>
          ) : (
            <button className="primary-button compact" onClick={() => navigate('auth')}>{t('nav.login')}</button>
          )}
        </div>
      </header>

      {usesDemoData && page !== 'verifyCertificate' && <div className="status-banner">{t('demo.banner')}</div>}
      {notice && <div className="notice">{notice}</div>}

      {page === 'verifyCertificate' && (
        <main className="verification-page">
          <section className={`verification-card ${certificateVerification?.valid ? 'valid' : 'invalid'}`}>
            <img className="verification-logo" src={tunisignLogo} alt="TuniSign SINA" />
            {verificationLoading ? (
              <><div className="verification-spinner" /><h1>{t('verification.loading')}</h1></>
            ) : certificateVerification?.valid ? (
              <>
                <div className="verification-status-icon">✓</div>
                <p className="eyebrow">{t('verification.eyebrow')}</p>
                <h1>{t('verification.validTitle')}</h1>
                <p className="verification-lead">{t('verification.validCopy')}</p>
                <dl className="verification-details">
                  <div><dt>{t('verification.holder')}</dt><dd>{certificateVerification.studentName}</dd></div>
                  <div><dt>{t('verification.course')}</dt><dd>{certificateVerification.courseTitle}</dd></div>
                  <div><dt>{t('verification.issued')}</dt><dd>{certificateVerification.issuedAt ? new Intl.DateTimeFormat(language === 'ar' ? 'ar-TN' : language === 'en' ? 'en-GB' : 'fr-FR').format(new Date(certificateVerification.issuedAt)) : '—'}</dd></div>
                  <div><dt>{t('verification.badges')}</dt><dd>{certificateVerification.earnedBadges} / {certificateVerification.requiredBadges}</dd></div>
                </dl>
                <div className="verification-proof"><span>🛡️</span><div><b>{certificateVerification.signatureAlgorithm}</b><small>{t('verification.fingerprint')} : {certificateVerification.publicKeyFingerprint}</small></div></div>
                <code className="verification-code">{certificateVerification.verificationCode}</code>
              </>
            ) : (
              <>
                <div className="verification-status-icon">!</div>
                <p className="eyebrow">{t('verification.eyebrow')}</p>
                <h1>{t('verification.invalidTitle')}</h1>
                <p className="verification-lead">{t('verification.invalidCopy')}</p>
                <code className="verification-code">{certificateVerification?.verificationCode || '—'}</code>
              </>
            )}
            {!verificationLoading && <button className="ghost-button" onClick={() => navigate('home')}>{t('verification.back')}</button>}
          </section>
        </main>
      )}

      {page === 'home' && (
        <main>
          <section className="hero">
            <div className="hero-particles" aria-hidden="true"><i /><i /><i /><i /></div>
            <img className="hero-logo-watermark" src={tunisignLogo} alt="" aria-hidden="true" />
            <div className="hero-copy-wrap">
              <p className="eyebrow hero-reveal hero-reveal-one">{t('home.eyebrow')}</p>
              <h1 className="hero-reveal hero-reveal-two">{isAuthenticated ? t('home.memberTitle', { name: account ? `${language === 'ar' ? '، ' : ', '}${account.firstName}` : '' }) : t('home.guestTitle')}</h1>
              <p className="hero-copy">{isAuthenticated ? t('home.memberCopy') : t('home.guestCopy')}</p>
              <div className="hero-actions hero-reveal hero-reveal-three">
                <button className="primary-button" onClick={() => navigate('catalogue')}>{isAuthenticated ? t('home.continue') : t('home.discover')}</button>
                {isAuthenticated ? (
                  <button className="text-button" onClick={() => navigate('dashboard')}>{t('home.viewSpace')}</button>
                ) : (
                  <button className="text-button" onClick={() => { setIsRegistering(true); navigate('auth') }}>{t('home.create')}</button>
                )}
              </div>
            </div>
            <div className="hero-card hero-reveal hero-reveal-four" aria-label="Aperçu de la pratique">
              <span className="live-indicator"><i /> {t('home.live')}</span>
              <span className="mascot-hand" aria-hidden="true">🤟</span>
              <div className="mascot-spark spark-one">✦</div>
              <div className="mascot-spark spark-two">✦</div>
              <p>{isAuthenticated ? t('home.nextGoal') : t('home.webcam')}</p>
              <strong>{isAuthenticated ? '01' : '87 %'}</strong>
              <small>{isAuthenticated ? t('home.lessonStart') : t('home.accuracy')}</small>
              <div className="streak-pill">{isAuthenticated ? t('home.xpEarn') : t('home.streak')}</div>
            </div>
          </section>
          <section className="feature-grid">
            <article><span>01</span><h2>{t('feature.guided')}</h2><p>{t('feature.guidedCopy')}</p><b>{t('feature.explore')}</b></article>
            <article><span>02</span><h2>{t('feature.visual')}</h2><p>{t('feature.visualCopy')}</p><b>{t('feature.practice')}</b></article>
            <article><span>03</span><h2>{t('feature.progress')}</h2><p>{t('feature.progressCopy')}</p><b>{t('feature.advance')}</b></article>
          </section>
        </main>
      )}

      {page === 'catalogue' && (
        <main className="content-page">
          <p className="eyebrow">{t('catalog.eyebrow')}</p>
          <h1>{t('catalog.title')}</h1>
          <p className="page-intro">{t('catalog.copy')}</p>
          <div className="category-row">
            <button className={selectedCategory === null ? 'filter active' : 'filter'} onClick={() => setSelectedCategory(null)}>{t('catalog.all')}</button>
            {categories.map((category) => <button key={category.id} className={selectedCategory === category.id ? 'filter active' : 'filter'} onClick={() => setSelectedCategory(category.id)}>{categoryLabel(category)}</button>)}
          </div>
          {loading ? <p>{t('catalog.loading')}</p> : (
            <section className="course-grid">
              {displayedCourses.map((course) => {
                const available = isCourseAvailable(course)
                const lessonCount = signs.filter((sign) => sign.courseId === course.id).length
                return <article className={`course-card ${available ? '' : 'course-locked'}`} key={course.id}>
                  <div className="course-card-top"><div className="course-number">{String(course.id).padStart(2, '0')}</div><span className="course-xp">+20 XP</span></div>
                  <div className="lesson-orb" aria-hidden="true">{available ? '🤟' : '🔒'}</div>
                  <h2>{courseTitle(course)}</h2>
                  <p>{courseCopy(course)}</p>
                  <div className="lesson-meta"><span>{lessonCount || '—'} {t('catalog.signs')}</span><span className="difficulty-dot">{available ? t('catalog.beginner') : t('catalog.comingSoon')}</span></div>
                  <button className="lesson-start" onClick={() => startLesson(course)} disabled={!available}>{available ? t('catalog.start') : t('catalog.modelRequired')} <span>{available ? '→' : '🔒'}</span></button>
                </article>
              })}
            </section>
          )}
        </main>
      )}

      {page === 'practice' && selectedCourse && (
        <main className="practice-page">
          <button className="back-button" onClick={() => navigate('catalogue')}>{t('practice.back')}</button>
          <section className="practice-layout">
            <div className="practice-stage">
              <div className="stage-header"><span>{t('practice.current')}</span><strong>{Math.min(selectedCourseEarned + 1, badgeTotal(selectedCourse))} / {badgeTotal(selectedCourse)}</strong></div>
              <div className="practice-progress"><span style={{ width: `${Math.max(8, (selectedCourseEarned / badgeTotal(selectedCourse)) * 100)}%` }} /></div>
              {practiceMode === 'learn' ? <>
                <div className="reference-stage">
                  <span className="step-pill">{t('practice.stepObserve')}</span>
                  <div className="reference-letter">{targetPracticeSign?.modelLabel}</div>
                  {targetPracticeSign?.imageUrl && <img src={targetPracticeSign.imageUrl} alt={t('practice.referenceAlt', { label: targetPracticeSign.modelLabel })} onError={(event) => event.currentTarget.remove()} />}
                  <strong>{targetPracticeSign?.modelLabel}</strong>
                </div>
                <p className="eyebrow">{t('practice.observe')}</p>
                <h1>{targetPracticeSign?.word || `${courseTitle(selectedCourse)} · ${selectedCourseEarned + 1}`}</h1>
                <p>{targetPracticeSign?.description || t('practice.observeCopy')}</p>
                <button className="primary-button practice-button" onClick={beginPractice}>{t('practice.readyToRepeat')}</button>
                <div className="practice-controls">
                  <button className="ghost-button" onClick={deferCurrentLetter} disabled={learningQueue.length < 2}>{t('practice.nextManual')}</button>
                  <button className="help-button" onClick={useHelpForCurrentLetter} disabled={remainingHelpCredits <= 0}>{t('practice.useHelp', { count: remainingHelpCredits })}</button>
                </div>
              </> : <>
                <div className={`camera-stage ${practiceStatus}`}>
                  <div className="camera-grid" aria-hidden="true" /><span className="camera-corner corner-one" /><span className="camera-corner corner-two" /><span className="camera-corner corner-three" /><span className="camera-corner corner-four" />
                  {cameraActive ? <video ref={videoRef} className="camera-video" autoPlay muted playsInline /> : <div className="sign-visual"><span>👋</span><i>✦</i><i>✦</i></div>}
                  {cameraActive && <div className="hand-guide" aria-hidden="true"><span>{t('practice.handZone')}</span></div>}
                  {practiceStatus === 'analyzing' && <div className="scanner-line" />}
                  <div className="camera-status"><i /> {practiceStatus === 'analyzing' ? t('practice.analyzing') : practiceStatus === 'no-hand' ? t('practice.noHand') : practiceStatus === 'ready' ? t('practice.detected') : cameraActive ? t('practice.cameraActive') : t('practice.cameraReady')}</div>
                </div>
                <p className="eyebrow">{practiceMode === 'quiz' ? t('practice.quizEyebrow') : t('practice.reproduce')}</p>
                <h1>{practiceMode === 'quiz' ? t('practice.finalTestPrompt', { label: targetPracticeSign?.modelLabel || '?', current: finalTestIndex + 1, total: finalTestSigns.length }) : targetPracticeSign?.word || `${courseTitle(selectedCourse)} · ${selectedCourseEarned + 1}`}</h1>
                <p>{practiceMode === 'quiz' ? t('practice.quizCopy') : t('practice.copy')}</p>
                <button className="primary-button practice-button" onClick={startAnalysis} disabled={cameraActive}>{cameraActive ? t('practice.autoActive') : t('practice.activate')}</button>
                {practiceMode !== 'quiz' && <div className="practice-controls">
                  <button className="ghost-button" onClick={deferCurrentLetter} disabled={learningQueue.length < 2}>{t('practice.nextManual')}</button>
                  <button className="help-button" onClick={useHelpForCurrentLetter} disabled={remainingHelpCredits <= 0}>{t('practice.useHelp', { count: remainingHelpCredits })}</button>
                </div>}
                {failedAttempts > 0 && <small className="attempt-counter">{t('practice.attemptCounter', { count: failedAttempts })}</small>}
                {showAsConfusionHint && <div className="confusion-hint"><span>👀</span><p>{t('practice.asConfusionHint')}</p></div>}
                <small className="model-notice">{['J', 'Z'].includes(targetPracticeSign?.modelLabel || '') ? t('practice.motionNotice') : t('practice.modelNotice')}</small>
              </>}
            </div>
            <aside className="practice-side">
              <div className="practice-side-summary"><div className="xp-badge">⚡ +20 XP</div><div className="help-counter">💡 {t('practice.helpsRemaining', { count: remainingHelpCredits })}</div></div>
              {practiceMode === 'learn' ? <div className="lesson-steps"><h2>{t('practice.methodTitle')}</h2><p><b>1</b>{t('practice.methodObserve')}</p><p><b>2</b>{t('practice.methodRepeat')}</p><p><b>3</b>{t('practice.methodTest')}</p><div className="tip-card"><span>💡</span><p>{t('practice.helpExplanation')}</p></div></div> : practiceStatus === 'ready' && prediction ? <><div className="score-ring" style={{ '--score': predictionScore } as CSSProperties}><strong>{predictionScore}%</strong><small>{t('practice.confidence')}</small></div><div className="analysis-checks"><p>{t('practice.predicted')} : <b>{prediction.label}</b></p>{expectedLabel && <p>{t('practice.expected')} : <b>{expectedLabel}</b></p>}{prediction.orientation && <p>{t('practice.orientationUsed')} : <b>{prediction.orientation === 'mirrored' ? t('practice.orientationMirrored') : t('practice.orientationOriginal')}</b></p>}{prediction.landmarkRefinement?.applied && <p>{t('practice.landmarkCorrection')} : <b>A/S</b></p>}<p className={predictionAccepted ? 'prediction-ok' : 'prediction-retry'}>{predictionAccepted ? t('practice.correct') : t('practice.incorrect')}</p></div>{predictionAccepted ? <button className="primary-button compact" onClick={practiceMode === 'quiz' ? advanceFinalTest : finishPracticeStep}>{practiceMode === 'quiz' ? isLastFinalTestSign ? t('practice.validateCourse') : t('practice.nextTestLetter') : isLastPracticeLetter ? t('practice.startFinalTest') : t('practice.finish')}</button> : <p className="retry-advice">{t('practice.retryAdvice')}</p>}</> : <><h2>{practiceMode === 'quiz' ? t('practice.finalTestTitle') : t('practice.goal')}</h2><p>{practiceMode === 'quiz' ? t('practice.finalTestGoal') : t('practice.goalCopy')}</p><div className="tip-card"><span>💡</span><p>{t('practice.tip')}</p></div></>}
            </aside>
          </section>
          {gestureReminderOpen && targetPracticeSign && <div className="gesture-reminder-overlay" role="dialog" aria-modal="true" aria-label={t('practice.reminderTitle')}>
            <section className="gesture-reminder-card"><p className="eyebrow">{t('practice.reminderEyebrow')} · {t('practice.reminderCycle', { current: reminderCycles })}</p><h2>{t('practice.reminderTitle')}</h2><p>{t('practice.reminderCopy', { count: 6 })}</p><div className="reminder-gesture"><div className="reference-letter">{targetPracticeSign.modelLabel}</div>{targetPracticeSign.imageUrl && <img src={targetPracticeSign.imageUrl} alt={t('practice.referenceAlt', { label: targetPracticeSign.modelLabel })} onError={(event) => event.currentTarget.remove()} />}</div><strong>{t('practice.reminderLabel', { label: targetPracticeSign.modelLabel })}</strong>{showAsConfusionHint && <div className="confusion-hint modal-hint"><span>👀</span><p>{t('practice.asConfusionHint')}</p></div>}<button className="primary-button" onClick={resumeAfterReminder}>{reminderCycles >= 3 ? t('practice.deferAndContinue', { label: targetPracticeSign.modelLabel }) : t('practice.resume')}</button></section>
          </div>}
        </main>
      )}

      {page === 'dashboard' && (
        <main className="content-page">
          <section className="profile-hero">
            <div className="profile-avatar">{account ? `${account.firstName.slice(0, 1)}${account.lastName.slice(0, 1)}` : 'TS'}</div>
            <div className="profile-summary"><p className="eyebrow">{t('dashboard.welcome')}</p><h1>{account ? `${account.firstName} ${account.lastName}` : t('dashboard.progress')}</h1><p>{account?.email || t('dashboard.loginCopy')}</p><div className="profile-tags"><span className="flame-tag">{t('dashboard.streak', { count: sessionStreak, plural: language === 'fr' && sessionStreak > 1 ? 's' : '' })}</span><span>⚡ {sessionXp} XP</span><span>{t('dashboard.secure')}</span></div></div>
            {isAuthenticated && <button className="settings-button" onClick={() => navigate('settings')}>{t('dashboard.settings')}</button>}
          </section>
          <section className="dashboard-focus">
            <article className="continue-card">
              <div><p className="eyebrow">{t('dashboard.continue')}</p><h2>{courses[0] ? courseTitle(courses[0]) : t('dashboard.firstSign')}</h2><p>{t('dashboard.continueCopy')}</p></div>
              <div className="course-progress"><span><i /></span><b>{completedLessons ? t('dashboard.completedOne') : t('dashboard.ready')}</b></div>
              <button className="primary-button compact" onClick={() => courses[0] && startLesson(courses[0])}>{t('dashboard.continueButton')}</button>
            </article>
            <article className="challenge-card"><span className="challenge-orb">🎯</span><div><p className="eyebrow">{t('dashboard.challenge')}</p><h2>{t('dashboard.master')}</h2><p>{t('dashboard.daily')}</p></div><div className="challenge-progress"><span style={{ width: `${Math.min(sessionXp / 2.5, 100)}%` }} /></div><small>{t('dashboard.reward', { xp: sessionXp })}</small></article>
          </section>
          <section className="stats-grid">
            <article><strong>{completedLessons}</strong><span>{t('dashboard.lessons')}</span></article>
            <article><strong>{completedLessons ? '87' : '0'} %</strong><span>{t('dashboard.average')}</span></article>
            <article><strong>{sessionXp}</strong><span>{t('dashboard.sessionXp')}</span></article>
          </section>
          <section className="learning-map-card">
            <div className="map-heading"><div><p className="eyebrow">{t('dashboard.path')}</p><h2>{t('dashboard.pathTitle')}</h2></div><span>{t('dashboard.levelGoal')}</span></div>
            <div className="learning-map">
              {courses.slice(0, 4).map((course, index) => <button key={course.id} className={`map-node ${index < completedLessons ? 'completed' : index === Math.min(completedLessons, Math.max(courses.length - 1, 0)) ? 'current' : 'locked'}`} onClick={() => startLesson(course)} disabled={index > completedLessons}><i>{index < completedLessons ? '★' : index === completedLessons ? '✦' : '🔒'}</i><span>{courseTitle(course)}</span></button>)}
            </div>
          </section>
          <article className="recommendation"><span>✦</span><div><h2>{t('dashboard.recommendation')}</h2><p>{t('dashboard.recommendationCopy')}</p></div><button className="primary-button compact" onClick={() => navigate('catalogue')}>{t('dashboard.viewLessons')}</button></article>
        </main>
      )}

      {page === 'rewards' && (
        <main className="content-page rewards-page">
          <p className="eyebrow">{t('rewards.eyebrow')}</p>
          <h1>{t('rewards.title')}</h1>
          <p className="page-intro">{t('rewards.copy')}</p>
          <section className="reward-summary">
            <article><span>🏅</span><strong>{earnedBadgeCount}</strong><p>{t('rewards.badges')}</p></article>
            <article><span>📜</span><strong>{earnedCertificateCount}</strong><p>{t('rewards.certificates')}</p></article>
          </section>
          {courses.length ? <section className="reward-course-grid">
            {courses.map((course) => {
              const total = badgeTotal(course)
              const earned = Math.min(courseBadgeProgress[course.id] ?? 0, total)
              const certificateUnlocked = earned === total
              const remaining = total - earned
              return <article className={`reward-course-card ${certificateUnlocked ? 'certificate-unlocked' : ''}`} key={course.id}>
                <header><div className="reward-course-icon">{certificateUnlocked ? '🏆' : '🤟'}</div><div><p className="eyebrow">{t('rewards.courseProgress')}</p><h2>{courseTitle(course)}</h2></div><strong>{Math.round((earned / total) * 100)}%</strong></header>
                <div className="reward-progress"><span style={{ width: `${(earned / total) * 100}%` }} /></div>
                <p className="badge-count">{t('rewards.badgeProgress', { earned, total, plural: language !== 'ar' && earned !== 1 ? 's' : '' })}</p>
                <div className="badge-collection">
                  {Array.from({ length: total }, (_, index) => {
                    const isEarned = index < earned
                    return <div className={`lesson-badge ${isEarned ? 'earned' : 'locked'}`} key={index}><span>{isEarned ? '★' : '🔒'}</span><b>{t('rewards.lessonBadge', { number: index + 1 })}</b><small>{isEarned ? t('rewards.earned') : t('rewards.locked')}</small></div>
                  })}
                </div>
                <div className={`course-certificate ${certificateUnlocked ? 'unlocked' : 'locked'}`}><span>{certificateUnlocked ? '📜' : '🔐'}</span><div><h3>{t('rewards.certificate')}</h3><p>{certificateUnlocked ? t('rewards.certificateReady') : t('rewards.certificateLocked', { remaining, plural: language !== 'ar' && remaining !== 1 ? 's' : '' })}</p></div>{certificateUnlocked && <button className="primary-button compact" disabled={certificateLoadingId === course.id} onClick={() => void openCertificate(course)}>{certificateLoadingId === course.id ? t('certificate.issuing') : t('rewards.viewCertificate')}</button>}</div>
              </article>
            })}
          </section> : <p>{t('rewards.empty')}</p>}
        </main>
      )}

      {page === 'settings' && (
        <main className="content-page settings-page">
          <button className="back-button" onClick={() => navigate('dashboard')}>{t('settings.back')}</button>
          <div className="section-heading"><div><p className="eyebrow">{t('settings.eyebrow')}</p><h2>{t('settings.title')}</h2></div>{account && <div className="account-avatar">{account.firstName.slice(0, 1)}{account.lastName.slice(0, 1)}</div>}</div>
          {account ? <div className="account-grid">
              <form className="account-card" onSubmit={updateProfile}><h3>{t('settings.personal')}</h3><p>{t('settings.personalCopy')}</p><div className="form-row"><label>{t('settings.firstName')}<input name="firstName" defaultValue={account.firstName} required /></label><label>{t('settings.lastName')}<input name="lastName" defaultValue={account.lastName} required /></label></div><label>{t('settings.email')}<input name="email" type="email" defaultValue={account.email} required /></label><button className="primary-button compact" type="submit">{t('settings.save')}</button></form>
              <form className="account-card" onSubmit={updatePassword}><h3>{t('settings.password')}</h3><p>{t('settings.passwordCopy')}</p><label>{t('settings.currentPassword')}<input name="currentPassword" type="password" required /></label><label>{t('settings.newPassword')}<input name="newPassword" type="password" minLength={8} required /></label><button className="primary-button compact" type="submit">{t('settings.changePassword')}</button></form>
              <article className="account-card two-factor-card"><div className="two-factor-title"><span>🔐</span><div><h3>Google Authenticator</h3><p>{account.twoFactorEnabled ? t('settings.twoFactorOn') : t('settings.twoFactorOff')}</p></div></div>{!account.twoFactorEnabled && !twoFactorSetup && <button className="primary-button compact" onClick={setupTwoFactor}>{t('settings.configure2fa')}</button>}{twoFactorSetup && <form className="two-factor-setup" onSubmit={enableTwoFactor}><p>{t('settings.manualKey')}</p><code>{twoFactorSetup.secret}</code><small>{t('settings.account')} : {account.email} · {t('settings.timeBased')}</small><label>{t('settings.sixDigit')}<input name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} placeholder="123456" required /></label><button className="primary-button compact" type="submit">{t('settings.enable2fa')}</button></form>}</article>
            </div>
          : <p>{t('settings.loading')}</p>}
        </main>
      )}

      {page === 'auth' && (
        <main className="auth-page">
          <section className="auth-card">
            <p className="eyebrow">{isRegistering ? t('auth.new') : t('auth.return')}</p>
            <h1>{isRegistering ? t('auth.join') : t('auth.login')}</h1>
            <form onSubmit={submitAuth}>
              {isRegistering && <div className="form-row"><label>{t('settings.firstName')}<input required name="firstName" /></label><label>{t('settings.lastName')}<input required name="lastName" /></label></div>}
              <label>{t('auth.email')}<input required type="email" name="email" placeholder="nom@exemple.com" /></label>
              <label>{t('auth.password')}<input required minLength={6} type="password" name="password" placeholder={t('auth.passwordPlaceholder')} /></label>
              <button className="primary-button" type="submit">{isRegistering ? t('auth.create') : t('auth.connection')}</button>
            </form>
            <button className="text-button" onClick={() => setIsRegistering(!isRegistering)}>{isRegistering ? t('auth.haveAccount') : t('auth.createAccount')}</button>
          </section>
        </main>
      )}

      {page === 'twoFactor' && (
        <main className="auth-page">
          <section className="auth-card two-factor-login">
            <div className="security-icon">🔐</div>
            <p className="eyebrow">{t('twoFactor.eyebrow')}</p>
            <h1>{t('twoFactor.title')}</h1>
            <p>{t('twoFactor.copy')} <strong>{pendingTwoFactorEmail}</strong>.</p>
            <form onSubmit={verifyTwoFactor}>
              <label>{t('twoFactor.code')}<input name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} placeholder="123456" autoFocus required /></label>
              <button className="primary-button" type="submit">{t('twoFactor.verify')}</button>
            </form>
            <button className="text-button" onClick={() => navigate('auth')}>{t('twoFactor.back')}</button>
          </section>
        </main>
      )}

      {celebrationOpen && <div className="celebration-overlay" role="dialog" aria-modal="true" aria-label="Leçon terminée">
        <div className="confetti" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
        <section className="celebration-card"><span className="celebration-medal">{rewardType === 'certificate' ? '📜' : '🏅'}</span><p className="eyebrow">{t('celebration.eyebrow')}</p><h1>{rewardType === 'certificate' ? t('celebration.certificateTitle') : t('celebration.badgeTitle')}</h1><p>{rewardType === 'certificate' ? t('celebration.certificateCopy') : t('celebration.badgeCopy')}</p><strong>+20 XP</strong><div className="celebration-stars" aria-label="Trois étoiles">★ ★ ★</div><button className="primary-button" onClick={() => { setCelebrationOpen(false); if (selectedCourseComplete) navigate('rewards') }}>{selectedCourseComplete ? t('celebration.viewRewards') : t('celebration.nextLetter')}</button></section>
      </div>}

      {selectedCertificate && <div className="certificate-overlay" role="dialog" aria-modal="true">
        <section className="certificate-sheet">
          <div className="certificate-border">
            <img src={tunisignLogo} alt="TuniSign" />
            <p className="certificate-kicker">{t('certificate.awarded')}</p>
            <h1>{selectedCertificate.credential.courseTitle || courseTitle(selectedCertificate.course)}</h1>
            <p>{t('certificate.certifies')}</p>
            <h2>{selectedCertificate.credential.studentName || t('certificate.student')}</h2>
            <p>{t('certificate.completed')}</p>
            <strong>{selectedCertificate.credential.courseTitle || courseTitle(selectedCertificate.course)}</strong>
            <div className="certificate-seal">🏆<small>TuniSign</small></div>
            <p className="certificate-date">{t('certificate.date', { date: selectedCertificate.credential.issuedAt ? new Intl.DateTimeFormat(language === 'ar' ? 'ar-TN' : language === 'en' ? 'en-GB' : 'fr-FR').format(new Date(selectedCertificate.credential.issuedAt)) : '—' })}</p>
            <div className="certificate-proof">
              <div className="certificate-signature"><span /><b>TuniSign · SINA</b><small>✓ {t('certificate.digitallySigned')} · {selectedCertificate.credential.signatureAlgorithm}</small></div>
              {selectedCertificate.credential.qrCodeDataUrl && <a href={selectedCertificate.credential.verificationUrl} target="_blank" rel="noreferrer" className="certificate-qr"><img src={selectedCertificate.credential.qrCodeDataUrl} alt={t('certificate.qrAlt')} /><small>{t('certificate.scanQr')}</small></a>}
            </div>
            <p className="certificate-id">{t('certificate.verificationCode')} <code>{selectedCertificate.credential.verificationCode}</code></p>
            <p className="certificate-fingerprint">{t('verification.fingerprint')} : {selectedCertificate.credential.publicKeyFingerprint}</p>
          </div>
          <div className="certificate-actions"><button className="ghost-button" onClick={() => setSelectedCertificate(null)}>{t('certificate.close')}</button><a className="ghost-button certificate-verify-link" href={selectedCertificate.credential.verificationUrl} target="_blank" rel="noreferrer">{t('certificate.verifyOnline')}</a><button className="primary-button compact" onClick={() => window.print()}>{t('certificate.print')}</button></div>
        </section>
      </div>}
    </div>
  )
}

export default App
