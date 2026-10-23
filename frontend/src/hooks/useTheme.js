import { useCallback, useEffect, useState } from 'react'

const KEY = 'fixhub_theme'

// blocked or empty storage must never break the page, so light is the fallback
const readTheme = () => {
  try {
    return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

const apply = (theme) => document.documentElement.classList.toggle('dark', theme === 'dark')

// runs once when this file is first loaded, before the first screen is drawn, so there is no flash
apply(readTheme())

export default function useTheme() {
  const [theme, setTheme] = useState(readTheme)

  useEffect(() => {
    apply(theme)
    try {
      localStorage.setItem(KEY, theme)
    } catch {
      /* ignore */
    }
  }, [theme])

  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), [])

  return { theme, toggle }
}