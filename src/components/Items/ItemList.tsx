import { Plus } from 'lucide-react'

import { useVaultStore } from '../../stores/vaultStore'
import { ITEM_KIND_LABELS } from '../../types/vault'
import { EmptyState } from './EmptyState'
import { ItemListRow } from './ItemListRow'

export function ItemList() {
  const items = useVaultStore((s) => s.items)
  const itemsLoading = useVaultStore((s) => s.itemsLoading)
  const selectedItemId = useVaultStore((s) => s.selectedItemId)
  const selectItem = useVaultStore((s) => s.selectItem)
  const activeKind = useVaultStore((s) => s.activeKind)
  const itemCounts = useVaultStore((s) => s.itemCounts)
  const openCreateForm = useVaultStore((s) => s.openCreateForm)
  const searchQuery = useVaultStore((s) => s.searchQuery)

  const label = ITEM_KIND_LABELS[activeKind]
  const count = itemCounts[activeKind] ?? 0

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-border p-5">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-extrabold text-text-strong">{label.plural}</h1>
          <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary">
            {count}
          </span>
        </div>
        <button
          onClick={openCreateForm}
          className="flex items-center gap-1.5 rounded-xl bg-linear-to-br from-gradient-from to-gradient-to px-4 py-2 text-sm font-semibold text-white shadow-md shadow-primary/25 transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Add New
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {itemsLoading && items.length === 0 && (
          <p className="p-3 text-sm text-text-muted">Loading…</p>
        )}
        {!itemsLoading && items.length === 0 && (
          <EmptyState searchActive={searchQuery.trim().length > 0} />
        )}
        <div className="space-y-2">
          {items.map((item) => (
            <ItemListRow
              key={item.id}
              item={item}
              selected={item.id === selectedItemId}
              onSelect={() => selectItem(item.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
