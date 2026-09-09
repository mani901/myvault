import { useState, type FormEvent } from 'react'

import { Modal } from '../common/Modal'
import { useVaultStore } from '../../stores/vaultStore'
import { emptyPayload, ITEM_KIND_LABELS, type ItemPayload } from '../../types/vault'
import { ApiKeyFields } from './forms/ApiKeyFields'
import { BookmarkFields } from './forms/BookmarkFields'
import { NoteFields } from './forms/NoteFields'
import { OtherFields } from './forms/OtherFields'
import { PasswordFields } from './forms/PasswordFields'

export function ItemForm() {
  const isFormOpen = useVaultStore((s) => s.isFormOpen)
  const formMode = useVaultStore((s) => s.formMode)
  const selectedItemId = useVaultStore((s) => s.selectedItemId)

  if (!isFormOpen) return null

  // Remounting on open (rather than syncing local state via an effect)
  // keeps each open of the form starting from a fresh, correct payload.
  return <ItemFormFields key={`${formMode}-${selectedItemId ?? 'new'}`} />
}

function ItemFormFields() {
  const formMode = useVaultStore((s) => s.formMode)
  const activeKind = useVaultStore((s) => s.activeKind)
  const selectedItemId = useVaultStore((s) => s.selectedItemId)
  const items = useVaultStore((s) => s.items)
  const closeForm = useVaultStore((s) => s.closeForm)
  const saveItem = useVaultStore((s) => s.saveItem)
  const itemsError = useVaultStore((s) => s.itemsError)

  const editingItem = formMode === 'edit' ? items.find((i) => i.id === selectedItemId) : null
  const [payload, setPayload] = useState<ItemPayload>(
    () => editingItem?.payload ?? emptyPayload(activeKind),
  )
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    await saveItem(payload)
    setSubmitting(false)
  }

  const singular = ITEM_KIND_LABELS[payload.kind].singular

  return (
    <Modal
      title={formMode === 'edit' ? `Edit ${singular}` : `New ${singular}`}
      onClose={closeForm}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {payload.kind === 'password' && <PasswordFields value={payload} onChange={setPayload} />}
        {payload.kind === 'bookmark' && <BookmarkFields value={payload} onChange={setPayload} />}
        {payload.kind === 'api_key' && <ApiKeyFields value={payload} onChange={setPayload} />}
        {payload.kind === 'note' && <NoteFields value={payload} onChange={setPayload} />}
        {payload.kind === 'other' && <OtherFields value={payload} onChange={setPayload} />}

        {itemsError && <p className="text-sm text-danger">{itemsError}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={closeForm}
            className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-text transition hover:bg-surface-muted"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-linear-to-br from-gradient-from to-gradient-to px-4 py-2 text-sm font-semibold text-white shadow-md shadow-primary/25 transition hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
