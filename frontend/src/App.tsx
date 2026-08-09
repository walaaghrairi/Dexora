import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import { api } from './services/api'
import type { Account, Category, Course, Sign, TwoFactorSetup } from './types/api'
import tunisignLogo from './assets/tunisign-sina-logo.png'
import { translate, type Language, type TranslationKey } from './i18n'

type Page = 'home' | 'catalogue' | 'dashboard' | 'rewards' | 'settings' | 'auth' | 'practice' | 'twoFactor'
type PracticeStatus = 'idle' | 'analyzing' | 'ready'
type RewardType = 'badge' | 'certificate'

const demoCategories: Category[] = [
  { id: 1, name: 'Salutations', description: 'Les expressions essentielles pour commencer une conversation.' },
  { id: 2, name: 'Vie quotidienne', description: 'Les signes utiles à la maison, à l’école et dans la rue.' },
  { id: 3, name: 'Vocabulaire médical', description: 'Communiquer clairement dans les situations de santé.' },
]

const demoCourses: Course[] = [
  { id: 1, title: 'Premiers signes', description: 'Bonjour, merci, au revoir et comment ça va ?', categoryId: 1 },
  { id: 2, title: 'Ma famille', description: 'Présenter les membres de la famille.', categoryId: 2 },
  { id: 3, title: 'Urgences', description: 'Exprimer la douleur et demander de l’aide.', categoryId: 3 },
]

function App() {
  const [page, setPage] = useState<Page>('home')
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
  const [celebrationOpen, setCelebrationOpen] = useState(false)
  const [sessionXp, setSessionXp] = useState(0)
  const [completedLessons, setCompletedLessons] = useState(0)
  const [sessionStreak, setSessionStreak] = useState(0)
  const [courseBadgeProgress, setCourseBadgeProgress] = useState<Record<number, number>>({})
  const [rewardType, setRewardType] = useState<RewardType>('badge')
  const [selectedCertificate, setSelectedCertificate] = useState<Course | null>(null)
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
    Promise.allSettled([api.categories(), api.courses(), api.signs()])
      .then(([categoriesResult, coursesResult, signsResult]) => {
        const hasLearningData = categoriesResult.status === 'fulfilled' && coursesResult.status === 'fulfilled'
        if (!hasLearningData) {
          setCategories(demoCategories)
          setCourses(demoCourses)
          setSigns([])
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
        setSigns([])
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

  const displayedCourses = useMemo(
    () => selectedCategory === null ? courses : courses.filter((course) => course.categoryId === selectedCategory),
    [courses, selectedCategory],
  )

  const earnedBadgeCount = Object.values(courseBadgeProgress).reduce((total, value) => total + value, 0)
  const earnedCertificateCount = courses.filter((course) => (courseBadgeProgress[course.id] ?? 0) >= badgeTotal(course)).length

  const selectedCourseSigns = selectedCourse ? signs.filter((sign) => sign.courseId === selectedCourse.id) : []
  const selectedCourseEarned = selectedCourse ? courseBadgeProgress[selectedCourse.id] ?? 0 : 0
  const activePracticeSign = selectedCourseSigns[Math.min(selectedCourseEarned, Math.max(selectedCourseSigns.length - 1, 0))]

  function categoryLabel(category: Category) {
    const keys: Record<number, TranslationKey> = { 1: 'category.greetings', 2: 'category.daily', 3: 'category.medical' }
    return keys[category.id] ? t(keys[category.id]) : category.name
  }

  function courseTitle(course: Course) {
    const keys: Record<number, TranslationKey> = { 1: 'course.first', 2: 'course.family', 3: 'course.emergency' }
    return keys[course.id] ? t(keys[course.id]) : course.title
  }

  function courseCopy(course: Course) {
    const keys: Record<number, TranslationKey> = { 1: 'course.firstCopy', 2: 'course.familyCopy', 3: 'course.emergencyCopy' }
    return keys[course.id] ? t(keys[course.id]) : course.description || t('catalog.defaultCopy')
  }

  function badgeTotal(course: Course) {
    const lessonCount = signs.filter((sign) => sign.courseId === course.id).length
    return lessonCount || 3
  }

  function navigate(nextPage: Page) {
    setNotice('')
    setPage(nextPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function startLesson(course: Course) {
    setSelectedCourse(course)
    setPracticeStatus('idle')
    navigate('practice')
  }

  function toggleTheme() {
    setDarkMode((current) => {
      const next = !current
      localStorage.setItem('tunisign_theme', next ? 'dark' : 'light')
      return next
    })
  }

  function startAnalysis() {
    setPracticeStatus('analyzing')
    setNotice(t('notice.analysis'))
    window.setTimeout(() => {
      setPracticeStatus('ready')
      setNotice(t('notice.analysisReady'))
    }, 1500)
  }

  function completeLesson() {
    if (!selectedCourse) return
    const totalBadges = badgeTotal(selectedCourse)
    const currentBadges = courseBadgeProgress[selectedCourse.id] ?? 0
    const nextBadges = Math.min(currentBadges + 1, totalBadges)

    if (currentBadges >= totalBadges) {
      setSelectedCertificate(selectedCourse)
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

    setRewardType(nextBadges >= totalBadges ? 'certificate' : 'badge')
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

      {usesDemoData && <div className="status-banner">{t('demo.banner')}</div>}
      {notice && <div className="notice">{notice}</div>}

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
              {displayedCourses.map((course) => (
                <article className="course-card" key={course.id}>
                  <div className="course-card-top"><div className="course-number">{String(course.id).padStart(2, '0')}</div><span className="course-xp">+20 XP</span></div>
                  <div className="lesson-orb" aria-hidden="true">🤟</div>
                  <h2>{courseTitle(course)}</h2>
                  <p>{courseCopy(course)}</p>
                  <div className="lesson-meta"><span>{signs.filter((sign) => sign.courseId === course.id).length || '—'} {t('catalog.signs')}</span><span className="difficulty-dot">{t('catalog.beginner')}</span></div>
                  <button className="lesson-start" onClick={() => startLesson(course)}>{t('catalog.start')} <span>→</span></button>
                </article>
              ))}
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
              <div className={`camera-stage ${practiceStatus}`}>
                <div className="camera-grid" aria-hidden="true" /><span className="camera-corner corner-one" /><span className="camera-corner corner-two" /><span className="camera-corner corner-three" /><span className="camera-corner corner-four" />
                <div className="sign-visual"><span>👋</span><i>✦</i><i>✦</i></div>
                {practiceStatus === 'analyzing' && <div className="scanner-line" />}
                <div className="camera-status"><i /> {practiceStatus === 'analyzing' ? t('practice.analyzing') : practiceStatus === 'ready' ? t('practice.detected') : t('practice.cameraReady')}</div>
              </div>
              <p className="eyebrow">{t('practice.reproduce')}</p>
              <h1>{activePracticeSign?.word || `${courseTitle(selectedCourse)} · ${selectedCourseEarned + 1}`}</h1>
              <p>{t('practice.copy')}</p>
              <button className="primary-button practice-button" onClick={startAnalysis} disabled={practiceStatus === 'analyzing'}>{practiceStatus === 'analyzing' ? t('practice.analyzingButton') : practiceStatus === 'ready' ? t('practice.retry') : t('practice.activate')}</button>
            </div>
            <aside className="practice-side">
              <div className="xp-badge">⚡ +20 XP</div>
              {practiceStatus === 'ready' ? <><div className="score-ring" style={{ '--score': 87 } as CSSProperties}><strong>87%</strong><small>{t('practice.excellent')}</small></div><div className="analysis-checks"><p>{t('practice.handPosition')}</p><p>{t('practice.posture')}</p><p>{t('practice.orientation')}</p></div><button className="primary-button compact" onClick={completeLesson}>{t('practice.finish')}</button></> : <><h2>{t('practice.goal')}</h2><p>{t('practice.goalCopy')}</p><div className="tip-card"><span>💡</span><p>{t('practice.tip')}</p></div></>}
            </aside>
          </section>
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
                <div className={`course-certificate ${certificateUnlocked ? 'unlocked' : 'locked'}`}><span>{certificateUnlocked ? '📜' : '🔐'}</span><div><h3>{t('rewards.certificate')}</h3><p>{certificateUnlocked ? t('rewards.certificateReady') : t('rewards.certificateLocked', { remaining, plural: language !== 'ar' && remaining !== 1 ? 's' : '' })}</p></div>{certificateUnlocked && <button className="primary-button compact" onClick={() => setSelectedCertificate(course)}>{t('rewards.viewCertificate')}</button>}</div>
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
        <section className="celebration-card"><span className="celebration-medal">{rewardType === 'certificate' ? '📜' : '🏅'}</span><p className="eyebrow">{t('celebration.eyebrow')}</p><h1>{rewardType === 'certificate' ? t('celebration.certificateTitle') : t('celebration.badgeTitle')}</h1><p>{rewardType === 'certificate' ? t('celebration.certificateCopy') : t('celebration.badgeCopy')}</p><strong>+20 XP</strong><div className="celebration-stars" aria-label="Trois étoiles">★ ★ ★</div><button className="primary-button" onClick={() => { setCelebrationOpen(false); navigate('rewards') }}>{t('celebration.viewRewards')}</button></section>
      </div>}

      {selectedCertificate && <div className="certificate-overlay" role="dialog" aria-modal="true">
        <section className="certificate-sheet">
          <div className="certificate-border"><img src={tunisignLogo} alt="TuniSign" /><p className="certificate-kicker">{t('certificate.awarded')}</p><h1>{courseTitle(selectedCertificate)}</h1><p>{t('certificate.certifies')}</p><h2>{account ? `${account.firstName} ${account.lastName}` : t('certificate.student')}</h2><p>{t('certificate.completed')}</p><strong>{courseTitle(selectedCertificate)}</strong><div className="certificate-seal">🏆<small>TuniSign</small></div><p className="certificate-date">{t('certificate.date', { date: new Intl.DateTimeFormat(language === 'ar' ? 'ar-TN' : language === 'en' ? 'en-GB' : 'fr-FR').format(new Date()) })}</p><div className="certificate-signature"><span /><b>TuniSign · SINA</b></div></div>
          <div className="certificate-actions"><button className="ghost-button" onClick={() => setSelectedCertificate(null)}>{t('certificate.close')}</button><button className="primary-button compact" onClick={() => window.print()}>{t('certificate.print')}</button></div>
        </section>
      </div>}
    </div>
  )
}

export default App
