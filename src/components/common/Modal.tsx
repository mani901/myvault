import { useEffect, type ReactNode } from 'react'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
  widthClassName?: string
}

export function Modal({ title, onClose, children, widthClassName = 'max-w-md' }: ModalProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={onClose}
    >
      <div
        className={`w-full ${widthClassName} max-h-[85vh] overflow-y-auto rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-100">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md px-2 py-1 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
