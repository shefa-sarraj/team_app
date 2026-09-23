/**
 * FilterBar — controls for narrowing which tasks the board shows.
 *
 * Props:
 *   - filters         : { priority: string, assignee: string }
 *                       'all' means "no filter on this field"
 *   - assigneeOptions : string[]   unique assignee names, derived from tasks
 *   - onChange        : (nextFilters) => void
 *
 * Pure UI: it does not filter anything itself, it just reports the chosen
 * values. The actual filtering happens in App. Rendered inside the board
 * toolbar, so it carries no card styling of its own.
 *
 * STAGE 6: priority + assignee filters.
 */

import { PRIORITY_OPTIONS } from '../../constants/board'
import Button from '../common/Button'

function FilterBar({ filters, assigneeOptions = [], onChange }) {
  function handleChange(event) {
    const { name, value } = event.target
    onChange({ ...filters, [name]: value })
  }

  const isFiltered = filters.priority !== 'all' || filters.assignee !== 'all'
  const selectClass =
    'app-select rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-slate-300 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600'
  const labelClass =
    'flex items-center gap-1.5 text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400'

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <label className={labelClass}>
        Priority
        <select
          name="priority"
          value={filters.priority}
          onChange={handleChange}
          className={selectClass}
        >
          <option value="all">All</option>
          {PRIORITY_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className={labelClass}>
        Assignee
        <select
          name="assignee"
          value={filters.assignee}
          onChange={handleChange}
          className={selectClass}
        >
          <option value="all">All</option>
          {assigneeOptions.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>

      {isFiltered && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange({ priority: 'all', assignee: 'all' })}
        >
          Clear
        </Button>
      )}
    </div>
  )
}

export default FilterBar
