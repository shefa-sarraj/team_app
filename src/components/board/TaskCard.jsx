/**
 * TaskCard — one task as it appears inside a column.
 *
 * Props:
 *   - task     : Task              the record to display
 *   - onEdit   : (task) => void    called when the Edit button is clicked
 *   - onDelete : (task) => void    called when the Delete button is clicked
 *                                  (App shows a confirmation before removing)
 *
 * Displays title, description, a colored initials avatar, due date, and a
 * priority badge. The left edge is tinted by priority. Colors and labels come
 * from PRIORITIES in constants/board.js. Overdue due dates are highlighted.
 *
 * STAGE 5: the card is draggable. On drag start it writes its id into the
 * drag payload; BoardColumn reads that id on drop and calls moveTask.
 */

import { useState } from 'react'
import { PRIORITIES } from '../../constants/board'
import { formatDate, isOverdue } from '../../utils/formatDate'

// A small, fixed set of soft avatar colors (light + dark). The assignee name
// picks one deterministically so the same person always gets the same chip.
const AVATAR_COLORS = [
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300',
  'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300',
]

// "Lena Ortiz" -> "LO". Purely for the little avatar chip on the card.
function getInitials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
}

function avatarColor(name = '') {
  let hash = 0
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

function TaskCard({ task, onEdit, onDelete }) {
  const priority = PRIORITIES[task.priority] ?? PRIORITIES.medium
  const overdue = isOverdue(task.dueDate)
  const [isDragging, setIsDragging] = useState(false)

  function handleDragStart(event) {
    event.dataTransfer.setData('text/plain', task.id)
    event.dataTransfer.effectAllowed = 'move'
    setIsDragging(true)
  }

  return (
    <article
      draggable
      onDragStart={handleDragStart}
      onDragEnd={() => setIsDragging(false)}
      className={`group cursor-grab rounded-xl border border-l-[3px] border-slate-200/80 bg-white p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-150 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_8px_20px_-8px_rgba(15,23,42,0.18)] active:cursor-grabbing dark:border-slate-700/70 dark:bg-slate-800/70 dark:shadow-none dark:hover:border-slate-600 ${priority.borderClass} ${
        isDragging ? 'rotate-1 opacity-40' : ''
      }`}
    >
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <h3 className="text-base leading-snug font-semibold text-slate-800 dark:text-slate-100">
          {task.title}
        </h3>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${priority.badgeClass}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${priority.dotClass}`} />
          {priority.label}
        </span>
      </div>

      {task.description && (
        <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="flex min-w-0 items-center gap-1.5 text-slate-600 dark:text-slate-300">
          <span
            className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold uppercase ${avatarColor(
              task.assignee,
            )}`}
          >
            {getInitials(task.assignee)}
          </span>
          <span className="truncate">{task.assignee}</span>
        </span>
        <span
          className={`inline-flex shrink-0 items-center gap-1 ${
            overdue
              ? 'font-medium text-rose-600 dark:text-rose-400'
              : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M2.75 6.5h10.5M5 2.75v2M11 2.75v2M3.25 4h9.5a.75.75 0 0 1 .75.75v8a.75.75 0 0 1-.75.75h-9.5a.75.75 0 0 1-.75-.75v-8A.75.75 0 0 1 3.25 4Z"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {formatDate(task.dueDate)}
        </span>
      </div>

      <div className="mt-2.5 flex justify-end gap-1 border-t border-slate-100 pt-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-within:opacity-100 dark:border-slate-700/60">
        <button
          type="button"
          onClick={() => onEdit(task)}
          className="rounded-md px-2 py-1 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(task)}
          className="rounded-md px-2 py-1 text-sm font-medium text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
        >
          Delete
        </button>
      </div>
    </article>
  )
}

export default TaskCard
