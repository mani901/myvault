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
      <label className="text-sm text-neutral-300">{label}</label>
      <input
        type="text"
        value={value}
        autoFocus={autoFocus}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-violet-500 ${
          mono ? 'font-mono' : ''
        }`}
      />
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
      <label className="text-sm text-neutral-300">{label}</label>
      <textarea
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className="w-full resize-none rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-violet-500"
      />
    </div>
  )
}
