import { GeneratableField, TextAreaField, TextField } from '../../common/FormField'
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

      <GeneratableField
        label="Password"
        value={value.password}
        onChange={(v) => onChange({ ...value, password: v })}
        onGenerate={handleGenerate}
      />

      <TextField label="URL" value={value.url} onChange={(v) => onChange({ ...value, url: v })} />
      <TextAreaField
        label="Notes"
        value={value.notes}
        onChange={(v) => onChange({ ...value, notes: v })}
      />
    </div>
  )
}
