import { TextAreaField, TextField } from '../../common/FormField'
import type { ItemPayload } from '../../../types/vault'

type NotePayload = Extract<ItemPayload, { kind: 'note' }>

interface Props {
  value: NotePayload
  onChange: (value: NotePayload) => void
}

export function NoteFields({ value, onChange }: Props) {
  return (
    <div className="space-y-3">
      <TextField
        label="Title"
        value={value.title}
        onChange={(v) => onChange({ ...value, title: v })}
        autoFocus
      />
      <TextAreaField
        label="Note"
        value={value.body}
        onChange={(v) => onChange({ ...value, body: v })}
        rows={8}
      />
    </div>
  )
}
