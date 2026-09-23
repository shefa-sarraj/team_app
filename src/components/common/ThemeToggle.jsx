/**
 * ThemeToggle — icon button that flips between light and dark.
 *
 * Props:
 *   - theme    : 'light' | 'dark'   the current theme (for icon + label)
 *   - onToggle : () => void
 *
 * Presentational only; the actual theme state lives in useTheme (App).
 */

function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 ring-1 ring-slate-200 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 dark:text-slate-400 dark:ring-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
    >
      {isDark ? (
        <svg width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path
            d="M17 12.3A7 7 0 0 1 7.7 3a1 1 0 0 0-1.3-1.2A8.5 8.5 0 1 0 18.2 13.6 1 1 0 0 0 17 12.3Z"
            fill="currentColor"
          />
        </svg>
      ) : (
        <svg width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="10" cy="10" r="4" fill="currentColor" />
          <path
            d="M10 1.5v2M10 16.5v2M18.5 10h-2M3.5 10h-2M15.8 4.2l-1.4 1.4M5.6 14.4l-1.4 1.4M15.8 15.8l-1.4-1.4M5.6 5.6 4.2 4.2"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      )}
    </button>
  )
}

export default ThemeToggle
