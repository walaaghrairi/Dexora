import { useEffect, useRef } from 'react'
import type { Language } from '../i18n'

let activeCredentialHandler: ((credential: string) => void) | null = null
let initializedClientId = ''

type Props = {
  language: Language
  mode: 'signin' | 'signup'
  darkMode: boolean
  onCredential: (credential: string) => void
  onError: (message: string) => void
}

function ensureGoogleScript(): Promise<void> {
  if (window.google?.accounts.id) return Promise.resolve()
  const existing = document.querySelector<HTMLScriptElement>('script[data-tunisign-google]')
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Google Identity Services indisponible.')), { once: true })
    })
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.dataset.tunisignGoogle = 'true'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Google Identity Services indisponible.'))
    document.head.appendChild(script)
  })
}

export function GoogleSignInButton({ language, mode, darkMode, onCredential, onError }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const errorHandlerRef = useRef(onError)
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

  useEffect(() => {
    activeCredentialHandler = onCredential
    errorHandlerRef.current = onError
  }, [onCredential, onError])

  useEffect(() => {
    let cancelled = false
    const container = containerRef.current
    if (!clientId || !container) return

    ensureGoogleScript()
      .then(() => {
        if (cancelled || !window.google || !containerRef.current) return
        if (initializedClientId !== clientId) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (response) => activeCredentialHandler?.(response.credential),
            use_fedcm_for_prompt: true,
          })
          initializedClientId = clientId
        }
        containerRef.current.replaceChildren()
        window.google.accounts.id.renderButton(containerRef.current, {
          type: 'standard',
          theme: darkMode ? 'filled_black' : 'outline',
          size: 'large',
          text: mode === 'signup' ? 'signup_with' : 'signin_with',
          shape: 'pill',
          logo_alignment: 'left',
          width: Math.min(420, Math.max(260, containerRef.current.clientWidth)),
          locale: language === 'ar' ? 'ar' : language,
        })
      })
      .catch((error: unknown) => {
        if (!cancelled) errorHandlerRef.current(error instanceof Error ? error.message : 'Google Sign-In indisponible.')
      })

    return () => { cancelled = true }
  }, [clientId, darkMode, language, mode])

  if (!clientId) {
    return <p className="google-config-hint">Google Sign-In sera disponible après configuration de VITE_GOOGLE_CLIENT_ID.</p>
  }
  return <div className="google-signin-button" ref={containerRef} aria-label="Google Sign-In" />
}
