import { Check, Copy, X } from 'lucide-react'
import { useState } from 'react'

import { copyWithAutoClear } from '../../lib/clipboard'

interface CopyButtonProps {
  value: string
  label?: string
  className?: string
}

export function CopyButton({ value, label = 'Copy', className = '' }: CopyButtonProps) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle')

  async function handleClick() {
    if (!value) return
    try {
      await copyWithAutoClear(value)
      setStatus('copied')
    } catch (err) {
      console.error('Copy to clipboard failed:', err)
      setStatus('failed')
    } finally {
      setTimeout(() => setStatus('idle'), 1500)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
        status === 'failed'
          ? 'bg-danger-soft text-danger'
          : 'bg-primary-soft text-primary hover:bg-primary-soft-strong'
      } ${className}`}
    >
      {status === 'copied' && <Check className="h-3.5 w-3.5" />}
      {status === 'failed' && <X className="h-3.5 w-3.5" />}
      {status === 'idle' && <Copy className="h-3.5 w-3.5" />}
      {status === 'copied' ? 'Copied' : status === 'failed' ? 'Failed' : label}
    </button>
  )
}
