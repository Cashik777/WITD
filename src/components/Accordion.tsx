import { useState, type ReactNode } from 'react'
import { PlusIcon, MinusIcon } from './icons'

export function Accordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-line">
      <button
        className="w-full py-4 flex items-center justify-between text-left"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="text-xs tracking-widest uppercase text-paper">{title}</span>
        <span className="text-paper/70">{open ? <MinusIcon /> : <PlusIcon />}</span>
      </button>
      {open && <div className="pb-5 text-sm text-paper/75 leading-relaxed">{children}</div>}
    </div>
  )
}
