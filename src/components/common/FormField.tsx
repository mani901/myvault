interface TextFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  autoFocus?: boolean
  mono?: boolean
  placeholder?: string
}

export function TextField({ label, value, onChange, autoFocus, mono, placeholder }: TextFieldProps) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-text">{label}</label>
      <input
        type="text"
        value={value}
        autoFocus={autoFocus}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-xl border border-border bg-surface-muted px-3 py-2 text-sm text-text-strong outline-none transition placeholder:text-text-muted focus:border-primary ${
          mono ? 'font-mono' : ''
        }`}
      />
    </div>
  )
}

interface GeneratableFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  onGenerate: () => void
}

export function GeneratableField({ label, value, onChange, onGenerate }: GeneratableFieldProps) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-text">{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2 font-mono text-sm text-text-strong outline-none transition focus:border-primary"
        />
        <button
          type="button"
          onClick={onGenerate}
          className="shrink-0 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-text transition hover:bg-surface-muted"
        >
          Generate
        </button>
      </div>
    </div>
  )
}

interface TextAreaFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  rows?: number
}

export function TextAreaField({ label, value, onChange, rows = 3 }: TextAreaFieldProps) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-text">{label}</label>
      <textarea
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className="w-full resize-none rounded-xl border border-border bg-surface-muted px-3 py-2 text-sm text-text-strong outline-none transition focus:border-primary"
      />
    </div>
  )
}
