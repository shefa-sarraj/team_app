/**
 * Button — the single source of truth for button styling across the app, so
 * "primary vs secondary" reads consistently everywhere (board header, modal,
 * confirm dialog, filter bar).
 *
 * Props:
 *   - variant : 'primary' | 'secondary' | 'ghost' | 'danger'   (default 'secondary')
 *   - size    : 'sm' | 'md'                                     (default 'md')
 *   - ...rest : every other prop (type, onClick, disabled, children, …) is
 *               forwarded straight to the underlying <button>.
 *
 * Purely presentational — no behavior of its own.
 */

const BASE =
  'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium ' +
  'transition-all duration-150 focus:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-indigo-500/40 focus-visible:ring-offset-1 ' +
  'focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 ' +
  'disabled:cursor-not-allowed disabled:opacity-50'

const VARIANTS = {
  primary:
    'bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 active:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:active:bg-indigo-600',
  secondary:
    'bg-white text-slate-700 ring-1 ring-slate-200 shadow-sm hover:bg-slate-50 hover:ring-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-700 dark:hover:ring-slate-600',
  ghost:
    'text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200',
  danger:
    'bg-rose-600 text-white shadow-sm hover:bg-rose-500 active:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-400',
}

const SIZES = {
  sm: 'px-2.5 py-1.5 text-sm',
  md: 'px-3.5 py-2 text-[15px]',
}

function Button({
  variant = 'secondary',
  size = 'md',
  className = '',
  ...rest
}) {
  return (
    <button
      className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    />
  )
}

export default Button
