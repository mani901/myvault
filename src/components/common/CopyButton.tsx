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
      className={`rounded-md border border-neutral-700 px-2 py-1 text-xs text-neutral-300 transition hover:bg-neutral-800 ${className}`}
    >
      {copied ? 'Copied' : label}
    </button>
  )
}
