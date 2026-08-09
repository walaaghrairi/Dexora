import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { api } from './services/api'
import type { Account, Category, Course, Sign, TwoFactorSetup } from './types/api'

type Page = 'home' | 'catalogue' | 'dashboard' | 'auth' | 'practice'

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
    api.account().then(setAccount).catch(() => setNotice('Impossible de charger votre profil.'))
  }, [isAuthenticated])

  const displayedCourses = useMemo(
    () => selectedCategory === null ? courses : courses.filter((course) => course.categoryId === selectedCategory),
    [courses, selectedCategory],
  )

  function navigate(nextPage: Page) {
    setNotice('')
    setPage(nextPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function startLesson(course: Course) {
    setSelectedCourse(course)
    navigate('practice')
  }

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const email = String(data.get('email'))
    const password = String(data.get('password'))
    try {
      const response = isRegistering
        ? await api.register(String(data.get('firstName')), String(data.get('lastName')), email, password)
        : await api.login(email, password, String(data.get('twoFactorCode') || ''))
      localStorage.setItem('tunisign_token', response.token)
      setIsAuthenticated(true)
      navigate('dashboard')
      setNotice('Bienvenue dans TuniSign. Votre session est ouverte.')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Connexion impossible.')
    }
  }

  function logout() {
    localStorage.removeItem('tunisign_token')
    setIsAuthenticated(false)
    navigate('home')
    setNotice('Vous êtes déconnecté(e).')
  }

  async function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    try {
      const updated = await api.updateAccount(String(data.get('firstName')), String(data.get('lastName')), String(data.get('email')))
      setAccount(updated); setNotice('Vos informations personnelles sont enregistrées.')
    } catch { setNotice('Impossible d’enregistrer le profil.') }
  }

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    try { await api.changePassword(String(data.get('currentPassword')), String(data.get('newPassword'))); event.currentTarget.reset(); setNotice('Votre mot de passe a été modifié.') }
    catch { setNotice('Le mot de passe actuel est incorrect ou le nouveau mot de passe est invalide.') }
  }

  async function setupTwoFactor() {
    try { setTwoFactorSetup(await api.setupTwoFactor()) } catch { setNotice('Impossible de préparer la 2FA.') }
  }

  async function enableTwoFactor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    try { await api.enableTwoFactor(String(data.get('code'))); setAccount((current) => current ? { ...current, twoFactorEnabled: true } : current); setTwoFactorSetup(null); setNotice('Google Authenticator est activé.') }
    catch { setNotice('Le code à six chiffres est incorrect.') }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => navigate('home')} aria-label="Accueil TuniSign">
          <span className="brand-mark">TS</span>
          <span>TuniSign</span>
        </button>
        <nav aria-label="Navigation principale">
          <button onClick={() => navigate('home')}>Accueil</button>
          <button onClick={() => navigate('catalogue')}>Apprendre</button>
          <button onClick={() => navigate('dashboard')}>Mon espace</button>
        </nav>
        {isAuthenticated ? (
          <button className="ghost-button" onClick={logout}>Déconnexion</button>
        ) : (
          <button className="primary-button compact" onClick={() => navigate('auth')}>Se connecter</button>
        )}
      </header>

      {usesDemoData && <div className="status-banner">Mode démonstration : démarrez le backend pour afficher les données réelles.</div>}
      {notice && <div className="notice">{notice}</div>}

      {page === 'home' && (
        <main>
          <section className="hero">
            <div>
              <p className="eyebrow">LANGUE DES SIGNES TUNISIENNE</p>
              <h1>Apprendre, pratiquer, progresser.</h1>
              <p className="hero-copy">TuniSign transforme l’apprentissage de la langue des signes tunisienne en une expérience visuelle, simple et motivante.</p>
              <div className="hero-actions">
                <button className="primary-button" onClick={() => navigate('catalogue')}>Découvrir les leçons</button>
                <button className="text-button" onClick={() => navigate('auth')}>Créer un compte →</button>
              </div>
            </div>
            <div className="hero-card" aria-label="Aperçu de la pratique">
              <span className="mascot-hand" aria-hidden="true">🤟</span>
              <div className="mascot-spark spark-one">✦</div>
              <div className="mascot-spark spark-two">✦</div>
              <p>Pratique devant la webcam</p>
              <strong>87 %</strong>
              <small>Score de précision</small>
              <div className="streak-pill">🔥 Série de 4 jours</div>
            </div>
          </section>
          <section className="feature-grid">
            <article><span>01</span><h2>Leçons guidées</h2><p>Des catégories utiles et des parcours progressifs.</p></article>
            <article><span>02</span><h2>Correction visuelle</h2><p>Un retour immédiat pour améliorer chaque geste.</p></article>
            <article><span>03</span><h2>Progression suivie</h2><p>Des recommandations adaptées à votre rythme.</p></article>
          </section>
        </main>
      )}

      {page === 'catalogue' && (
        <main className="content-page">
          <p className="eyebrow">PARCOURS D’APPRENTISSAGE</p>
          <h1>Choisissez une catégorie</h1>
          <p className="page-intro">Explorez les leçons et entraînez-vous signe par signe.</p>
          <div className="category-row">
            <button className={selectedCategory === null ? 'filter active' : 'filter'} onClick={() => setSelectedCategory(null)}>Toutes</button>
            {categories.map((category) => <button key={category.id} className={selectedCategory === category.id ? 'filter active' : 'filter'} onClick={() => setSelectedCategory(category.id)}>{category.name}</button>)}
          </div>
          {loading ? <p>Chargement des leçons…</p> : (
            <section className="course-grid">
              {displayedCourses.map((course) => (
                <article className="course-card" key={course.id}>
                  <div className="course-card-top"><div className="course-number">{String(course.id).padStart(2, '0')}</div><span className="course-xp">+20 XP</span></div>
                  <div className="lesson-orb" aria-hidden="true">🤟</div>
                  <h2>{course.title}</h2>
                  <p>{course.description || 'Une leçon pour progresser à votre rythme.'}</p>
                  <div className="lesson-meta"><span>{signs.filter((sign) => sign.courseId === course.id).length || '—'} signes</span><span className="difficulty-dot">Débutant</span></div>
                  <button className="lesson-start" onClick={() => startLesson(course)}>Commencer <span>→</span></button>
                </article>
              ))}
            </section>
          )}
        </main>
      )}

      {page === 'practice' && selectedCourse && (
        <main className="practice-page">
          <button className="back-button" onClick={() => navigate('catalogue')}>← Retour aux leçons</button>
          <section className="practice-layout">
            <div className="practice-stage">
              <div className="stage-header"><span>LEÇON EN COURS</span><strong>1 / {Math.max(signs.filter((sign) => sign.courseId === selectedCourse.id).length, 1)}</strong></div>
              <div className="practice-progress"><span /></div>
              <div className="sign-visual"><span>👋</span><i>✦</i><i>✦</i></div>
              <p className="eyebrow">REPRODUIS LE SIGNE</p>
              <h1>{signs.find((sign) => sign.courseId === selectedCourse.id)?.word || selectedCourse.title}</h1>
              <p>Place-toi devant la caméra quand tu es prêt(e). Tu recevras une correction visuelle en direct.</p>
              <button className="primary-button practice-button" onClick={() => setNotice('La caméra sera connectée au service IA dans la prochaine version.')}>Activer la caméra</button>
            </div>
            <aside className="practice-side">
              <div className="xp-badge">⚡ +20 XP</div>
              <h2>Ton objectif</h2>
              <p>Reproduis le signe avec une précision de 80 % ou plus.</p>
              <div className="tip-card"><span>💡</span><p>Regarde bien l’orientation de la main avant de commencer.</p></div>
            </aside>
          </section>
        </main>
      )}

      {page === 'dashboard' && (
        <main className="content-page">
          <p className="eyebrow">MON ESPACE</p>
          <h1>{isAuthenticated ? 'Votre progression' : 'Suivez votre progression'}</h1>
          <p className="page-intro">{isAuthenticated ? 'Reprenez votre apprentissage là où vous vous êtes arrêté(e).' : 'Connectez-vous pour enregistrer vos résultats et obtenir des recommandations.'}</p>
          <section className="stats-grid">
            <article><strong>0</strong><span>Leçons terminées</span></article>
            <article><strong>0 %</strong><span>Précision moyenne</span></article>
            <article><strong>0</strong><span>Badges obtenus</span></article>
          </section>
          <article className="recommendation"><span>✦</span><div><h2>Recommandation</h2><p>Commencez par la catégorie « Salutations » et entraînez-vous régulièrement.</p></div><button className="primary-button compact" onClick={() => navigate('catalogue')}>Voir les leçons</button></article>
          {isAuthenticated && account && <section className="account-section">
            <div className="section-heading"><div><p className="eyebrow">PARAMÈTRES DU COMPTE</p><h2>Mon profil et ma sécurité</h2></div><div className="account-avatar">{account.firstName.slice(0, 1)}{account.lastName.slice(0, 1)}</div></div>
            <div className="account-grid">
              <form className="account-card" onSubmit={updateProfile}><h3>Informations personnelles</h3><p>Modifiez vos informations de connexion.</p><div className="form-row"><label>Prénom<input name="firstName" defaultValue={account.firstName} required /></label><label>Nom<input name="lastName" defaultValue={account.lastName} required /></label></div><label>E-mail<input name="email" type="email" defaultValue={account.email} required /></label><button className="primary-button compact" type="submit">Enregistrer</button></form>
              <form className="account-card" onSubmit={updatePassword}><h3>Mot de passe</h3><p>Choisissez un mot de passe robuste.</p><label>Mot de passe actuel<input name="currentPassword" type="password" required /></label><label>Nouveau mot de passe<input name="newPassword" type="password" minLength={8} required /></label><button className="primary-button compact" type="submit">Modifier le mot de passe</button></form>
              <article className="account-card two-factor-card"><div className="two-factor-title"><span>🔐</span><div><h3>Google Authenticator</h3><p>{account.twoFactorEnabled ? '2FA activée : votre compte est protégé.' : 'Ajoutez une seconde protection à votre compte.'}</p></div></div>{!account.twoFactorEnabled && !twoFactorSetup && <button className="primary-button compact" onClick={setupTwoFactor}>Configurer la 2FA</button>}{twoFactorSetup && <form className="two-factor-setup" onSubmit={enableTwoFactor}><p>Dans Google Authenticator, ajoutez une clé de configuration manuelle :</p><code>{twoFactorSetup.secret}</code><small>Compte : {account.email} · Type : Basé sur l’heure</small><label>Code à six chiffres<input name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} placeholder="123456" required /></label><button className="primary-button compact" type="submit">Vérifier et activer</button></form>}</article>
            </div>
          </section>}
        </main>
      )}

      {page === 'auth' && (
        <main className="auth-page">
          <section className="auth-card">
            <p className="eyebrow">{isRegistering ? 'NOUVEAU COMPTE' : 'BON RETOUR'}</p>
            <h1>{isRegistering ? 'Rejoindre TuniSign' : 'Se connecter'}</h1>
            <form onSubmit={submitAuth}>
              {isRegistering && <div className="form-row"><label>Prénom<input required name="firstName" /></label><label>Nom<input required name="lastName" /></label></div>}
              <label>E-mail<input required type="email" name="email" placeholder="nom@exemple.com" /></label>
              <label>Mot de passe<input required minLength={6} type="password" name="password" placeholder="Minimum 6 caractères" /></label>
              {!isRegistering && <label>Code Google Authenticator <span className="optional-label">(si la 2FA est activée)</span><input inputMode="numeric" name="twoFactorCode" maxLength={6} placeholder="123456" /></label>}
              <button className="primary-button" type="submit">{isRegistering ? 'Créer mon compte' : 'Connexion'}</button>
            </form>
            <button className="text-button" onClick={() => setIsRegistering(!isRegistering)}>{isRegistering ? 'J’ai déjà un compte' : 'Créer un compte'}</button>
          </section>
        </main>
      )}
    </div>
  )
}

export default App
