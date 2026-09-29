const colorSwatch: Record<string, string> = {
  Black: '#141412',
  White: '#F4F2EC',
  'Off-White': '#E8E3D6',
  'Dark Stone': '#4A473F',
  Asphalt: '#4A4A4A',
  Ash: '#B1B0AC',
  'Heather Dust': '#E4CDB7',
  'Athletic Heather': '#B2B4B2',
  Silver: '#C9CACA',
  'Vintage White': '#F0EAD9',
  'Vintage Black': '#2B2B2B',
  'Dark Grey': '#3B3B3B',
  'Soft Cream': '#F3E9D7',
  Natural: '#E8DCC8',
}

interface ColorSelectorProps {
  colors: string[]
  selected: string | null
  onSelect: (color: string) => void
}

export function ColorSelector({ colors, selected, onSelect }: ColorSelectorProps) {
  return (
    <div>
      <span className="text-xs tracking-widest uppercase text-paper mb-3 block">
        Color{selected ? ` — ${selected}` : ''}
      </span>
      <div className="flex gap-2.5">
        {colors.map((color) => (
          <button
            key={color}
            onClick={() => onSelect(color)}
            aria-label={color}
            className={`w-9 h-9 rounded-full border-2 transition-all duration-150 ${
              selected === color ? 'border-paper scale-110' : 'border-transparent hover:border-mist'
            }`}
          >
            <span
              className="block w-full h-full rounded-full border border-paper/15"
              style={{ backgroundColor: colorSwatch[color] ?? '#8F8B82' }}
            />
          </button>
        ))}
      </div>
    </div>
  )
}
