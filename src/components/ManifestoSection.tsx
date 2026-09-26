const lines = [
  'You are not your circumstances.',
  'You are the one noticing them.',
  'The dream does not end. You wake up inside it.',
]

export function ManifestoSection() {
  return (
    <section className="bg-black border-t border-line">
      <div className="max-w-content mx-auto px-5 md:px-8 py-28 md:py-36">
        <div className="space-y-4 md:space-y-6">
          {lines.map((line) => (
            <p key={line} className="font-display text-2xl md:text-4xl lg:text-5xl text-paper/90 max-w-4xl">
              {line}
            </p>
          ))}
        </div>
      </div>
    </section>
  )
}
