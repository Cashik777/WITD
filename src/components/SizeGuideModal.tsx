import { Modal } from './Modal'

const rows = [
  { size: 'XS', chest: '34–36"', length: '27"' },
  { size: 'S', chest: '36–38"', length: '28"' },
  { size: 'M', chest: '39–41"', length: '29"' },
  { size: 'L', chest: '42–44"', length: '30"' },
  { size: 'XL', chest: '45–47"', length: '31"' },
  { size: 'XXL', chest: '48–50"', length: '32"' },
]

// Sized for the tee category today. The architecture leaves room for
// per-category charts later — pass a `category` prop and swap the `rows`
// source once hoodies/outerwear are live, without changing the modal itself.
export function SizeGuideModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Size Guide">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs tracking-widest uppercase text-mist border-b border-line">
            <th className="pb-3">Size</th>
            <th className="pb-3">Chest</th>
            <th className="pb-3">Length</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.size} className="border-b border-line/60">
              <td className="py-3 text-paper">{r.size}</td>
              <td className="py-3 text-paper/75">{r.chest}</td>
              <td className="py-3 text-paper/75">{r.length}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-5 text-xs text-mist leading-relaxed">
        All WITD tees are cut in a boxy, oversized fit. Measurements are body measurements — for a closer fit,
        size down. Fits are printed per style below the size chart as they're added to the catalog.
      </p>
    </Modal>
  )
}
