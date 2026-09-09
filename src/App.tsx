import { useEffect } from 'react'

import { AppShell } from './components/Layout/AppShell'
import { SetupScreen } from './components/Unlock/SetupScreen'
import { UnlockScreen } from './components/Unlock/UnlockScreen'
import { useVaultStore } from './stores/vaultStore'

function App() {
  const status = useVaultStore((s) => s.status)
  const init = useVaultStore((s) => s.init)

  useEffect(() => {
    init()
  }, [init])

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-neutral-400">
        Loading vault…
      </div>
    )
  }

  if (status === 'setup') return <SetupScreen />
  if (status === 'locked') return <UnlockScreen />
  return <AppShell />
}

export default App
