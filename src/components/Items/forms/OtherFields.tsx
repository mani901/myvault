import { TextAreaField, TextField } from '../../common/FormField'
import type { ItemPayload } from '../../../types/vault'

type OtherPayload = Extract<ItemPayload, { kind: 'other' }>

interface Props {
  value: OtherPayload
  onChange: (value: OtherPayload) => void
}

export function OtherFields({ value, onChange }: Props) {
  function updateField(index: number, key: string, val: string) {
    const fields = value.fields.map((f, i) => (i === index ? ([key, val] as [string, string]) : f))
    onChange({ ...value, fields })
  }

  function addField() {
    onChange({ ...value, fields: [...value.fields, ['', '']] })
  }

  function removeField(index: number) {
    onChange({ ...value, fields: value.fields.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-3">
      <TextField
        label="Title"
        value={value.title}
        onChange={(v) => onChange({ ...value, title: v })}
        autoFocus
      />

      <div className="space-y-2">
        <label className="text-sm font-medium text-text">Fields</label>
        {value.fields.map(([key, val], i) => (
          <div key={i} className="flex gap-2">
            <input
              value={key}
              onChange={(e) => updateField(i, e.target.value, val)}
              placeholder="Name"
              className="w-1/3 rounded-xl border border-border bg-surface-muted px-2 py-1.5 text-sm text-text-strong outline-none transition placeholder:text-text-muted focus:border-primary"
            />
            <input
              value={val}
              onChange={(e) => updateField(i, key, e.target.value)}
              placeholder="Value"
              className="flex-1 rounded-xl border border-border bg-surface-muted px-2 py-1.5 text-sm text-text-strong outline-none transition placeholder:text-text-muted focus:border-primary"
            />
            <button
              type="button"
              onClick={() => removeField(i)}
              aria-label="Remove field"
              className="rounded-xl border border-border px-2 text-xs text-text-muted transition hover:bg-surface-muted"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addField}
          className="text-xs font-semibold text-primary transition hover:text-primary-hover"
        >
          + Add field
        </button>
      </div>

      <TextAreaField
        label="Notes (optional)"
        value={value.notes ?? ''}
        onChange={(v) => onChange({ ...value, notes: v || null })}
      />
    </div>
  )
}
