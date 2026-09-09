export type ItemKind = 'password' | 'bookmark' | 'api_key' | 'note' | 'other'

export type ItemPayload =
  | {
      kind: 'password'
      title: string
      username: string
      password: string
      url: string
      notes: string
    }
  | {
      kind: 'bookmark'
      title: string
      url: string
      tags: string[]
    }
  | {
      kind: 'api_key'
      title: string
      service_name: string
      key_value: string
      secret: string | null
      environment: string
    }
  | {
      kind: 'note'
      title: string
      body: string
    }
  | {
      kind: 'other'
      title: string
      fields: [string, string][]
      notes: string | null
    }

export interface ItemDto {
  id: string
  favorite: boolean
  created_at: number
  updated_at: number
  payload: ItemPayload
}

export interface VaultStatus {
  initialized: boolean
  unlocked: boolean
}

export interface PasswordGenOptions {
  length: number
  uppercase: boolean
  lowercase: boolean
  digits: boolean
  symbols: boolean
  exclude_ambiguous: boolean
}

export interface Settings {
  auto_lock_minutes: number
  quick_unlock_enabled: boolean
}

export const ITEM_KIND_ORDER: ItemKind[] = ['password', 'bookmark', 'api_key', 'note', 'other']

export const ITEM_KIND_LABELS: Record<ItemKind, { plural: string; singular: string }> = {
  password: { plural: 'Passwords', singular: 'Password' },
  bookmark: { plural: 'Bookmarks', singular: 'Bookmark' },
  api_key: { plural: 'API Keys', singular: 'API Key' },
  note: { plural: 'Secure Notes', singular: 'Secure Note' },
  other: { plural: 'Other', singular: 'Item' },
}

export function emptyPayload(kind: ItemKind): ItemPayload {
  switch (kind) {
    case 'password':
      return { kind, title: '', username: '', password: '', url: '', notes: '' }
    case 'bookmark':
      return { kind, title: '', url: '', tags: [] }
    case 'api_key':
      return { kind, title: '', service_name: '', key_value: '', secret: null, environment: '' }
    case 'note':
      return { kind, title: '', body: '' }
    case 'other':
      return { kind, title: '', fields: [], notes: null }
  }
}
