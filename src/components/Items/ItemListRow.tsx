import { ChevronRight } from 'lucide-react'

import { KIND_ICONS } from '../../lib/itemIcons'
import type { ItemDto } from '../../types/vault'

interface Props {
  item: ItemDto
  selected: boolean
  onSelect: () => void
}

export function ItemListRow({ item, selected, onSelect }: Props) {
  const Icon = KIND_ICONS[item.payload.kind]
  const subtitle = itemSubtitle(item)

  return (
    <button
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${
        selected
          ? 'border-primary-soft-strong bg-primary-soft'
          : 'border-transparent bg-surface hover:border-border hover:bg-surface-muted'
      }`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-text-strong">
          {item.payload.title || 'Untitled'}
        </div>
        {subtitle && <div className="truncate text-xs text-text-muted">{subtitle}</div>}
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-text-muted" />
    </button>
  )
}

function itemSubtitle(item: ItemDto): string {
  switch (item.payload.kind) {
    case 'password':
      return item.payload.username || item.payload.email || item.payload.url
    case 'bookmark':
      return item.payload.url
    case 'api_key':
      return item.payload.service_name
    case 'note':
    case 'other':
      return ''
  }
}
