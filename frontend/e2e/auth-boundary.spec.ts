import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('http://localhost:8081/**', (route) => route.abort())
  await page.route('http://localhost:8000/**', (route) => route.abort())
  await page.goto('/')
})

test('guest sees the public landing page without private menu items', async ({ page }) => {
  await expect(page).toHaveTitle(/TuniSign/)
  await expect(page.getByRole('button', { name: 'Se connecter' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Mon espace' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Récompenses' })).toHaveCount(0)
})

test('protected learning catalogue requires authentication', async ({ page }) => {
  await page.getByRole('button', { name: 'Découvrir les leçons' }).click()
  await expect(page.getByRole('heading', { name: 'Se connecter' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Connexion' })).toBeVisible()
})

test('login form uses browser validation for malformed data', async ({ page }) => {
  await page.getByRole('button', { name: 'Se connecter' }).click()
  await page.getByLabel('E-mail').fill('not-an-email')
  await page.getByLabel('Mot de passe').fill('short')
  await page.getByRole('button', { name: 'Connexion' }).click()

  await expect(page.getByLabel('E-mail')).toHaveJSProperty('validity.valid', false)
})

test('registration requires a strong password', async ({ page }) => {
  await page.getByRole('button', { name: 'Se connecter' }).click()
  await page.getByRole('button', { name: 'Créer un compte' }).click()

  const password = page.getByLabel('Mot de passe')
  await password.fill('abcdefgh')
  await expect(password).toHaveJSProperty('validity.valid', false)

  await password.fill('TuniSign1!')
  await expect(password).toHaveJSProperty('validity.valid', true)
  await expect(page.getByText(/une majuscule.*un chiffre.*caractère spécial/i)).toBeVisible()
})
