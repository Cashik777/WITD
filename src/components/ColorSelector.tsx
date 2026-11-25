import { SwatchDot } from './SwatchDot'
import { useLocale } from '@/hooks/useLocale'
import { useFilterLabels } from '@/hooks/useFilterLabels'

interface ColorSelectorProps {
  colors: string[]
  selected: string | null
  onSelect: (color: string) => void
}

export function ColorSelector({ colors, selected, onSelect }: ColorSelectorProps) {
  const { t } = useLocale()
  const { colorLabel } = useFilterLabels()
  return (
    <div>
      <span className="text-xs tracking-widest uppercase text-paper mb-3 block">
        {t('product.color')}
        {selected ? ` — ${colorLabel(selected)}` : ''}
      </span>
      <div className="flex flex-wrap gap-2.5">
        {colors.map((color) => (
          <button
            key={color}
            onClick={() => onSelect(color)}
            aria-label={colorLabel(color)}
            className={`w-9 h-9 shrink-0 rounded-full border-2 transition-all duration-150 ${
              selected === color ? 'border-paper scale-110' : 'border-transparent hover:border-mist'
            }`}
          >
            <SwatchDot color={color} className="block w-full h-full rounded-full border border-paper/15" />
          </button>
        ))}
      </div>
    </div>
  )
}
