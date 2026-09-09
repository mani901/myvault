import { clear, writeText } from '@tauri-apps/plugin-clipboard-manager'

const DEFAULT_TTL_MS = 20_000

let copyToken = 0

/**
 * Copies `value` to the clipboard and clears it again after `ttlMs`, unless
 * a newer copy has happened in the meantime (tracked via a token so the
 * first timer never wipes out a second, more recent copy).
 */
export async function copyWithAutoClear(value: string, ttlMs = DEFAULT_TTL_MS): Promise<void> {
  const token = ++copyToken
  await writeText(value)
  setTimeout(() => {
    if (copyToken === token) {
      clear().catch(() => {
        // Best-effort: nothing meaningful to do if the OS clipboard is busy.
      })
    }
  }, ttlMs)
}
