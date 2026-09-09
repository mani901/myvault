import { useState } from 'react'

import { CopyButton } from '../common/CopyButton'
import { useVaultStore } from '../../stores/vaultStore'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'

export function ItemDetailPanel() {
  const items = useVaultStore((s) => s.items)
  const selectedItemId = useVaultStore((s) => s.selectedItemId)
  const openEditForm = useVaultStore((s) => s.openEditForm)
  const removeItem = useVaultStore((s) => s.removeItem)

  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const item = items.find((i) => i.id === selectedItemId)

  if (!item) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-neutral-500">
        Select an item to view its details.
      </div>
    )
  }

  const { payload } = item

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-lg font-semibold text-neutral-100">{payload.title || 'Untitled'}</h2>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => openEditForm(item.id)}
            className="rounded-md border border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 transition hover:bg-neutral-800"
          >
            Edit
          </button>
          <button
            onClick={() => setConfirmingDelete(true)}
            className="rounded-md border border-red-900 px-3 py-1.5 text-xs text-red-400 transition hover:bg-red-950"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {payload.kind === 'password' && (
          <>
            <DetailRow label="Username" value={payload.username} copyable />
            <DetailRow label="Password" value={payload.password} copyable mono masked />
            <DetailRow label="URL" value={payload.url} />
            {payload.notes && <DetailRow label="Notes" value={payload.notes} multiline />}
          </>
        )}
        {payload.kind === 'bookmark' && (
          <>
            <DetailRow label="URL" value={payload.url} copyable />
            {payload.tags.length > 0 && (
              <DetailRow label="Tags" value={payload.tags.join(', ')} />
            )}
          </>
        )}
        {payload.kind === 'api_key' && (
          <>
            <DetailRow label="Service" value={payload.service_name} />
            <DetailRow label="Key" value={payload.key_value} copyable mono masked />
            {payload.secret && (
              <DetailRow label="Secret" value={payload.secret} copyable mono masked />
            )}
            <DetailRow label="Environment" value={payload.environment} />
          </>
        )}
        {payload.kind === 'note' && <DetailRow label="Note" value={payload.body} multiline />}
        {payload.kind === 'other' && (
          <>
            {payload.fields.map(([key, val], i) => (
              <DetailRow key={i} label={key || `Field ${i + 1}`} value={val} copyable />
            ))}
            {payload.notes && <DetailRow label="Notes" value={payload.notes} multiline />}
          </>
        )}
      </div>

      {confirmingDelete && (
        <DeleteConfirmDialog
          itemTitle={payload.title}
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={() => {
            setConfirmingDelete(false)
            void removeItem(item.id)
          }}
        />
      )}
    </div>
  )
}

interface DetailRowProps {
  label: string
  value: string
  copyable?: boolean
  mono?: boolean
  masked?: boolean
  multiline?: boolean
}

function DetailRow({ label, value, copyable, mono, masked, multiline }: DetailRowProps) {
  const [revealed, setRevealed] = useState(!masked)
  if (!value) return null

  return (
    <div>
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="mt-0.5 flex items-center gap-2">
        <span
          className={`${mono ? 'font-mono' : ''} ${
            multiline ? 'whitespace-pre-wrap' : 'truncate'
          } text-sm text-neutral-100`}
        >
          {revealed ? value : '••••••••'}
        </span>
        {masked && (
          <button
            onClick={() => setRevealed((r) => !r)}
            className="shrink-0 text-xs text-neutral-500 transition hover:text-neutral-300"
          >
            {revealed ? 'Hide' : 'Show'}
          </button>
        )}
        {copyable && <CopyButton value={value} className="shrink-0" />}
      </div>
    </div>
  )
}
