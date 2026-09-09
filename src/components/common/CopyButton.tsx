import { Copy } from 'lucide-react'
import { useState } from 'react'

import { copyWithAutoClear } from '../../lib/clipboard'

interface CopyButtonProps {
  value: string
  label?: string
  className?: string
}

export function CopyButton({ value, label = 'Copy', className = '' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleClick() {
    if (!value) return
    await copyWithAutoClear(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex items-center gap-1.5 rounded-lg bg-primary-soft px-2.5 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary-soft-strong ${className}`}
    >
      <Copy className="h-3.5 w-3.5" />
      {copied ? 'Copied' : label}
    </button>
  )
}
