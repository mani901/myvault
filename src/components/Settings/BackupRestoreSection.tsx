import { open, save } from '@tauri-apps/plugin-dialog'
import { useState } from 'react'

import { exportBackup, importBackup } from '../../lib/ipc'
import { useVaultStore } from '../../stores/vaultStore'

const BACKUP_FILTERS = [{ name: 'MyVault Backup', extensions: ['db'] }]

function defaultBackupName(): string {
  const date = new Date().toISOString().slice(0, 10)
  return `myvault-backup-${date}.db`
}

export function BackupRestoreSection() {
  const lock = useVaultStore((s) => s.lock)

  const [exporting, setExporting] = useState(false)
  const [exportMessage, setExportMessage] = useState<string | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)

  const [restoring, setRestoring] = useState(false)
  const [restoreError, setRestoreError] = useState<string | null>(null)
  const [pendingRestorePath, setPendingRestorePath] = useState<string | null>(null)

  async function handleExport() {
    setExportMessage(null)
    setExportError(null)
    setExporting(true)
    try {
      const destination = await save({
        defaultPath: defaultBackupName(),
        filters: BACKUP_FILTERS,
      })
      if (!destination) return // user cancelled
      await exportBackup(destination)
      setExportMessage('Backup saved.')
    } catch (err) {
      setExportError(typeof err === 'string' ? err : 'Could not save backup.')
    } finally {
      setExporting(false)
    }
  }

  async function handlePickRestoreFile() {
    setRestoreError(null)
    const source = await open({ filters: BACKUP_FILTERS, multiple: false })
    if (typeof source === 'string') setPendingRestorePath(source)
  }

  async function handleConfirmRestore() {
    if (!pendingRestorePath) return
    setRestoring(true)
    setRestoreError(null)
    try {
      await importBackup(pendingRestorePath)
      setPendingRestorePath(null)
      // The restored vault's key no longer matches what's in memory —
      // return to the unlock screen so the user re-enters its password.
      await lock()
    } catch (err) {
      setRestoreError(typeof err === 'string' ? err : 'Could not restore backup.')
    } finally {
      setRestoring(false)
    }
  }

  return (
    <section className="space-y-3 border-t border-border pt-4">
      <h3 className="text-sm font-bold text-text-strong">Backup &amp; restore</h3>

      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-text-muted">
          Save an encrypted copy of your whole vault to any folder on this device.
        </p>
        <button
          onClick={() => void handleExport()}
          disabled={exporting}
          className="shrink-0 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-text-strong transition hover:bg-surface-muted disabled:opacity-50"
        >
          {exporting ? 'Saving…' : 'Export backup'}
        </button>
      </div>
      {exportMessage && (
        <p className="text-xs text-emerald-600 dark:text-emerald-400">{exportMessage}</p>
      )}
      {exportError && <p className="text-xs text-danger">{exportError}</p>}

      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-text-muted">
          Restore from a backup file. This replaces everything currently in your vault.
        </p>
        <button
          onClick={() => void handlePickRestoreFile()}
          disabled={restoring}
          className="shrink-0 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-text-strong transition hover:bg-surface-muted disabled:opacity-50"
        >
          Restore backup
        </button>
      </div>
      {restoreError && <p className="text-xs text-danger">{restoreError}</p>}

      {pendingRestorePath && (
        <div className="rounded-xl border border-danger-soft bg-danger-soft p-3">
          <p className="text-xs text-danger">
            Restoring <span className="font-semibold">{pendingRestorePath}</span> will
            permanently replace all current vault data. This can&rsquo;t be undone.
          </p>
          <div className="mt-2 flex justify-end gap-2">
            <button
              onClick={() => setPendingRestorePath(null)}
              disabled={restoring}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text transition hover:bg-surface-muted disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => void handleConfirmRestore()}
              disabled={restoring}
              className="rounded-lg bg-danger px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {restoring ? 'Restoring…' : 'Confirm restore'}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
