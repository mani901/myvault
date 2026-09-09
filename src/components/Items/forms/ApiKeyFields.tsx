import { TextField } from '../../common/FormField'
import { generatePassword } from '../../../lib/ipc'
import type { ItemPayload } from '../../../types/vault'

type ApiKeyPayload = Extract<ItemPayload, { kind: 'api_key' }>

interface Props {
  value: ApiKeyPayload
  onChange: (value: ApiKeyPayload) => void
}

export function ApiKeyFields({ value, onChange }: Props) {
  async function handleGenerateSecret() {
    const generated = await generatePassword({
      length: 32,
      uppercase: true,
      lowercase: true,
      digits: true,
      symbols: false,
      exclude_ambiguous: false,
    })
    onChange({ ...value, secret: generated })
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
        label="Service"
        value={value.service_name}
        onChange={(v) => onChange({ ...value, service_name: v })}
      />
      <TextField
        label="Key"
        value={value.key_value}
        onChange={(v) => onChange({ ...value, key_value: v })}
        mono
      />

      <div className="space-y-1">
        <label className="text-sm text-neutral-300">Secret (optional)</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={value.secret ?? ''}
            onChange={(e) => onChange({ ...value, secret: e.target.value || null })}
            className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 font-mono text-sm outline-none focus:border-violet-500"
          />
          <button
            type="button"
            onClick={handleGenerateSecret}
            className="shrink-0 rounded-md border border-neutral-700 px-3 py-2 text-xs text-neutral-300 transition hover:bg-neutral-800"
          >
            Generate
          </button>
        </div>
      </div>

      <TextField
        label="Environment"
        value={value.environment}
        onChange={(v) => onChange({ ...value, environment: v })}
        placeholder="e.g. production"
      />
    </div>
  )
}
