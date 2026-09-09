import { TextField } from '../../common/FormField'
import type { ItemPayload } from '../../../types/vault'

type BookmarkPayload = Extract<ItemPayload, { kind: 'bookmark' }>

interface Props {
  value: BookmarkPayload
  onChange: (value: BookmarkPayload) => void
}

export function BookmarkFields({ value, onChange }: Props) {
  return (
    <div className="space-y-3">
      <TextField
        label="Title"
        value={value.title}
        onChange={(v) => onChange({ ...value, title: v })}
        autoFocus
      />
      <TextField label="URL" value={value.url} onChange={(v) => onChange({ ...value, url: v })} />
      <TextField
        label="Tags (comma-separated)"
        value={value.tags.join(', ')}
        onChange={(v) =>
          onChange({
            ...value,
            tags: v
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean),
          })
        }
      />
    </div>
  )
}
