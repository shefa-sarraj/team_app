/**
 * Modal — generic centered overlay shell. Reused by the task form (stage 3)
 * and the delete confirmation (stage 4) so dialog styling and behavior live
 * in one place.
 *
 * Props:
 *   - isOpen   : boolean
 *   - title    : string
 *   - onClose  : () => void            called on backdrop click and Escape
 *   - children : React.ReactNode       the dialog body
 *
 * Renders nothing when closed. Closing on Escape is wired with useEffect so
 * the listener is added only while the modal is open.
 */

import { useEffect } from 'react'

function Modal({ isOpen, title, onClose, children }) {
  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="animate-overlay-in fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm dark:bg-black/60"
      onClick={onClose}
    >
      <div
        className="animate-dialog-in w-full max-w-lg rounded-2xl bg-white shadow-[0_24px_70px_-15px_rgba(15,23,42,0.35)] ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            aria-label="Close"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M4 4l8 8M12 4l-8 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

export default Modal
