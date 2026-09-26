import { Link } from 'react-router-dom'

export default function Community() {
  return (
    <div className="max-w-content mx-auto px-5 md:px-8 py-20 md:py-28">
      <div className="max-w-2xl">
        <h1 className="font-display text-4xl md:text-6xl text-paper leading-tight">
          More than clothing.
        </h1>
        <p className="mt-6 text-base text-paper/75 leading-relaxed">
          WITD is for people paying closer attention to how they move through their own lives — to consciousness,
          creativity, and the choices that come with actually being awake for them. The clothing is one part of it.
          The community is the rest.
        </p>
      </div>

      <div className="mt-16 border border-line p-10 md:p-16 flex flex-col items-start gap-6">
        <span className="text-xs tracking-widest uppercase text-mist">Coming Soon</span>
        <h2 className="font-display text-2xl md:text-3xl text-paper max-w-lg">
          The WITD community space is opening soon.
        </h2>
        <p className="text-sm text-paper/70 max-w-md">
          A dedicated space to connect with others who think the way you do is in the works. Sign up to the
          newsletter on the homepage to be the first to know when it opens.
        </p>
        <button
          disabled
          className="mt-2 px-7 py-3.5 border border-mist/40 text-mist text-xs tracking-widest uppercase cursor-not-allowed"
        >
          Enter the Community
        </button>
      </div>

      <p className="mt-8 text-sm text-paper/60">
        Already own a piece?{' '}
        <Link to="/verify" className="text-paper underline underline-offset-4 hover:text-paper/70">
          Verify your purchase
        </Link>
        .
      </p>
    </div>
  )
}
