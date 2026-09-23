/**
 * ConfirmDialog — "Are you sure?" prompt, built on top of Modal.
 * Used before a task is deleted (stage 4).
 *
 * Props:
 *   - isOpen      : boolean
 *   - title       : string             defaults to "Please confirm"
 *   - message     : string             the question / warning text
 *   - confirmLabel: string             defaults to "Confirm"
 *   - onConfirm   : () => void
 *   - onCancel    : () => void
 *
 * Deliberately generic so it can back any destructive action later, not just
 * delete.
 */

import Button from './Button'
import Modal from './Modal'

function ConfirmDialog({
  isOpen,
  title = 'Please confirm',
  message,
  confirmLabel = 'Confirm',
  onConfirm,
  onCancel,
}) {
  return (
    <Modal isOpen={isOpen} title={title} onClose={onCancel}>
      <p className="text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">
        {message}
      </p>

      <div className="mt-6 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" variant="danger" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}

export default ConfirmDialog
