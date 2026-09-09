import { invoke } from '@tauri-apps/api/core'

import type {
  ItemDto,
  ItemKind,
  ItemPayload,
  PasswordGenOptions,
  Settings,
  VaultStatus,
} from '../types/vault'

export const vaultStatus = () => invoke<VaultStatus>('vault_status')

export const setupMasterPassword = (password: string) =>
  invoke<void>('setup_master_password', { password })

export const unlock = (password: string) => invoke<void>('unlock', { password })

export const lock = () => invoke<void>('lock')

export const changeMasterPassword = (oldPassword: string, newPassword: string) =>
  invoke<void>('change_master_password', { oldPassword, newPassword })

export const enableQuickUnlock = () => invoke<void>('enable_quick_unlock')

export const disableQuickUnlock = () => invoke<void>('disable_quick_unlock')

export const tryQuickUnlock = () => invoke<boolean>('try_quick_unlock')

export const listItems = (kind?: ItemKind, query?: string) =>
  invoke<ItemDto[]>('list_items', { kind, query })

export const getItem = (id: string) => invoke<ItemDto>('get_item', { id })

export const createItem = (payload: ItemPayload) => invoke<ItemDto>('create_item', { payload })

export const updateItem = (id: string, payload: ItemPayload) =>
  invoke<ItemDto>('update_item', { id, payload })

export const deleteItem = (id: string) => invoke<void>('delete_item', { id })

export const itemCounts = () => invoke<Record<string, number>>('item_counts')

export const generatePassword = (options: PasswordGenOptions) =>
  invoke<string>('generate_password', { options })

export const getSettings = () => invoke<Settings>('get_settings')

export const setAutoLockMinutes = (minutes: number) =>
  invoke<void>('set_auto_lock_minutes', { minutes })
