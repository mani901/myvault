import { useState, type FormEvent } from 'react'

import { useVaultStore } from '../../stores/vaultStore'

export function SetupScreen() {
  const setup = useVaultStore((s) => s.setup)
  const storeError = useVaultStore((s) => s.error)
  const clearError = useVaultStore((s) => s.clearError)

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    clearError()
    setLocalError(null)

    if (password.length < 8) {
      setLocalError('Master password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setLocalError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      await setup(password)
    } catch {
      // Surfaced via storeError below.
    } finally {
      setSubmitting(false)
    }
  }

  const error = localError ?? storeError

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 text-neutral-100">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-5 rounded-xl border border-neutral-800 bg-neutral-900 p-8 shadow-xl"
      >
        <div>
          <h1 className="text-xl font-semibold">Create your vault</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Choose a master password. It never leaves this device and can&rsquo;t be
            recovered if lost.
          </p>
        </div>

        <div className="space-y-1">
          <label className="text-sm text-neutral-300" htmlFor="setup-password">
            Master password
          </label>
          <input
            id="setup-password"
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-violet-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-neutral-300" htmlFor="setup-confirm">
            Confirm password
          </label>
          <input
            id="setup-confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-violet-500"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-violet-600 py-2 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-50"
        >
          {submitting ? 'Creating vault…' : 'Create vault'}
        </button>
      </form>
    </div>
  )
}
