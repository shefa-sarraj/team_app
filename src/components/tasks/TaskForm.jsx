/**
 * TaskForm — one controlled form used for BOTH adding and editing a task.
 *
 * Props:
 *   - initialValues : Task | null      null => "add" mode, a task => "edit" mode
 *   - onSubmit      : (values) => void  receives the raw field values only
 *                                       (id / timestamps are the hook's job)
 *   - onCancel      : () => void
 *
 * Fields: title, description, assignee, priority, dueDate, status.
 *
 * Form state is local (useState), seeded once from initialValues. The parent
 * gives this component a `key` tied to the task id, so switching which task
 * is being edited remounts the form with fresh state — no syncing effect
 * needed.
 *
 * STAGE 3: full add + edit form.
 */

import { useState } from 'react'
import { COLUMNS, PRIORITY_OPTIONS } from '../../constants/board'
import Button from '../common/Button'

const EMPTY_TASK = {
  title: '',
  description: '',
  assignee: '',
  priority: 'medium',
  dueDate: '',
  status: 'todo',
}

// Keep only the editable fields; ignore id/createdAt/updatedAt if present.
function toFormValues(task) {
  if (!task) return EMPTY_TASK
  return {
    title: task.title ?? '',
    description: task.description ?? '',
    assignee: task.assignee ?? '',
    priority: task.priority ?? 'medium',
    dueDate: task.dueDate ?? '',
    status: task.status ?? 'todo',
  }
}

function TaskForm({ initialValues = null, onSubmit, onCancel }) {
  const [values, setValues] = useState(() => toFormValues(initialValues))
  const [error, setError] = useState('')

  function handleChange(event) {
    const { name, value } = event.target
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!values.title.trim() || !values.assignee.trim()) {
      setError('Title and assignee are required.')
      return
    }
    onSubmit({
      ...values,
      title: values.title.trim(),
      description: values.description.trim(),
      assignee: values.assignee.trim(),
    })
  }

  const isEditing = Boolean(initialValues)

  const fieldClass =
    'w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-[15px] text-slate-800 placeholder:text-slate-400 transition-colors focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/15 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-400 dark:focus:bg-slate-800'
  const selectClass = `${fieldClass} app-select`
  const labelClass =
    'mb-1.5 block text-sm font-semibold tracking-wide text-slate-600 dark:text-slate-300'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelClass} htmlFor="title">
          Title
        </label>
        <input
          id="title"
          name="title"
          value={values.title}
          onChange={handleChange}
          className={fieldClass}
          placeholder="Short summary of the task"
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={values.description}
          onChange={handleChange}
          rows={3}
          className={fieldClass}
          placeholder="Details, context, acceptance criteria…"
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="assignee">
          Assignee
        </label>
        <input
          id="assignee"
          name="assignee"
          value={values.assignee}
          onChange={handleChange}
          className={fieldClass}
          placeholder="Who owns this?"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="priority">
            Priority
          </label>
          <select
            id="priority"
            name="priority"
            value={values.priority}
            onChange={handleChange}
            className={selectClass}
          >
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor="status">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={values.status}
            onChange={handleChange}
            className={selectClass}
          >
            {COLUMNS.map((column) => (
              <option key={column.id} value={column.id}>
                {column.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="dueDate">
          Due date
        </label>
        <input
          id="dueDate"
          name="dueDate"
          type="date"
          value={values.dueDate}
          onChange={handleChange}
          className={fieldClass}
        />
      </div>

      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600 ring-1 ring-rose-600/15 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/20">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          {isEditing ? 'Save changes' : 'Add task'}
        </Button>
      </div>
    </form>
  )
}

export default TaskForm
