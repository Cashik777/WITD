import type { CartLine } from '@/types/cart'
import { formatPrice } from '@/lib/format'
import { useCart } from '@/hooks/useCart'
import { MinusIcon, PlusIcon, CloseIcon } from './icons'

export function CartItem({ line }: { line: CartLine }) {
  const { updateQuantity, removeItem } = useCart()

  return (
    <div className="flex gap-4 py-5 border-b border-line">
      <div className="w-20 h-24 bg-[#151412] shrink-0 overflow-hidden">
        <img src={line.image} alt={line.name} className="w-full h-full object-cover" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm text-paper">{line.name}</h3>
            <p className="text-xs text-mist mt-1">
              {line.color} / {line.size}
            </p>
          </div>
          <button
            onClick={() => removeItem(line.productId, line.size, line.color)}
            aria-label="Remove item"
            className="text-mist hover:text-paper shrink-0"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center border border-line">
            <button
              onClick={() => updateQuantity(line.productId, line.size, line.color, line.quantity - 1)}
              className="w-7 h-7 flex items-center justify-center text-paper/80 hover:text-paper"
              aria-label="Decrease quantity"
            >
              <MinusIcon className="w-3.5 h-3.5" />
            </button>
            <span className="w-7 text-center text-xs text-paper">{line.quantity}</span>
            <button
              onClick={() => updateQuantity(line.productId, line.size, line.color, line.quantity + 1)}
              className="w-7 h-7 flex items-center justify-center text-paper/80 hover:text-paper"
              aria-label="Increase quantity"
            >
              <PlusIcon className="w-3.5 h-3.5" />
            </button>
          </div>
          <span className="text-sm text-paper">{formatPrice(line.price * line.quantity, line.currency)}</span>
        </div>
      </div>
    </div>
  )
}
