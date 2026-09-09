import { useEffect, useState } from 'react'

import { CopyButton } from '../common/CopyButton'
import { Modal } from '../common/Modal'
import { generatePassword } from '../../lib/ipc'
import type { PasswordGenOptions } from '../../types/vault'

interface Props {
  onClose: () => void
}

const DEFAULT_OPTIONS: PasswordGenOptions = {
  length: 20,
  uppercase: true,
  lowercase: true,
  digits: true,
  symbols: true,
  exclude_ambiguous: true,
}

export function PasswordGeneratorPanel({ onClose }: Props) {
  const [options, setOptions] = useState(DEFAULT_OPTIONS)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function regenerate(next: PasswordGenOptions = options) {
    setError(null)
    try {
      const generated = await generatePassword(next)
      setPassword(generated)
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Could not generate a password.')
    }
  }

  useEffect(() => {
    // Generate once on open; further changes go through update() below.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void regenerate()
    // regenerate closes over `options` but should only run once here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function update<K extends keyof PasswordGenOptions>(key: K, value: PasswordGenOptions[K]) {
    const next = { ...options, [key]: value }
    setOptions(next)
    void regenerate(next)
  }

  return (
    <Modal title="Password generator" onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-muted px-3 py-2.5">
          <span className="flex-1 truncate font-mono text-sm text-text-strong">{password}</span>
          <CopyButton value={password} />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm text-text">
            <span>Length</span>
            <span className="font-semibold text-text-strong">{options.length}</span>
          </div>
          <input
            type="range"
            min={4}
            max={64}
            value={options.length}
            onChange={(e) => update('length', Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Toggle
            label="Uppercase (A-Z)"
            checked={options.uppercase}
            onChange={(v) => update('uppercase', v)}
          />
          <Toggle
            label="Lowercase (a-z)"
            checked={options.lowercase}
            onChange={(v) => update('lowercase', v)}
          />
          <Toggle label="Digits (0-9)" checked={options.digits} onChange={(v) => update('digits', v)} />
          <Toggle
            label="Symbols (!@#…)"
            checked={options.symbols}
            onChange={(v) => update('symbols', v)}
          />
        </div>
        <Toggle
          label="Exclude ambiguous characters (l, I, 1, O, 0)"
          checked={options.exclude_ambiguous}
          onChange={(v) => update('exclude_ambiguous', v)}
        />

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="button"
          onClick={() => regenerate()}
          className="w-full rounded-xl bg-linear-to-br from-gradient-from to-gradient-to py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/25 transition hover:opacity-90"
        >
          Regenerate
        </button>
      </div>
    </Modal>
  )
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-text">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-primary"
      />
      {label}
    </label>
  )
}
