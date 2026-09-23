/**
 * BoardColumn — a single column (To Do / In Progress / Done).
 *
 * Props:
 *   - column       : { id, title, accent }   one entry from COLUMNS
 *   - tasks        : Task[]          tasks already routed to this column
 *   - onEditTask   : (task) => void  forwarded to each TaskCard
 *   - onDeleteTask : (task) => void  forwarded to each TaskCard
 *   - onMoveTask   : (id, status) => void   called when a card is dropped here
 *
 * Shows the column title with a colored accent dot, a count, and a TaskCard
 * per task (with a friendly empty state when there are none).
 *
 * STAGE 5: acts as a drop target. `isDragOver` (local state) only drives the
 * highlight while a card hovers over the column.
 */

import { useState } from 'react'
import TaskCard from './TaskCard'

// Maps column.accent to the Tailwind classes for the header dot + count.
const COLUMN_ACCENTS = {
  slate: { dot: 'bg-slate-400', count: 'text-slate-500 dark:text-slate-400' },
  blue: { dot: 'bg-blue-500', count: 'text-blue-600 dark:text-blue-400' },
  emerald: {
    dot: 'bg-emerald-500',
    count: 'text-emerald-600 dark:text-emerald-400',
  },
}

function BoardColumn({
  column,
  tasks = [],
  onEditTask,
  onDeleteTask,
  onMoveTask,
}) {
  const [isDragOver, setIsDragOver] = useState(false)
  const accent = COLUMN_ACCENTS[column.accent] ?? COLUMN_ACCENTS.slate

  // Required for the column to be a valid drop target.
  function handleDragOver(event) {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    if (!isDragOver) setIsDragOver(true)
  }

  function handleDrop(event) {
    event.preventDefault()
    setIsDragOver(false)
    const taskId = event.dataTransfer.getData('text/plain')
    if (taskId) onMoveTask(taskId, column.id)
  }

  return (
    <section
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={`flex min-h-[12rem] flex-col rounded-2xl p-3 transition-colors duration-150 ${
        isDragOver
          ? 'bg-indigo-50/80 ring-2 ring-indigo-300 dark:bg-indigo-500/10 dark:ring-indigo-500/50'
          : 'bg-slate-100/60 ring-1 ring-slate-200/80 dark:bg-slate-900/40 dark:ring-slate-800'
      }`}
    >
      <header className="mb-3 flex items-center gap-2 px-2 pt-1">
        <span className={`h-2 w-2 rounded-full ${accent.dot}`} />
        <h2 className="text-xs font-semibold tracking-wider text-slate-600 uppercase dark:text-slate-300">
          {column.title}
        </h2>
        <span
          className={`ml-auto text-sm font-semibold tabular-nums ${accent.count}`}
        >
          {tasks.length}
        </span>
      </header>

      <div className="flex flex-1 flex-col gap-2.5">
        {tasks.length === 0 ? (
          <p className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-slate-300 px-3 py-10 text-center text-sm font-medium text-slate-400 dark:border-slate-700 dark:text-slate-500">
            {isDragOver ? 'Release to drop' : 'No tasks yet'}
          </p>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
            />
          ))
        )}
      </div>
    </section>
  )
}

export default BoardColumn
