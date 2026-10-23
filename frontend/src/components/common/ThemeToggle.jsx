import React from 'react'
import { Moon, Sun } from 'lucide-react'
import useTheme from '../../hooks/useTheme'

// sits in the navbar. moon = switch to dark, sun = switch to light
export default function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'
  const label = dark ? 'Switch to light mode' : 'Switch to dark mode'

  return (
    <button
      type="button"
      onClick={toggle}
      title={label}
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/30 text-white transition-colors hover:bg-white/10"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}