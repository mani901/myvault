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
        <label className="text-sm text-neutral-300">Fields</label>
        {value.fields.map(([key, val], i) => (
          <div key={i} className="flex gap-2">
            <input
              value={key}
              onChange={(e) => updateField(i, e.target.value, val)}
              placeholder="Name"
              className="w-1/3 rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-sm outline-none focus:border-violet-500"
            />
            <input
              value={val}
              onChange={(e) => updateField(i, key, e.target.value)}
              placeholder="Value"
              className="flex-1 rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-sm outline-none focus:border-violet-500"
            />
            <button
              type="button"
              onClick={() => removeField(i)}
              aria-label="Remove field"
              className="rounded-md border border-neutral-700 px-2 text-xs text-neutral-400 transition hover:bg-neutral-800"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addField}
          className="text-xs text-violet-400 transition hover:text-violet-300"
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
