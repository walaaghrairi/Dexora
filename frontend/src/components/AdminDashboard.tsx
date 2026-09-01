import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { api } from '../services/api'
import type { Account, AdminDashboardStats, Category, Course, Sign } from '../types/api'
import type { Language } from '../i18n'

type AdminTab = 'overview' | 'users' | 'courses' | 'content'

type Props = {
  language: Language
  currentUserId: number
  onContentChanged: () => void
}

const copy = {
  fr: {
    eyebrow: 'CENTRE DE CONTRÔLE', title: 'Dashboard Administrateur', subtitle: 'Gérez la communauté, les cours et le contenu TuniSign depuis un seul espace.',
    overview: 'Vue générale', users: 'Utilisateurs', courses: 'Cours', content: 'Contenu', refresh: 'Actualiser', loading: 'Chargement des données…',
    totalUsers: 'Utilisateurs', activeUsers: 'Comptes actifs', verifiedUsers: 'E-mails vérifiés', twoFactor: '2FA activée',
    totalCourses: 'Cours', totalSigns: 'Signes', badges: 'Badges attribués', certificates: 'Certificats délivrés',
    community: 'Répartition de la communauté', learning: 'Activité pédagogique', students: 'Étudiants', teachers: 'Enseignants', admins: 'Administrateurs',
    completed: 'Cours terminés', categories: 'Catégories', search: 'Rechercher par nom ou e-mail…', allRoles: 'Tous les rôles',
    name: 'Nom', email: 'E-mail', role: 'Rôle', security: 'Sécurité', status: 'Statut', actions: 'Actions', verified: 'Vérifié', unverified: 'Non vérifié', active: 'Actif', inactive: 'Désactivé',
    activate: 'Activer', deactivate: 'Désactiver', saveRole: 'Enregistrer', you: 'Vous', noUsers: 'Aucun utilisateur trouvé.',
    courseEditor: 'Éditeur de cours', courseTitle: 'Titre du cours', description: 'Description', category: 'Catégorie', noCategory: 'Sans catégorie', create: 'Créer', update: 'Mettre à jour', cancel: 'Annuler', edit: 'Modifier', remove: 'Supprimer',
    categoryEditor: 'Catégories', categoryName: 'Nom de la catégorie', signEditor: 'Bibliothèque des signes', word: 'Mot / libellé', modelLabel: 'Label du modèle IA', difficulty: 'Difficulté', course: 'Cours associé', imageUrl: 'URL image (optionnel)', videoUrl: 'URL vidéo (optionnel)', noCourse: 'Sans cours',
    beginner: 'Débutant', intermediate: 'Intermédiaire', advanced: 'Avancé', emptyCourses: 'Aucun cours.', emptySigns: 'Aucun signe.', confirmDelete: 'Confirmer la suppression ?', saved: 'Modification enregistrée.', deleted: 'Élément supprimé.', error: 'Une erreur est survenue.',
  },
  en: {
    eyebrow: 'CONTROL CENTER', title: 'Administrator Dashboard', subtitle: 'Manage the TuniSign community, courses and content from one place.',
    overview: 'Overview', users: 'Users', courses: 'Courses', content: 'Content', refresh: 'Refresh', loading: 'Loading data…',
    totalUsers: 'Users', activeUsers: 'Active accounts', verifiedUsers: 'Verified emails', twoFactor: '2FA enabled', totalCourses: 'Courses', totalSigns: 'Signs', badges: 'Badges awarded', certificates: 'Certificates issued',
    community: 'Community breakdown', learning: 'Learning activity', students: 'Students', teachers: 'Teachers', admins: 'Administrators', completed: 'Completed courses', categories: 'Categories', search: 'Search by name or email…', allRoles: 'All roles',
    name: 'Name', email: 'Email', role: 'Role', security: 'Security', status: 'Status', actions: 'Actions', verified: 'Verified', unverified: 'Unverified', active: 'Active', inactive: 'Disabled', activate: 'Activate', deactivate: 'Disable', saveRole: 'Save', you: 'You', noUsers: 'No users found.',
    courseEditor: 'Course editor', courseTitle: 'Course title', description: 'Description', category: 'Category', noCategory: 'No category', create: 'Create', update: 'Update', cancel: 'Cancel', edit: 'Edit', remove: 'Delete', categoryEditor: 'Categories', categoryName: 'Category name', signEditor: 'Sign library', word: 'Word / label', modelLabel: 'AI model label', difficulty: 'Difficulty', course: 'Related course', imageUrl: 'Image URL (optional)', videoUrl: 'Video URL (optional)', noCourse: 'No course', beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced', emptyCourses: 'No courses.', emptySigns: 'No signs.', confirmDelete: 'Confirm deletion?', saved: 'Change saved.', deleted: 'Item deleted.', error: 'Something went wrong.',
  },
  ar: {
    eyebrow: 'مركز التحكّم', title: 'لوحة تحكّم المسؤول', subtitle: 'سيّر المستخدمين والكورسات والمحتوى الكل من بلاصة واحدة.',
    overview: 'نظرة عامة', users: 'المستخدمين', courses: 'الكورسات', content: 'المحتوى', refresh: 'تحديث', loading: 'جاري تحميل البيانات…',
    totalUsers: 'المستخدمين', activeUsers: 'حسابات مفعّلة', verifiedUsers: 'إيميلات مؤكدة', twoFactor: 'حماية ثنائية', totalCourses: 'الكورسات', totalSigns: 'الإشارات', badges: 'الشارات', certificates: 'الشهادات', community: 'توزيع المستخدمين', learning: 'نشاط التعلّم', students: 'طلبة', teachers: 'مدرسين', admins: 'مسؤولين', completed: 'كورسات مكتملة', categories: 'التصنيفات', search: 'فتّش بالاسم أو الإيميل…', allRoles: 'الأدوار الكل',
    name: 'الاسم', email: 'الإيميل', role: 'الدور', security: 'الحماية', status: 'الحالة', actions: 'الإجراءات', verified: 'مؤكد', unverified: 'موش مؤكد', active: 'مفعّل', inactive: 'معطّل', activate: 'تفعيل', deactivate: 'تعطيل', saveRole: 'حفظ', you: 'إنت', noUsers: 'ما فماش مستخدمين.',
    courseEditor: 'تعديل الكورسات', courseTitle: 'عنوان الكورس', description: 'الوصف', category: 'التصنيف', noCategory: 'من غير تصنيف', create: 'إضافة', update: 'تعديل', cancel: 'إلغاء', edit: 'تعديل', remove: 'حذف', categoryEditor: 'التصنيفات', categoryName: 'اسم التصنيف', signEditor: 'مكتبة الإشارات', word: 'الكلمة', modelLabel: 'رمز مودال الذكاء الاصطناعي', difficulty: 'المستوى', course: 'الكورس', imageUrl: 'رابط الصورة (اختياري)', videoUrl: 'رابط الفيديو (اختياري)', noCourse: 'من غير كورس', beginner: 'مبتدئ', intermediate: 'متوسط', advanced: 'متقدم', emptyCourses: 'ما فماش كورسات.', emptySigns: 'ما فماش إشارات.', confirmDelete: 'متأكد من الحذف؟', saved: 'تم الحفظ.', deleted: 'تم الحذف.', error: 'صار خطأ.',
  },
} as const

function errorMessage(error: unknown, fallback: string) {
  if (!(error instanceof Error)) return fallback
  try {
    const parsed = JSON.parse(error.message) as { message?: string }
    return parsed.message || error.message
  } catch {
    return error.message || fallback
  }
}

export function AdminDashboard({ language, currentUserId, onContentChanged }: Props) {
  const text = copy[language]
  const [tab, setTab] = useState<AdminTab>('overview')
  const [stats, setStats] = useState<AdminDashboardStats | null>(null)
  const [users, setUsers] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [signs, setSigns] = useState<Sign[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingSign, setEditingSign] = useState<Sign | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setMessage('')
    try {
      const [nextStats, nextUsers, nextCategories, nextCourses, nextSigns] = await Promise.all([
        api.adminStats(), api.adminUsers(), api.categories(), api.courses(), api.signs(),
      ])
      setStats(nextStats)
      setUsers(nextUsers)
      setCategories(nextCategories)
      setCourses(nextCourses)
      setSigns(nextSigns)
    } catch (error) {
      setMessage(errorMessage(error, text.error))
    } finally {
      setLoading(false)
    }
  }, [text.error])

  useEffect(() => { void load() }, [load])

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase()
    return users.filter((user) => {
      const matchesQuery = !query || `${user.firstName} ${user.lastName} ${user.email}`.toLowerCase().includes(query)
      return matchesQuery && (roleFilter === 'ALL' || user.role === roleFilter)
    })
  }, [roleFilter, search, users])

  async function perform(action: () => Promise<unknown>, success: string, contentChanged = false) {
    setMessage('')
    try {
      await action()
      setMessage(success)
      await load()
      if (contentChanged) onContentChanged()
    } catch (error) {
      setMessage(errorMessage(error, text.error))
    }
  }

  async function changeRole(user: Account, role: Account['role']) {
    await perform(() => api.updateUserRole(user.id, role), text.saved)
  }

  async function toggleUser(user: Account) {
    await perform(() => api.updateUserStatus(user.id, !user.active), text.saved)
  }

  async function submitCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const categoryValue = String(data.get('categoryId') || '')
    const payload = {
      title: String(data.get('title')).trim(),
      description: String(data.get('description')).trim(),
      categoryId: categoryValue ? Number(categoryValue) : undefined,
    }
    await perform(
      () => editingCourse ? api.updateCourse(editingCourse.id, payload) : api.createCourse(payload),
      text.saved,
      true,
    )
    setEditingCourse(null)
    form.reset()
  }

  async function submitCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const payload = { name: String(data.get('name')).trim(), description: String(data.get('description')).trim() }
    await perform(
      () => editingCategory ? api.updateCategory(editingCategory.id, payload) : api.createCategory(payload),
      text.saved,
      true,
    )
    setEditingCategory(null)
    form.reset()
  }

  async function submitSign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const courseValue = String(data.get('courseId') || '')
    const payload = {
      word: String(data.get('word')).trim(),
      description: String(data.get('description')).trim(),
      modelLabel: String(data.get('modelLabel')).trim(),
      difficulty: String(data.get('difficulty')) as Sign['difficulty'],
      imageUrl: String(data.get('imageUrl')).trim() || undefined,
      videoUrl: String(data.get('videoUrl')).trim() || undefined,
      courseId: courseValue ? Number(courseValue) : undefined,
    }
    await perform(
      () => editingSign ? api.updateSign(editingSign.id, payload) : api.createSign(payload),
      text.saved,
      true,
    )
    setEditingSign(null)
    form.reset()
  }

  const statCards = stats ? [
    ['👥', text.totalUsers, stats.totalUsers], ['✅', text.activeUsers, stats.activeUsers], ['✉️', text.verifiedUsers, stats.verifiedUsers], ['🛡️', text.twoFactor, stats.twoFactorUsers],
    ['📚', text.totalCourses, stats.courses], ['🤟', text.totalSigns, stats.signs], ['🏅', text.badges, stats.awardedBadges], ['📜', text.certificates, stats.issuedCertificates],
  ] : []

  return <main className="content-page admin-page">
    <section className="admin-heading">
      <div><p className="eyebrow">{text.eyebrow}</p><h1>{text.title}</h1><p className="page-intro">{text.subtitle}</p></div>
      <button className="ghost-button" onClick={() => void load()}>↻ {text.refresh}</button>
    </section>

    <nav className="admin-tabs" aria-label={text.title}>
      {(['overview', 'users', 'courses', 'content'] as AdminTab[]).map((item) => <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{text[item]}</button>)}
    </nav>

    {message && <div className="admin-message" role="status">{message}</div>}
    {loading ? <div className="admin-loading"><span /><p>{text.loading}</p></div> : <>
      {tab === 'overview' && stats && <>
        <section className="admin-stat-grid">{statCards.map(([icon, label, value]) => <article key={String(label)}><span>{icon}</span><div><strong>{value}</strong><p>{label}</p></div></article>)}</section>
        <section className="admin-overview-grid">
          <article className="admin-panel"><h2>{text.community}</h2>{[[text.students, stats.students], [text.teachers, stats.teachers], [text.admins, stats.admins]].map(([label, value]) => <div className="admin-meter" key={String(label)}><p><span>{label}</span><b>{value}</b></p><i><span style={{ width: `${stats.totalUsers ? Number(value) / stats.totalUsers * 100 : 0}%` }} /></i></div>)}</article>
          <article className="admin-panel"><h2>{text.learning}</h2><div className="admin-kpi-list"><p><span>🗂️ {text.categories}</span><b>{stats.categories}</b></p><p><span>🎓 {text.completed}</span><b>{stats.completedCourses}</b></p><p><span>🏅 {text.badges}</span><b>{stats.awardedBadges}</b></p><p><span>📜 {text.certificates}</span><b>{stats.issuedCertificates}</b></p></div></article>
        </section>
      </>}

      {tab === 'users' && <section className="admin-panel admin-table-panel">
        <div className="admin-toolbar"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={text.search} /><select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}><option value="ALL">{text.allRoles}</option><option value="STUDENT">{text.students}</option><option value="TEACHER">{text.teachers}</option><option value="ADMIN">{text.admins}</option></select></div>
        <div className="admin-table-wrap"><table><thead><tr><th>{text.name}</th><th>{text.email}</th><th>{text.role}</th><th>{text.security}</th><th>{text.status}</th><th>{text.actions}</th></tr></thead><tbody>
          {filteredUsers.map((user) => <tr key={user.id}><td><div className="admin-user-cell"><span>{user.firstName.slice(0, 1)}{user.lastName.slice(0, 1)}</span><b>{user.firstName} {user.lastName}</b>{user.id === currentUserId && <small>{text.you}</small>}</div></td><td>{user.email}</td><td><select value={user.role} disabled={user.id === currentUserId} onChange={(event) => void changeRole(user, event.target.value as Account['role'])}><option value="STUDENT">STUDENT</option><option value="TEACHER">TEACHER</option><option value="ADMIN">ADMIN</option></select></td><td><div className="security-badges"><span className={user.emailVerified ? 'ok' : 'warn'}>{user.emailVerified ? '✓' : '!'} {user.emailVerified ? text.verified : text.unverified}</span>{user.twoFactorEnabled && <span className="ok">2FA</span>}</div></td><td><span className={`status-chip ${user.active ? 'active' : 'inactive'}`}>{user.active ? text.active : text.inactive}</span></td><td><button className="table-action" disabled={user.id === currentUserId} onClick={() => void toggleUser(user)}>{user.active ? text.deactivate : text.activate}</button></td></tr>)}
          {!filteredUsers.length && <tr><td colSpan={6}>{text.noUsers}</td></tr>}
        </tbody></table></div>
      </section>}

      {tab === 'courses' && <section className="admin-editor-layout">
        <form className="admin-panel admin-form" key={editingCourse?.id ?? 'new-course'} onSubmit={submitCourse}><h2>{text.courseEditor}</h2><label>{text.courseTitle}<input name="title" defaultValue={editingCourse?.title || ''} required /></label><label>{text.description}<textarea name="description" defaultValue={editingCourse?.description || ''} rows={4} /></label><label>{text.category}<select name="categoryId" defaultValue={editingCourse?.categoryId || ''}><option value="">{text.noCategory}</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label><div className="admin-form-actions"><button className="primary-button compact" type="submit">{editingCourse ? text.update : text.create}</button>{editingCourse && <button type="button" className="ghost-button" onClick={() => setEditingCourse(null)}>{text.cancel}</button>}</div></form>
        <div className="admin-card-list">{courses.map((course) => <article className="admin-content-card" key={course.id}><div><small>#{course.id} · {categories.find((item) => item.id === course.categoryId)?.name || text.noCategory}</small><h3>{course.title}</h3><p>{course.description}</p><span>{signs.filter((sign) => sign.courseId === course.id).length} {text.totalSigns.toLowerCase()}</span></div><div><button onClick={() => setEditingCourse(course)}>{text.edit}</button><button className="danger" onClick={() => window.confirm(text.confirmDelete) && void perform(() => api.deleteCourse(course.id), text.deleted, true)}>{text.remove}</button></div></article>)}{!courses.length && <p>{text.emptyCourses}</p>}</div>
      </section>}

      {tab === 'content' && <>
        <section className="admin-editor-layout compact-layout">
          <form className="admin-panel admin-form" key={editingCategory?.id ?? 'new-category'} onSubmit={submitCategory}><h2>{text.categoryEditor}</h2><label>{text.categoryName}<input name="name" defaultValue={editingCategory?.name || ''} required /></label><label>{text.description}<textarea name="description" defaultValue={editingCategory?.description || ''} rows={3} /></label><div className="admin-form-actions"><button className="primary-button compact" type="submit">{editingCategory ? text.update : text.create}</button>{editingCategory && <button type="button" className="ghost-button" onClick={() => setEditingCategory(null)}>{text.cancel}</button>}</div></form>
          <div className="admin-card-list">{categories.map((category) => <article className="admin-content-card compact" key={category.id}><div><small>#{category.id}</small><h3>{category.name}</h3><p>{category.description}</p></div><div><button onClick={() => setEditingCategory(category)}>{text.edit}</button><button className="danger" onClick={() => window.confirm(text.confirmDelete) && void perform(() => api.deleteCategory(category.id), text.deleted, true)}>{text.remove}</button></div></article>)}</div>
        </section>
        <section className="admin-editor-layout admin-sign-section">
          <form className="admin-panel admin-form" key={editingSign?.id ?? 'new-sign'} onSubmit={submitSign}><h2>{text.signEditor}</h2><div className="form-row"><label>{text.word}<input name="word" defaultValue={editingSign?.word || ''} required /></label><label>{text.modelLabel}<input name="modelLabel" defaultValue={editingSign?.modelLabel || ''} required /></label></div><label>{text.description}<textarea name="description" defaultValue={editingSign?.description || ''} rows={3} /></label><div className="form-row"><label>{text.difficulty}<select name="difficulty" defaultValue={editingSign?.difficulty || 'DEBUTANT'}><option value="DEBUTANT">{text.beginner}</option><option value="INTERMEDIAIRE">{text.intermediate}</option><option value="AVANCE">{text.advanced}</option></select></label><label>{text.course}<select name="courseId" defaultValue={editingSign?.courseId || ''}><option value="">{text.noCourse}</option>{courses.map((course) => <option value={course.id} key={course.id}>{course.title}</option>)}</select></label></div><label>{text.imageUrl}<input name="imageUrl" type="url" defaultValue={editingSign?.imageUrl || ''} /></label><label>{text.videoUrl}<input name="videoUrl" type="url" defaultValue={editingSign?.videoUrl || ''} /></label><div className="admin-form-actions"><button className="primary-button compact" type="submit">{editingSign ? text.update : text.create}</button>{editingSign && <button type="button" className="ghost-button" onClick={() => setEditingSign(null)}>{text.cancel}</button>}</div></form>
          <div className="admin-card-list admin-sign-list">{signs.map((sign) => <article className="admin-content-card compact" key={sign.id}><div><small>#{sign.id} · {courses.find((item) => item.id === sign.courseId)?.title || text.noCourse}</small><h3>{sign.word} <code>{sign.modelLabel}</code></h3><p>{sign.description}</p></div><div><button onClick={() => setEditingSign(sign)}>{text.edit}</button><button className="danger" onClick={() => window.confirm(text.confirmDelete) && void perform(() => api.deleteSign(sign.id), text.deleted, true)}>{text.remove}</button></div></article>)}{!signs.length && <p>{text.emptySigns}</p>}</div>
        </section>
      </>}
    </>}
  </main>
}
