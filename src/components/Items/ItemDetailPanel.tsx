import { Calendar, Clock, FileText, Pencil, Tag, Trash2, type LucideIcon } from 'lucide-react'
import { useState } from 'react'

import { CopyButton } from '../common/CopyButton'
import { KIND_ICONS } from '../../lib/itemIcons'
import { useVaultStore } from '../../stores/vaultStore'
import { ITEM_KIND_LABELS, type ItemPayload } from '../../types/vault'
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
      <div className="flex h-full items-center justify-center text-sm text-text-muted">
        Select an item to view its details.
      </div>
    )
  }

  const { payload } = item
  const Icon = KIND_ICONS[payload.kind]
  const subtitle = detailSubtitle(payload)

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-soft">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-strong">{payload.title || 'Untitled'}</h2>
            <p className="text-sm text-text-muted">{subtitle}</p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => openEditForm(item.id)}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-text-strong transition hover:bg-surface-muted"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
          <button
            onClick={() => setConfirmingDelete(true)}
            className="flex items-center gap-1.5 rounded-xl bg-danger-soft px-3 py-2 text-xs font-semibold text-danger transition hover:opacity-80"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {payload.kind === 'password' && (
          <>
            <DetailRow label="Username" value={payload.username} copyable />
            <DetailRow label="Password" value={payload.password} copyable mono masked />
            <DetailRow label="URL" value={payload.url} copyable />
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
          </>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={Calendar} label="Created" value={formatDate(item.created_at)} tone="info" />
        <StatCard
          icon={Clock}
          label="Last updated"
          value={formatDate(item.updated_at)}
          tone="info"
        />
        <StatCard
          icon={Tag}
          label="Category"
          value={ITEM_KIND_LABELS[payload.kind].singular}
          tone="primary"
        />
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-text-strong">
            <FileText className="h-4 w-4 text-text-muted" />
            Notes
          </div>
          <button
            onClick={() => openEditForm(item.id)}
            aria-label="Edit notes"
            className="text-text-muted transition hover:text-primary"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="text-sm italic text-text-muted">{notesValue(payload) || 'No notes added yet. Click edit to add one.'}</p>
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

function detailSubtitle(payload: ItemPayload): string {
  switch (payload.kind) {
    case 'password':
      return payload.notes || 'No additional notes'
    case 'bookmark':
      return payload.url
    case 'api_key':
      return payload.environment || payload.service_name
    case 'note':
      return 'Secure note'
    case 'other':
      return payload.notes || 'No additional notes'
  }
}

function notesValue(payload: ItemPayload): string {
  if (payload.kind === 'password' || payload.kind === 'other') return payload.notes ?? ''
  if (payload.kind === 'note') return payload.body
  return ''
}

function formatDate(epochMillis: number): string {
  return new Date(epochMillis).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon
  label: string
  value: string
  tone: 'info' | 'primary'
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-3">
      <div
        className={`mb-2 flex h-8 w-8 items-center justify-center rounded-full ${
          tone === 'info' ? 'bg-info-soft' : 'bg-primary-soft'
        }`}
      >
        <Icon className={`h-4 w-4 ${tone === 'info' ? 'text-info-icon' : 'text-primary'}`} />
      </div>
      <div className="text-xs text-text-muted">{label}</div>
      <div className="truncate text-sm font-bold text-text-strong">{value}</div>
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
    <div className="rounded-2xl border border-border bg-surface-muted px-4 py-3">
      <div className="text-xs font-medium text-text-muted">{label}</div>
      <div className="mt-1 flex items-center gap-2">
        <span
          className={`${mono ? 'font-mono' : ''} ${
            multiline ? 'whitespace-pre-wrap' : 'truncate'
          } flex-1 text-sm text-text-strong`}
        >
          {revealed ? value : '••••••••'}
        </span>
        {masked && (
          <button
            onClick={() => setRevealed((r) => !r)}
            className="shrink-0 text-xs font-medium text-text-muted transition hover:text-primary"
          >
            {revealed ? 'Hide' : 'Show'}
          </button>
        )}
        {copyable && <CopyButton value={value} className="shrink-0" />}
      </div>
    </div>
  )
}
