import { Lock } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import { useVaultStore } from '../../stores/vaultStore'

export function UnlockScreen() {
  const unlock = useVaultStore((s) => s.unlock)
  const error = useVaultStore((s) => s.error)
  const clearError = useVaultStore((s) => s.clearError)

  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    clearError()
    setSubmitting(true)
    try {
      await unlock(password)
    } catch {
      setPassword('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-6 rounded-3xl border border-border bg-surface p-8 shadow-2xl"
      >
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-gradient-from to-gradient-to shadow-lg shadow-primary/25">
            <Lock className="h-6 w-6 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-xl font-extrabold text-text-strong">MyVault is locked</h1>
          <p className="mt-1 text-sm text-text-muted">
            Enter your master password to unlock.
          </p>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-text" htmlFor="unlock-password">
            Master password
          </label>
          <input
            id="unlock-password"
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2.5 text-sm text-text-strong outline-none transition focus:border-primary"
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={submitting || password.length === 0}
          className="w-full rounded-xl bg-linear-to-br from-gradient-from to-gradient-to py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/25 transition hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? 'Unlocking…' : 'Unlock'}
        </button>
      </form>
    </div>
  )
}
