import { Lock, Moon, Search, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

import { getOsUsername } from '../../lib/ipc'
import { useThemeStore } from '../../stores/themeStore'
import { useVaultStore } from '../../stores/vaultStore'

export function TopBar() {
  const searchQuery = useVaultStore((s) => s.searchQuery)
  const setSearchQuery = useVaultStore((s) => s.setSearchQuery)
  const openSettings = useVaultStore((s) => s.openSettings)
  const theme = useThemeStore((s) => s.theme)
  const toggleTheme = useThemeStore((s) => s.toggleTheme)

  const [username, setUsername] = useState<string | null>(null)

  useEffect(() => {
    void getOsUsername().then(setUsername).catch(() => setUsername(null))
  }, [])

  const displayName = username ?? 'there'
  const initial = (username ?? 'V').charAt(0).toUpperCase()

  return (
    <header className="flex items-center gap-6 border-b border-border bg-surface/70 px-6 py-4 backdrop-blur-sm">
      <div className="flex shrink-0 items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-gradient-from to-gradient-to shadow-lg shadow-primary/20">
          <Lock className="h-5 w-5 text-white" strokeWidth={2.5} />
        </div>
        <div className="leading-tight">
          <div className="text-lg font-extrabold text-text-strong">MyVault</div>
          <div className="text-xs text-text-muted">Your secrets, safer.</div>
        </div>
      </div>

      <div className="relative flex-1 max-w-xl">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search passwords, sites, or tags..."
          className="w-full rounded-2xl border border-border bg-surface-muted py-2.5 pl-11 pr-4 text-sm text-text-strong outline-none transition placeholder:text-text-muted focus:border-primary"
        />
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-3">
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-muted text-text-muted transition hover:text-primary"
        >
          {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>

        <button
          onClick={openSettings}
          className="flex items-center gap-2 rounded-2xl px-2 py-1.5 transition hover:bg-surface-muted"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-gradient-from to-gradient-to text-sm font-bold text-white">
            {initial}
          </div>
          <div className="text-left leading-tight">
            <div className="text-xs text-text-muted">Hello,</div>
            <div className="text-sm font-bold text-text-strong">{displayName}</div>
          </div>
        </button>
      </div>
    </header>
  )
}
