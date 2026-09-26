import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { SearchIcon } from './icons'

export function SearchBar({ initialQuery = '', autoFocus = false }: { initialQuery?: string; autoFocus?: boolean }) {
  const [value, setValue] = useState(initialQuery)
  const navigate = useNavigate()

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    navigate(`/search?q=${encodeURIComponent(value)}`)
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <SearchIcon className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-mist" />
      <input
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search products, categories, collections..."
        className="w-full bg-transparent border-b border-mist/50 focus:border-paper pl-8 pr-2 py-3 text-lg md:text-2xl text-paper placeholder:text-mist outline-none transition-colors font-display"
      />
    </form>
  )
}
