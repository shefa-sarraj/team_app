/**
 * Toast — a stack of dismissable failure notifications, bottom-right.
 *
 * Props:
 *   - errors    : { id, message }[]   each rendered as its own notification
 *   - onDismiss : (id) => void        called on manual close and auto-timeout
 *
 * Every entry auto-dismisses after AUTO_DISMISS_MS so a failed action never
 * leaves a permanent notification, but multiple concurrent failures each get
 * their own entry — none is silently replaced by a later one.
 */

import { useEffect } from 'react'

const AUTO_DISMISS_MS = 5000

function ToastItem({ id, message, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [id, onDismiss])

  return (
    <div
      role="alert"
      className="animate-dialog-in flex items-start gap-3 rounded-xl bg-white px-4 py-3 shadow-[0_12px_40px_-10px_rgba(15,23,42,0.35)] ring-1 ring-rose-600/15 dark:bg-slate-900 dark:ring-rose-400/20"
    >
      <p className="flex-1 text-sm font-medium text-rose-600 dark:text-rose-300">
        {message}
      </p>
      <button
        type="button"
        onClick={() => onDismiss(id)}
        className="-mr-1 -mt-0.5 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
        aria-label="Dismiss"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M4 4l8 8M12 4l-8 8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  )
}

function Toast({ errors = [], onDismiss }) {
  if (errors.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2">
      {errors.map((error) => (
        <ToastItem key={error.id} {...error} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

export default Toast
