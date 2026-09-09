import { GeneratableField, TextField } from '../../common/FormField'
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

      <GeneratableField
        label="Secret (optional)"
        value={value.secret ?? ''}
        onChange={(v) => onChange({ ...value, secret: v || null })}
        onGenerate={handleGenerateSecret}
      />

      <TextField
        label="Environment"
        value={value.environment}
        onChange={(v) => onChange({ ...value, environment: v })}
        placeholder="e.g. production"
      />
    </div>
  )
}
