import { Link } from 'react-router-dom'
import { WitdSymbol } from '@/components/WitdSymbol'

export default function NotFound() {
  return (
    <div className="max-w-content mx-auto px-5 md:px-8 py-32 flex flex-col items-center text-center">
      <WitdSymbol className="w-12 h-12 text-paper/60 mb-8" />
      <h1 className="font-display text-3xl md:text-4xl text-paper">You&rsquo;re not in the dream anymore.</h1>
      <p className="mt-4 text-sm text-mist">This page doesn&rsquo;t exist — 404.</p>
      <Link
        to="/"
        className="inline-block mt-10 px-8 py-3.5 bg-paper text-black text-xs tracking-widest uppercase hover:bg-white transition-colors"
      >
        Back Home
      </Link>
    </div>
  )
}
