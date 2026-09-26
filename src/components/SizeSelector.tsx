interface SizeSelectorProps {
  sizes: string[]
  availableSizes: string[]
  selected: string | null
  onSelect: (size: string) => void
  onOpenGuide: () => void
}

export function SizeSelector({ sizes, availableSizes, selected, onSelect, onOpenGuide }: SizeSelectorProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs tracking-widest uppercase text-paper">
          Size{selected ? ` — ${selected}` : ''}
        </span>
        <button onClick={onOpenGuide} className="text-xs text-mist hover:text-paper underline underline-offset-4">
          Size Guide
        </button>
      </div>
      <div className="grid grid-cols-6 gap-2">
        {sizes.map((size) => {
          const available = availableSizes.includes(size)
          return (
            <button
              key={size}
              disabled={!available}
              onClick={() => onSelect(size)}
              className={`h-11 text-xs border transition-colors duration-150 ${
                selected === size
                  ? 'bg-paper text-black border-paper'
                  : available
                  ? 'border-mist/50 text-paper hover:border-paper'
                  : 'border-line text-mist/40 line-through cursor-not-allowed'
              }`}
            >
              {size}
            </button>
          )
        })}
      </div>
    </div>
  )
}
