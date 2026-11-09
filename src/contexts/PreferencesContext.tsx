import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getPreferences, savePreferences } from '@/services/preferences'
import type { ThemeMode, AccentColor } from '@/types/book'

interface PreferencesContextValue {
  themeMode: ThemeMode
  accentColor: AccentColor
  setThemeMode: (mode: ThemeMode) => void
  setAccentColor: (color: AccentColor) => void
  saving: boolean
}

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined)

const THEME_KEY = 'pref-theme'
const ACCENT_KEY = 'pref-accent'

/** Cores de destaque disponíveis no seletor de aparência. */
export const ACCENT_OPTIONS: { value: AccentColor; label: string; hex: string }[] = [
  { value: 'amber', label: 'Âmbar', hex: '#d97706' },
  { value: 'emerald', label: 'Esmeralda', hex: '#059669' },
  { value: 'violet', label: 'Violeta', hex: '#7c3aed' },
  { value: 'blue', label: 'Azul', hex: '#2563eb' },
  { value: 'rose', label: 'Rosa', hex: '#e11d48' },
]

function applyTheme(mode: ThemeMode, accent: AccentColor) {
  const root = document.documentElement
  root.classList.toggle('dark', mode === 'escuro')
  root.dataset.accent = accent
}

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [themeMode, setThemeModeState] = useState<ThemeMode>('claro')
  const [accentColor, setAccentColorState] = useState<AccentColor>('amber')
  const [saving, setSaving] = useState(false)
  const [remoteId, setRemoteId] = useState<string | null>(null)

  // Carrega preferências: primeiro do localStorage (instantâneo), depois do servidor
  useEffect(() => {
    const savedMode = localStorage.getItem(THEME_KEY) as ThemeMode | null
    const savedAccent = localStorage.getItem(ACCENT_KEY) as AccentColor | null
    if (savedMode) setThemeModeState(savedMode)
    if (savedAccent) setAccentColorState(savedAccent)
  }, [])

  useEffect(() => {
    if (!user) {
      setRemoteId(null)
      return
    }
    let cancelled = false
    getPreferences(user.id).then((prefs) => {
      if (cancelled || !prefs) return
      setRemoteId(prefs.id)
      if (prefs.theme_mode === 'claro' || prefs.theme_mode === 'escuro') {
        setThemeModeState(prefs.theme_mode)
        localStorage.setItem(THEME_KEY, prefs.theme_mode)
      }
      if (prefs.accent_color) {
        setAccentColorState(prefs.accent_color as AccentColor)
        localStorage.setItem(ACCENT_KEY, prefs.accent_color)
      }
    })
    return () => {
      cancelled = true
    }
  }, [user])

  useEffect(() => {
    applyTheme(themeMode, accentColor)
  }, [themeMode, accentColor])

  const persist = useCallback(
    (mode: ThemeMode, accent: AccentColor) => {
      if (!user) return
      setSaving(true)
      savePreferences(user.id, remoteId, { theme_mode: mode, accent_color: accent }).then((r) => {
        if (r) setRemoteId(r.id)
        setSaving(false)
      })
    },
    [user, remoteId],
  )

  const setThemeMode = useCallback(
    (mode: ThemeMode) => {
      setThemeModeState(mode)
      localStorage.setItem(THEME_KEY, mode)
      applyTheme(mode, accentColor)
      persist(mode, accentColor)
    },
    [accentColor, persist],
  )

  const setAccentColor = useCallback(
    (color: AccentColor) => {
      setAccentColorState(color)
      localStorage.setItem(ACCENT_KEY, color)
      applyTheme(themeMode, color)
      persist(themeMode, color)
    },
    [themeMode, persist],
  )

  return (
    <PreferencesContext.Provider
      value={{ themeMode, accentColor, setThemeMode, setAccentColor, saving }}
    >
      {children}
    </PreferencesContext.Provider>
  )
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext)
  if (!ctx) throw new Error('usePreferences deve ser usado dentro de PreferencesProvider')
  return ctx
}
