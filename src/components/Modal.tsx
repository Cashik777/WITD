import type { ReactNode } from 'react'
import { CloseIcon } from './icons'

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full md:max-w-lg bg-black border border-line md:rounded-sm max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-black flex items-center justify-between px-6 py-5 border-b border-line">
          <h2 className="text-sm tracking-widest uppercase text-paper">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="text-paper">
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-6">{children}</div>
      </div>
    </div>
  )
}
