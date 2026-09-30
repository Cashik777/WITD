import { Link } from 'react-router-dom'
import { CommunityVisual } from './CommunityVisual'

export function CommunitySection() {
  return (
    <section className="bg-[#0F0F0D] border-t border-line">
      <div className="max-w-content mx-auto px-5 md:px-8 py-24 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h2 className="font-display text-3xl md:text-4xl text-paper">Join the community.</h2>
          <p className="mt-4 text-sm text-paper/70 max-w-md leading-relaxed">
            WITD is more than clothing — it&rsquo;s a growing group of people paying closer attention to how they
            move through their own lives. The community space is opening soon.
          </p>
          <Link
            to="/community"
            className="inline-block mt-7 px-7 py-3.5 border border-paper/50 text-paper text-xs tracking-widest uppercase hover:border-paper transition-colors"
          >
            Enter the Community
          </Link>
        </div>
        <div className="aspect-[4/3]">
          <CommunityVisual />
        </div>
      </div>
    </section>
  )
}
