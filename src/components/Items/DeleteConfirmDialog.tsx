import { Modal } from '../common/Modal'

interface Props {
  itemTitle: string
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteConfirmDialog({ itemTitle, onConfirm, onCancel }: Props) {
  return (
    <Modal title="Delete item" onClose={onCancel} widthClassName="max-w-sm">
      <p className="text-sm text-text">
        Delete <span className="font-semibold text-text-strong">{itemTitle || 'this item'}</span>?
        This can&rsquo;t be undone.
      </p>
      <div className="mt-5 flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-text transition hover:bg-surface-muted"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="rounded-xl bg-danger px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Delete
        </button>
      </div>
    </Modal>
  )
}
