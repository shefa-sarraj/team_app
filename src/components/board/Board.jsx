/**
 * Board — top-level layout for the task board.
 *
 * Props:
 *   - tasks           : Task[]              the already-filtered list
 *   - isLoading       : boolean
 *   - filters         : { priority, assignee }
 *   - assigneeOptions : string[]
 *   - theme           : 'light' | 'dark'
 *   - onToggleTheme   : () => void
 *   - onFilterChange  : (nextFilters) => void
 *   - onAddTask       : () => void          opens the "new task" form
 *   - onEditTask      : (task) => void      opens the "edit task" form
 *   - onDeleteTask    : (task) => void      asks App to confirm + delete
 *   - onMoveTask      : (id, status) => void   drag-and-drop between columns
 *
 * Renders a sticky app bar, a toolbar (task count + overdue badge + FilterBar),
 * and one BoardColumn per entry in COLUMNS, routing each task to its column by
 * matching task.status to column.id.
 *
 * STAGE 6: renders the FilterBar. Counters reflect the filtered list.
 */

import { COLUMNS } from '../../constants/board'
import { isOverdue } from '../../utils/formatDate'
import Button from '../common/Button'
import ThemeToggle from '../common/ThemeToggle'
import FilterBar from '../filters/FilterBar'
import BoardColumn from './BoardColumn'

function Board({
  tasks = [],
  isLoading = false,
  filters,
  assigneeOptions = [],
  theme,
  onToggleTheme,
  onFilterChange,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onMoveTask,
}) {
  const overdueCount = tasks.filter((task) => isOverdue(task.dueDate)).length

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur-md dark:border-slate-800/70 dark:bg-slate-950/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm dark:bg-indigo-500">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M4 10.5 8 14l8-8.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <div>
              <h1 className="text-lg leading-tight font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                Team Task Board
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Track work from idea to done
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            <Button variant="primary" onClick={onAddTask}>
              <svg
                width="15"
                height="15"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M8 3v10M3 8h10"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
              </svg>
              New task
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-500 dark:border-slate-700 dark:border-t-slate-400" />
            Loading tasks…
          </div>
        ) : (
          <>
            <div className="mb-5 flex flex-col gap-3 rounded-xl border border-slate-200/70 bg-white/70 px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-800/70 dark:bg-slate-900/50">
              <div className="flex items-center gap-2.5 text-sm">
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
                </span>
                {overdueCount > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-600 ring-1 ring-rose-600/15 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/20">
                    {overdueCount} overdue
                  </span>
                )}
              </div>

              <FilterBar
                filters={filters}
                assigneeOptions={assigneeOptions}
                onChange={onFilterChange}
              />
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {COLUMNS.map((column) => {
                const columnTasks = tasks.filter(
                  (task) => task.status === column.id,
                )
                return (
                  <BoardColumn
                    key={column.id}
                    column={column}
                    tasks={columnTasks}
                    onEditTask={onEditTask}
                    onDeleteTask={onDeleteTask}
                    onMoveTask={onMoveTask}
                  />
                )
              })}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default Board
