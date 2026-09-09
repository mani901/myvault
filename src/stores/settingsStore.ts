import { create } from 'zustand'

import * as ipc from '../lib/ipc'

interface SettingsStore {
  autoLockMinutes: number
  quickUnlockEnabled: boolean
  quickUnlockBusy: boolean
  loaded: boolean
  error: string | null
  hydrate: () => Promise<void>
  setAutoLockMinutes: (minutes: number) => Promise<void>
  enableQuickUnlock: () => Promise<void>
  disableQuickUnlock: () => Promise<void>
  reset: () => void
  clearError: () => void
}

function errorMessage(err: unknown): string {
  return typeof err === 'string' ? err : 'Something went wrong.'
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  autoLockMinutes: 5,
  quickUnlockEnabled: false,
  quickUnlockBusy: false,
  loaded: false,
  error: null,

  hydrate: async () => {
    try {
      const settings = await ipc.getSettings()
      set({
        autoLockMinutes: settings.auto_lock_minutes,
        quickUnlockEnabled: settings.quick_unlock_enabled,
        loaded: true,
      })
    } catch (err) {
      set({ loaded: true, error: errorMessage(err) })
    }
  },

  setAutoLockMinutes: async (minutes) => {
    try {
      await ipc.setAutoLockMinutes(minutes)
      set({ autoLockMinutes: minutes, error: null })
    } catch (err) {
      set({ error: errorMessage(err) })
    }
  },

  enableQuickUnlock: async () => {
    set({ quickUnlockBusy: true, error: null })
    try {
      await ipc.enableQuickUnlock()
      set({ quickUnlockEnabled: true })
    } catch (err) {
      set({ error: errorMessage(err) })
    } finally {
      set({ quickUnlockBusy: false })
    }
  },

  disableQuickUnlock: async () => {
    set({ quickUnlockBusy: true, error: null })
    try {
      await ipc.disableQuickUnlock()
      set({ quickUnlockEnabled: false })
    } catch (err) {
      set({ error: errorMessage(err) })
    } finally {
      set({ quickUnlockBusy: false })
    }
  },

  reset: () => set({ loaded: false, error: null }),
  clearError: () => set({ error: null }),
}))
