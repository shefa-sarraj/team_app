/**
 * Small date helpers. Kept separate from components so formatting rules live
 * in one place and are easy to test.
 */

/** "2026-09-12" -> "Sep 12, 2026" (falls back to the raw value if unparseable). */
export function formatDate(isoDate) {
  if (!isoDate) return ''
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return isoDate
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/** True when the due date is before today (used later to flag overdue tasks). */
export function isOverdue(isoDate) {
  if (!isoDate) return false
  const due = new Date(isoDate)
  if (Number.isNaN(due.getTime())) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return due < today
}
