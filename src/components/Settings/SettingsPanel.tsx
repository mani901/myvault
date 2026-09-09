import { useState, type FormEvent } from 'react'

import { Modal } from '../common/Modal'
import { changeMasterPassword } from '../../lib/ipc'
import { useSettingsStore } from '../../stores/settingsStore'
import { BackupRestoreSection } from './BackupRestoreSection'

interface Props {
  onClose: () => void
}

const AUTO_LOCK_OPTIONS = [1, 5, 10, 15, 30, 60]

const passwordInputClass =
  'w-full rounded-xl border border-border bg-surface-muted px-3 py-2 text-sm text-text-strong outline-none transition placeholder:text-text-muted focus:border-primary'

export function SettingsPanel({ onClose }: Props) {
  const autoLockMinutes = useSettingsStore((s) => s.autoLockMinutes)
  const setAutoLockMinutes = useSettingsStore((s) => s.setAutoLockMinutes)
  const quickUnlockEnabled = useSettingsStore((s) => s.quickUnlockEnabled)
  const quickUnlockBusy = useSettingsStore((s) => s.quickUnlockBusy)
  const enableQuickUnlock = useSettingsStore((s) => s.enableQuickUnlock)
  const disableQuickUnlock = useSettingsStore((s) => s.disableQuickUnlock)
  const error = useSettingsStore((s) => s.error)

  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changeError, setChangeError] = useState<string | null>(null)
  const [changeSuccess, setChangeSuccess] = useState(false)
  const [changing, setChanging] = useState(false)

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault()
    setChangeError(null)
    setChangeSuccess(false)
    if (newPassword.length < 8) {
      setChangeError('New password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setChangeError('New passwords do not match.')
      return
    }
    setChanging(true)
    try {
      await changeMasterPassword(oldPassword, newPassword)
      setChangeSuccess(true)
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setChangeError(typeof err === 'string' ? err : 'Could not change password.')
    } finally {
      setChanging(false)
    }
  }

  return (
    <Modal title="Settings" onClose={onClose}>
      <div className="space-y-6">
        <section className="space-y-2">
          <h3 className="text-sm font-bold text-text-strong">Auto-lock</h3>
          <select
            value={autoLockMinutes}
            onChange={(e) => void setAutoLockMinutes(Number(e.target.value))}
            className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2 text-sm text-text-strong outline-none transition focus:border-primary"
          >
            {AUTO_LOCK_OPTIONS.map((m) => (
              <option key={m} value={m}>
                Lock after {m} minute{m === 1 ? '' : 's'} of inactivity
              </option>
            ))}
          </select>
        </section>

        <section className="space-y-2 border-t border-border pt-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-text-strong">Quick unlock</h3>
              <p className="text-xs text-text-muted">
                Skips the master password using this OS account&rsquo;s keychain.
              </p>
            </div>
            <button
              onClick={() => void (quickUnlockEnabled ? disableQuickUnlock() : enableQuickUnlock())}
              disabled={quickUnlockBusy}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition disabled:opacity-50 ${
                quickUnlockEnabled
                  ? 'bg-primary text-white hover:bg-primary-hover'
                  : 'bg-surface-muted text-text-muted hover:bg-primary-soft'
              }`}
            >
              {quickUnlockEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>
          {quickUnlockEnabled && (
            <p className="text-xs text-amber-500 dark:text-amber-400">
              Anyone signed into this OS account can open the vault without the master
              password.
            </p>
          )}
          {error && <p className="text-xs text-danger">{error}</p>}
        </section>

        <section className="space-y-2 border-t border-border pt-4">
          <h3 className="text-sm font-bold text-text-strong">Change master password</h3>
          <form onSubmit={handleChangePassword} className="space-y-2">
            <input
              type="password"
              placeholder="Current password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className={passwordInputClass}
            />
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={passwordInputClass}
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={passwordInputClass}
            />
            {changeError && <p className="text-sm text-danger">{changeError}</p>}
            {changeSuccess && (
              <p className="text-sm text-emerald-600 dark:text-emerald-400">Password changed.</p>
            )}
            <button
              type="submit"
              disabled={changing}
              className="w-full rounded-xl bg-linear-to-br from-gradient-from to-gradient-to py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/25 transition hover:opacity-90 disabled:opacity-50"
            >
              {changing ? 'Changing…' : 'Change password'}
            </button>
          </form>
        </section>

        <BackupRestoreSection />
      </div>
    </Modal>
  )
}
