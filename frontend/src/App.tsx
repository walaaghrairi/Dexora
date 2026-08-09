import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { api } from './services/api'
import type { Category, Course, Sign } from './types/api'

type Page = 'home' | 'catalogue' | 'dashboard' | 'auth'

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
  const [isRegistering, setIsRegistering] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(localStorage.getItem('tunisign_token')))

  useEffect(() => {
    Promise.all([api.categories(), api.courses(), api.signs()])
      .then(([loadedCategories, loadedCourses, loadedSigns]) => {
        setCategories(loadedCategories)
        setCourses(loadedCourses)
        setSigns(loadedSigns)
      })
      .catch(() => {
        setCategories(demoCategories)
        setCourses(demoCourses)
        setUsesDemoData(true)
      })
      .finally(() => setLoading(false))
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

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const email = String(data.get('email'))
    const password = String(data.get('password'))
    try {
      const response = isRegistering
        ? await api.register(String(data.get('firstName')), String(data.get('lastName')), email, password)
        : await api.login(email, password)
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
              <span className="camera-icon">⌁</span>
              <p>Pratique devant la webcam</p>
              <strong>87 %</strong>
              <small>Score de précision</small>
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
                  <div className="course-number">{String(course.id).padStart(2, '0')}</div>
                  <h2>{course.title}</h2>
                  <p>{course.description || 'Une leçon pour progresser à votre rythme.'}</p>
                  <span>{signs.filter((sign) => sign.courseId === course.id).length || '—'} signes</span>
                  <button className="text-button" onClick={() => setNotice('La page de pratique webcam sera ajoutée dans la prochaine étape.')}>Commencer →</button>
                </article>
              ))}
            </section>
          )}
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
