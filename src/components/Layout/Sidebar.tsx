import { Lock, Settings, ShieldCheck, Wand2, type LucideIcon } from 'lucide-react'

import { KIND_ICONS } from '../../lib/itemIcons'
import { useVaultStore } from '../../stores/vaultStore'
import { ITEM_KIND_LABELS, ITEM_KIND_ORDER } from '../../types/vault'

export function Sidebar() {
  const activeKind = useVaultStore((s) => s.activeKind)
  const setActiveKind = useVaultStore((s) => s.setActiveKind)
  const itemCounts = useVaultStore((s) => s.itemCounts)
  const openGenerator = useVaultStore((s) => s.openGenerator)
  const openSettings = useVaultStore((s) => s.openSettings)
  const lock = useVaultStore((s) => s.lock)

  return (
    <div className="flex h-full w-64 shrink-0 flex-col gap-6 border-r border-border bg-surface/60 p-5">
      <nav className="space-y-1">
        {ITEM_KIND_ORDER.map((kind) => {
          const Icon = KIND_ICONS[kind]
          const active = activeKind === kind
          return (
            <button
              key={kind}
              onClick={() => setActiveKind(kind)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? 'bg-primary-soft text-text-strong'
                  : 'text-text hover:bg-surface-muted'
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${active ? 'text-primary' : 'text-text-muted'}`}
              />
              <span className="flex-1 text-left">{ITEM_KIND_LABELS[kind].plural}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  active
                    ? 'bg-primary text-white'
                    : 'bg-surface-muted text-text-muted'
                }`}
              >
                {itemCounts[kind] ?? 0}
              </span>
            </button>
          )
        })}
      </nav>

      <div className="space-y-1 border-t border-border pt-4">
        <SidebarAction icon={Wand2} label="Password generator" onClick={openGenerator} />
        <SidebarAction icon={Settings} label="Settings" onClick={openSettings} />
        <SidebarAction icon={Lock} label="Lock vault" onClick={() => void lock()} />
      </div>

      <div className="mt-auto rounded-2xl border border-primary-soft-strong bg-linear-to-br from-primary-soft to-transparent p-4">
        <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-gradient-from to-gradient-to">
          <ShieldCheck className="h-4 w-4 text-white" />
        </div>
        <div className="text-sm font-bold text-text-strong">Stay secure</div>
        <p className="mt-1 text-xs leading-relaxed text-text-muted">
          Your data is encrypted locally on this device.
        </p>
      </div>
    </div>
  )
}

function SidebarAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text transition hover:bg-surface-muted"
    >
      <Icon className="h-4 w-4 shrink-0 text-text-muted" />
      {label}
    </button>
  )
}
