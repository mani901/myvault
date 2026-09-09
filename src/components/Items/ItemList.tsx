import { useVaultStore } from '../../stores/vaultStore'
import { ItemListRow } from './ItemListRow'

export function ItemList() {
  const items = useVaultStore((s) => s.items)
  const itemsLoading = useVaultStore((s) => s.itemsLoading)
  const selectedItemId = useVaultStore((s) => s.selectedItemId)
  const selectItem = useVaultStore((s) => s.selectItem)

  return (
    <div className="flex h-full flex-col gap-1 overflow-y-auto p-2">
      {itemsLoading && items.length === 0 && (
        <p className="p-3 text-sm text-neutral-500">Loading…</p>
      )}
      {!itemsLoading && items.length === 0 && (
        <p className="p-3 text-sm text-neutral-500">No items yet.</p>
      )}
      {items.map((item) => (
        <ItemListRow
          key={item.id}
          item={item}
          selected={item.id === selectedItemId}
          onSelect={() => selectItem(item.id)}
        />
      ))}
    </div>
  )
}
