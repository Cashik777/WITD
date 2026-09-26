import { Link } from 'react-router-dom'

export function Hero() {
  return (
    <section className="relative h-[92vh] min-h-[560px] w-full overflow-hidden bg-black">
      <img
        src="/assets/hero/witd-hero.svg"
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-70"
        // Placeholder graphic — drop production photography in at
        // /public/assets/hero/witd-hero.jpg (or update the src) to replace.
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-black/30" />

      <div className="relative h-full max-w-content mx-auto px-5 md:px-8 flex flex-col justify-end pb-16 md:pb-20">
        <h1 className="font-display text-[13vw] md:text-[6.5vw] leading-[0.95] text-paper max-w-4xl">
          Wake in the dream.
        </h1>
        <p className="mt-5 text-sm md:text-base tracking-widest uppercase text-paper/80">
          You are here. Now choose how to move.
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-4">
          <Link
            to="/shop"
            className="px-7 py-3.5 bg-paper text-black text-xs tracking-widest uppercase hover:bg-white transition-colors duration-200"
          >
            Shop the Drop
          </Link>
          <Link
            to="/about"
            className="px-7 py-3.5 border border-paper/50 text-paper text-xs tracking-widest uppercase hover:border-paper transition-colors duration-200"
          >
            Enter WITD
          </Link>
        </div>
      </div>
    </section>
  )
}
