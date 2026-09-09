export function BackgroundDecor() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-linear-to-br from-blob-a to-blob-b opacity-40 blur-3xl" />
      <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-linear-to-br from-blob-a to-blob-b opacity-25 blur-3xl" />
      <span className="absolute bottom-6 right-8 -rotate-6 font-script text-2xl text-primary/40">
        Small steps,
        <br />
        safer tomorrow.
      </span>
    </div>
  )
}
