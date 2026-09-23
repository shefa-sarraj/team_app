/**
 * useTheme — owns the light/dark theme choice.
 *
 * The choice is persisted to localStorage and mirrored onto
 * <html data-theme="…">, which is what Tailwind's `dark:` variant keys off
 * (see the @custom-variant rule in index.css). index.html runs the same
 * resolution logic inline before first paint to avoid a flash of the wrong
 * theme; this hook keeps it in sync afterwards.
 */

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'team-app-theme'

function getInitialTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // localStorage unavailable (private mode, blocked) — fall through.
  }
  if (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  ) {
    return 'dark'
  }
  return 'light'
}

export function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // Persisting is best-effort; the in-memory state still drives the UI.
    }
  }, [theme])

  function toggleTheme() {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }

  return { theme, toggleTheme }
}

export default useTheme
