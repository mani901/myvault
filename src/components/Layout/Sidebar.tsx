import { useVaultStore } from '../../stores/vaultStore'
import { ITEM_KIND_LABELS, ITEM_KIND_ORDER } from '../../types/vault'

export function Sidebar() {
  const activeKind = useVaultStore((s) => s.activeKind)
  const setActiveKind = useVaultStore((s) => s.setActiveKind)
  const itemCounts = useVaultStore((s) => s.itemCounts)
  const searchQuery = useVaultStore((s) => s.searchQuery)
  const setSearchQuery = useVaultStore((s) => s.setSearchQuery)
  const openCreateForm = useVaultStore((s) => s.openCreateForm)
  const openGenerator = useVaultStore((s) => s.openGenerator)
  const openSettings = useVaultStore((s) => s.openSettings)
  const lock = useVaultStore((s) => s.lock)

  return (
    <div className="flex h-full w-60 shrink-0 flex-col gap-4 border-r border-neutral-800 bg-neutral-950 p-4">
      <input
        type="search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search…"
        className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-violet-500"
      />

      <nav className="flex-1 space-y-1 overflow-y-auto">
        {ITEM_KIND_ORDER.map((kind) => (
          <button
            key={kind}
            onClick={() => setActiveKind(kind)}
            className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition ${
              activeKind === kind
                ? 'bg-violet-600/20 text-neutral-100'
                : 'text-neutral-300 hover:bg-neutral-900'
            }`}
          >
            <span>{ITEM_KIND_LABELS[kind].plural}</span>
            <span className="text-xs text-neutral-500">{itemCounts[kind] ?? 0}</span>
          </button>
        ))}
      </nav>

      <button
        onClick={openCreateForm}
        className="w-full rounded-md bg-violet-600 py-2 text-sm font-medium text-white transition hover:bg-violet-500"
      >
        + New {ITEM_KIND_LABELS[activeKind].singular}
      </button>

      <div className="space-y-1 border-t border-neutral-800 pt-3">
        <button
          onClick={openGenerator}
          className="w-full rounded-md px-3 py-2 text-left text-sm text-neutral-300 transition hover:bg-neutral-900"
        >
          Password generator
        </button>
        <button
          onClick={openSettings}
          className="w-full rounded-md px-3 py-2 text-left text-sm text-neutral-300 transition hover:bg-neutral-900"
        >
          Settings
        </button>
        <button
          onClick={() => void lock()}
          className="w-full rounded-md px-3 py-2 text-left text-sm text-neutral-300 transition hover:bg-neutral-900"
        >
          Lock vault
        </button>
      </div>
    </div>
  )
}
