import { useEffect } from 'react'

import { AppShell } from './components/Layout/AppShell'
import { BackgroundDecor } from './components/Layout/BackgroundDecor'
import { SetupScreen } from './components/Unlock/SetupScreen'
import { UnlockScreen } from './components/Unlock/UnlockScreen'
import { useVaultStore } from './stores/vaultStore'

function App() {
  const status = useVaultStore((s) => s.status)
  const init = useVaultStore((s) => s.init)

  useEffect(() => {
    init()
  }, [init])

  return (
    <>
      <BackgroundDecor />
      {status === 'loading' && (
        <div className="flex min-h-screen items-center justify-center text-sm text-text-muted">
          Loading vault…
        </div>
      )}
      {status === 'setup' && <SetupScreen />}
      {status === 'locked' && <UnlockScreen />}
      {status === 'unlocked' && <AppShell />}
    </>
  )
}

export default App
