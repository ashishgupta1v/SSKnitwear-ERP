import { computed, ref } from 'vue'

type ThemeMode = 'light' | 'dark'

const THEME_KEY = 'ssk_theme_mode'
const theme = ref<ThemeMode>('light')
let initialized = false

const applyTheme = (mode: ThemeMode) => {
  if (typeof document === 'undefined') {
    return
  }

  const root = document.documentElement
  root.classList.toggle('theme-dark', mode === 'dark')
  root.classList.toggle('theme-light', mode === 'light')
  document.body.classList.toggle('theme-dark', mode === 'dark')
  document.body.classList.toggle('theme-light', mode === 'light')
  root.style.colorScheme = mode
}

const getPreferredTheme = (): ThemeMode => {
  if (typeof window === 'undefined') {
    return 'light'
  }

  try {
    const savedTheme = window.localStorage.getItem(THEME_KEY)
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme
    }
  } catch {
    // Ignore storage access issues.
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const initTheme = () => {
  if (initialized) {
    return
  }

  theme.value = getPreferredTheme()
  applyTheme(theme.value)
  initialized = true
}

const setTheme = (mode: ThemeMode) => {
  theme.value = mode
  applyTheme(mode)

  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(THEME_KEY, mode)
  } catch {
    // Ignore storage access issues.
  }
}

export const useTheme = () => {
  initTheme()

  const isDark = computed(() => theme.value === 'dark')

  const toggleTheme = () => {
    setTheme(theme.value === 'dark' ? 'light' : 'dark')
  }

  return {
    theme,
    isDark,
    setTheme,
    toggleTheme,
  }
}
