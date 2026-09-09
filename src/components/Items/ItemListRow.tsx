import type { ItemDto } from '../../types/vault'

interface Props {
  item: ItemDto
  selected: boolean
  onSelect: () => void
}

export function ItemListRow({ item, selected, onSelect }: Props) {
  const subtitle = itemSubtitle(item)

  return (
    <button
      onClick={onSelect}
      className={`block w-full rounded-md px-3 py-2 text-left transition ${
        selected ? 'bg-violet-600/20 text-neutral-100' : 'text-neutral-300 hover:bg-neutral-800'
      }`}
    >
      <div className="truncate text-sm font-medium">{item.payload.title || 'Untitled'}</div>
      {subtitle && <div className="truncate text-xs text-neutral-500">{subtitle}</div>}
    </button>
  )
}

function itemSubtitle(item: ItemDto): string {
  switch (item.payload.kind) {
    case 'password':
      return item.payload.username || item.payload.url
    case 'bookmark':
      return item.payload.url
    case 'api_key':
      return item.payload.service_name
    case 'note':
    case 'other':
      return ''
  }
}
