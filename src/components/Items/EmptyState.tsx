import { Lock } from 'lucide-react'

interface Props {
  searchActive: boolean
}

export function EmptyState({ searchActive }: Props) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
      <div className="relative flex h-32 w-32 items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-linear-to-br from-primary-soft to-primary-soft-strong" />
        <div className="absolute -top-1 right-3 h-2 w-2 rounded-full bg-primary/40" />
        <div className="absolute bottom-3 -left-1 h-1.5 w-1.5 rounded-full bg-primary/30" />
        <Lock className="relative h-10 w-10 text-primary" strokeWidth={1.75} />
      </div>
      <div>
        <h3 className="text-base font-bold text-text-strong">
          {searchActive ? 'No matches found' : 'Keep your digital life organised'}
        </h3>
        <p className="mx-auto mt-1 max-w-[220px] text-sm text-text-muted">
          {searchActive
            ? 'Try a different search term.'
            : 'Add your first item to get started.'}
        </p>
      </div>
    </div>
  )
}
