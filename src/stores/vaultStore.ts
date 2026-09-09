import { create } from 'zustand'

import * as ipc from '../lib/ipc'
import { useSettingsStore } from './settingsStore'
import type { ItemDto, ItemKind, ItemPayload } from '../types/vault'

export type VaultScreenStatus = 'loading' | 'setup' | 'locked' | 'unlocked'
export type FormMode = 'create' | 'edit' | null

interface VaultStore {
  status: VaultScreenStatus
  error: string | null

  activeKind: ItemKind
  searchQuery: string
  items: ItemDto[]
  itemCounts: Record<string, number>
  itemsLoading: boolean
  itemsError: string | null
  selectedItemId: string | null
  isFormOpen: boolean
  formMode: FormMode
  isGeneratorOpen: boolean
  isSettingsOpen: boolean

  init: () => Promise<void>
  setup: (password: string) => Promise<void>
  unlock: (password: string) => Promise<void>
  lock: () => Promise<void>
  clearError: () => void

  setActiveKind: (kind: ItemKind) => void
  setSearchQuery: (query: string) => void
  refreshItems: () => Promise<void>
  refreshCounts: () => Promise<void>
  selectItem: (id: string | null) => void
  openCreateForm: () => void
  openEditForm: (id: string) => void
  closeForm: () => void
  saveItem: (payload: ItemPayload) => Promise<ItemDto | null>
  removeItem: (id: string) => Promise<void>
  openGenerator: () => void
  closeGenerator: () => void
  openSettings: () => void
  closeSettings: () => void
}

// Tauri rejects command errors with the value AppError serializes to, which
// is a plain string (see src-tauri/src/error.rs).
function errorMessage(err: unknown): string {
  return typeof err === 'string' ? err : 'Something went wrong.'
}

let searchDebounce: ReturnType<typeof setTimeout> | null = null

export const useVaultStore = create<VaultStore>((set, get) => ({
  status: 'loading',
  error: null,

  activeKind: 'password',
  searchQuery: '',
  items: [],
  itemCounts: {},
  itemsLoading: false,
  itemsError: null,
  selectedItemId: null,
  isFormOpen: false,
  formMode: null,
  isGeneratorOpen: false,
  isSettingsOpen: false,

  init: async () => {
    try {
      const status = await ipc.vaultStatus()
      if (!status.initialized) {
        set({ status: 'setup', error: null })
        return
      }
      if (status.unlocked) {
        set({ status: 'unlocked', error: null })
        return
      }
      const quickUnlocked = await ipc.tryQuickUnlock()
      set({ status: quickUnlocked ? 'unlocked' : 'locked', error: null })
    } catch (err) {
      set({ status: 'locked', error: errorMessage(err) })
    }
  },

  setup: async (password) => {
    set({ error: null })
    try {
      await ipc.setupMasterPassword(password)
      set({ status: 'unlocked' })
    } catch (err) {
      set({ error: errorMessage(err) })
      throw err
    }
  },

  unlock: async (password) => {
    set({ error: null })
    try {
      await ipc.unlock(password)
      set({ status: 'unlocked' })
    } catch (err) {
      set({ error: errorMessage(err) })
      throw err
    }
  },

  lock: async () => {
    await ipc.lock()
    useSettingsStore.getState().reset()
    set({
      status: 'locked',
      error: null,
      items: [],
      itemCounts: {},
      selectedItemId: null,
      isFormOpen: false,
      formMode: null,
      isGeneratorOpen: false,
      isSettingsOpen: false,
      searchQuery: '',
    })
  },

  clearError: () => set({ error: null }),

  setActiveKind: (kind) => {
    set({ activeKind: kind, selectedItemId: null, isFormOpen: false, formMode: null })
    void get().refreshItems()
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query })
    if (searchDebounce) clearTimeout(searchDebounce)
    searchDebounce = setTimeout(() => {
      void get().refreshItems()
    }, 200)
  },

  refreshItems: async () => {
    set({ itemsLoading: true, itemsError: null })
    try {
      const { activeKind, searchQuery } = get()
      const items = await ipc.listItems(activeKind, searchQuery || undefined)
      set({ items, itemsLoading: false })
    } catch (err) {
      set({ itemsLoading: false, itemsError: errorMessage(err) })
    }
  },

  refreshCounts: async () => {
    try {
      const itemCounts = await ipc.itemCounts()
      set({ itemCounts })
    } catch (err) {
      set({ itemsError: errorMessage(err) })
    }
  },

  selectItem: (id) => set({ selectedItemId: id }),

  openCreateForm: () => set({ isFormOpen: true, formMode: 'create', selectedItemId: null }),

  openEditForm: (id) => set({ isFormOpen: true, formMode: 'edit', selectedItemId: id }),

  closeForm: () => set({ isFormOpen: false, formMode: null }),

  saveItem: async (payload) => {
    const { formMode, selectedItemId } = get()
    set({ itemsError: null })
    try {
      const saved =
        formMode === 'edit' && selectedItemId
          ? await ipc.updateItem(selectedItemId, payload)
          : await ipc.createItem(payload)
      set({ isFormOpen: false, formMode: null, selectedItemId: saved.id })
      await get().refreshItems()
      await get().refreshCounts()
      return saved
    } catch (err) {
      set({ itemsError: errorMessage(err) })
      return null
    }
  },

  removeItem: async (id) => {
    set({ itemsError: null })
    try {
      await ipc.deleteItem(id)
      set((state) => ({
        selectedItemId: state.selectedItemId === id ? null : state.selectedItemId,
      }))
      await get().refreshItems()
      await get().refreshCounts()
    } catch (err) {
      set({ itemsError: errorMessage(err) })
    }
  },

  openGenerator: () => set({ isGeneratorOpen: true }),
  closeGenerator: () => set({ isGeneratorOpen: false }),
  openSettings: () => set({ isSettingsOpen: true }),
  closeSettings: () => set({ isSettingsOpen: false }),
}))
