import { Modal } from '../common/Modal'

interface Props {
  itemTitle: string
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteConfirmDialog({ itemTitle, onConfirm, onCancel }: Props) {
  return (
    <Modal title="Delete item" onClose={onCancel} widthClassName="max-w-sm">
      <p className="text-sm text-neutral-300">
        Delete <span className="font-medium text-neutral-100">{itemTitle || 'this item'}</span>?
        This can&rsquo;t be undone.
      </p>
      <div className="mt-5 flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="rounded-md border border-neutral-700 px-4 py-2 text-sm text-neutral-300 transition hover:bg-neutral-800"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500"
        >
          Delete
        </button>
      </div>
    </Modal>
  )
}
