import { TextAreaField, TextField } from '../../common/FormField'
import { generatePassword } from '../../../lib/ipc'
import type { ItemPayload } from '../../../types/vault'

type PasswordPayload = Extract<ItemPayload, { kind: 'password' }>

interface Props {
  value: PasswordPayload
  onChange: (value: PasswordPayload) => void
}

export function PasswordFields({ value, onChange }: Props) {
  async function handleGenerate() {
    const generated = await generatePassword({
      length: 20,
      uppercase: true,
      lowercase: true,
      digits: true,
      symbols: true,
      exclude_ambiguous: true,
    })
    onChange({ ...value, password: generated })
  }

  return (
    <div className="space-y-3">
      <TextField
        label="Title"
        value={value.title}
        onChange={(v) => onChange({ ...value, title: v })}
        autoFocus
      />
      <TextField
        label="Username"
        value={value.username}
        onChange={(v) => onChange({ ...value, username: v })}
      />

      <div className="space-y-1">
        <label className="text-sm text-neutral-300">Password</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={value.password}
            onChange={(e) => onChange({ ...value, password: e.target.value })}
            className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 font-mono text-sm outline-none focus:border-violet-500"
          />
          <button
            type="button"
            onClick={handleGenerate}
            className="shrink-0 rounded-md border border-neutral-700 px-3 py-2 text-xs text-neutral-300 transition hover:bg-neutral-800"
          >
            Generate
          </button>
        </div>
      </div>

      <TextField label="URL" value={value.url} onChange={(v) => onChange({ ...value, url: v })} />
      <TextAreaField
        label="Notes"
        value={value.notes}
        onChange={(v) => onChange({ ...value, notes: v })}
      />
    </div>
  )
}
