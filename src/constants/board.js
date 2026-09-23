/**
 * Shared board vocabulary.
 *
 * Everything that describes "what a column is" or "what a priority is" lives
 * here so components never hard-code strings like "in-progress" inline. When
 * the real backend arrives, these are the values it must agree on.
 */

// The three board columns, in display order.
// `id` matches Task.status so a task can be routed to its column by a lookup.
// `accent` is a semantic color name the board uses to tint the column header
// (see COLUMN_ACCENTS in BoardColumn).
export const COLUMNS = [
  { id: 'todo', title: 'To Do', accent: 'slate' },
  { id: 'in-progress', title: 'In Progress', accent: 'blue' },
  { id: 'done', title: 'Done', accent: 'emerald' },
]

export const STATUSES = COLUMNS.map((column) => column.id)

// Priority levels plus the Tailwind classes that give each one its own color.
// `order` lets us sort high -> low later without a magic switch statement.
// Badges are intentionally low-saturation: a soft tinted pill (badgeClass)
// with a small solid status dot (dotClass) for the actual color signal.
// `borderClass` tints the left edge of a TaskCard so priority reads at a glance.
export const PRIORITIES = {
  low: {
    id: 'low',
    label: 'Low',
    order: 1,
    badgeClass:
      'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/15 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20',
    dotClass: 'bg-emerald-500',
    borderClass: 'border-l-emerald-400 dark:border-l-emerald-500/70',
  },
  medium: {
    id: 'medium',
    label: 'Medium',
    order: 2,
    badgeClass:
      'bg-amber-50 text-amber-700 ring-1 ring-amber-600/15 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20',
    dotClass: 'bg-amber-500',
    borderClass: 'border-l-amber-400 dark:border-l-amber-500/70',
  },
  high: {
    id: 'high',
    label: 'High',
    order: 3,
    badgeClass:
      'bg-rose-50 text-rose-700 ring-1 ring-rose-600/15 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/20',
    dotClass: 'bg-rose-500',
    borderClass: 'border-l-rose-400 dark:border-l-rose-500/70',
  },
}

export const PRIORITY_OPTIONS = Object.values(PRIORITIES)
