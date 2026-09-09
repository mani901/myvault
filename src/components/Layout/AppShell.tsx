import { useEffect } from 'react'

import { useIdleTimer } from '../../lib/idleTimer'
import { useSettingsStore } from '../../stores/settingsStore'
import { useVaultStore } from '../../stores/vaultStore'
import { ItemDetailPanel } from '../Items/ItemDetailPanel'
import { ItemForm } from '../Items/ItemForm'
import { ItemList } from '../Items/ItemList'
import { PasswordGeneratorPanel } from '../PasswordGenerator/PasswordGeneratorPanel'
import { SettingsPanel } from '../Settings/SettingsPanel'
import { Sidebar } from './Sidebar'

export function AppShell() {
  const refreshItems = useVaultStore((s) => s.refreshItems)
  const refreshCounts = useVaultStore((s) => s.refreshCounts)
  const lock = useVaultStore((s) => s.lock)
  const isGeneratorOpen = useVaultStore((s) => s.isGeneratorOpen)
  const closeGenerator = useVaultStore((s) => s.closeGenerator)
  const isSettingsOpen = useVaultStore((s) => s.isSettingsOpen)
  const closeSettings = useVaultStore((s) => s.closeSettings)

  const hydrateSettings = useSettingsStore((s) => s.hydrate)
  const autoLockMinutes = useSettingsStore((s) => s.autoLockMinutes)

  useEffect(() => {
    void refreshItems()
    void refreshCounts()
    void hydrateSettings()
    // Runs once when the shell mounts, i.e. right after unlock.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useIdleTimer(autoLockMinutes, () => void lock(), true)

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-100">
      <Sidebar />
      <div className="w-80 shrink-0 border-r border-neutral-800">
        <ItemList />
      </div>
      <div className="flex-1">
        <ItemDetailPanel />
      </div>

      <ItemForm />
      {isGeneratorOpen && <PasswordGeneratorPanel onClose={closeGenerator} />}
      {isSettingsOpen && <SettingsPanel onClose={closeSettings} />}
    </div>
  )
}
