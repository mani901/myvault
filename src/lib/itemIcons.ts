import { Bookmark, Code2, FileText, Grid2x2, Key, type LucideIcon } from 'lucide-react'

import type { ItemKind } from '../types/vault'

export const KIND_ICONS: Record<ItemKind, LucideIcon> = {
  password: Key,
  bookmark: Bookmark,
  api_key: Code2,
  note: FileText,
  other: Grid2x2,
}
