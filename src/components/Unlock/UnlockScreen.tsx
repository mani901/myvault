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
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 text-neutral-100">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-5 rounded-xl border border-neutral-800 bg-neutral-900 p-8 shadow-xl"
      >
        <div>
          <h1 className="text-xl font-semibold">myvault is locked</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Enter your master password to unlock.
          </p>
        </div>

        <div className="space-y-1">
          <label className="text-sm text-neutral-300" htmlFor="unlock-password">
            Master password
          </label>
          <input
            id="unlock-password"
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-violet-500"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={submitting || password.length === 0}
          className="w-full rounded-md bg-violet-600 py-2 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-50"
        >
          {submitting ? 'Unlocking…' : 'Unlock'}
        </button>
      </form>
    </div>
  )
}
