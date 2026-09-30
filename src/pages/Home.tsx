import { Link } from 'react-router-dom'
import { Hero } from '@/components/Hero'
import { ProductGrid } from '@/components/ProductGrid'
import { ManifestoSection } from '@/components/ManifestoSection'
import { CommunitySection } from '@/components/CommunitySection'
import { Newsletter } from '@/components/Newsletter'
import { IdeaVisual } from '@/components/IdeaVisual'
import { useProducts } from '@/hooks/useProducts'

export default function Home() {
  const { products } = useProducts()
  const newDrop = products.filter((p) => p.new).slice(0, 4)
  const featured = products.filter((p) => p.featured).slice(0, 3)

  return (
    <div>
      <Hero />

      <section className="max-w-content mx-auto px-5 md:px-8 py-20 md:py-28">
        <div className="flex items-end justify-between mb-10">
          <h2 className="font-display text-2xl md:text-3xl text-paper">New Drop</h2>
          <Link to="/shop" className="text-xs tracking-widest uppercase text-mist hover:text-paper transition-colors">
            View All
          </Link>
        </div>
        <ProductGrid products={newDrop} />
      </section>

      <section className="bg-[#0F0F0D] border-y border-line">
        <div className="max-w-content mx-auto px-5 md:px-8 py-24 md:py-32 grid md:grid-cols-2 gap-12 items-center">
          <div className="aspect-[4/5] order-2 md:order-1">
            <IdeaVisual />
          </div>
          <div className="order-1 md:order-2">
            <h2 className="font-display text-3xl md:text-5xl text-paper leading-tight">The WITD Idea</h2>
            <p className="mt-6 text-base md:text-lg text-paper/75 leading-relaxed max-w-md">
              Reality can feel like a dream — vivid, moving fast, mostly on autopilot. WITD is for those who choose
              to become conscious inside it, and dress like they mean it.
            </p>
            <Link
              to="/about"
              className="inline-block mt-7 text-xs tracking-widest uppercase text-paper border-b border-paper pb-1"
            >
              Read the Philosophy
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-content mx-auto px-5 md:px-8 py-20 md:py-28">
        <h2 className="font-display text-2xl md:text-3xl text-paper mb-10">Featured Pieces</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {featured.map((product) => (
            <Link key={product.id} to={`/product/${product.slug}`} className="group block">
              <div className="aspect-[3/4] bg-[#151412] overflow-hidden">
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-witd"
                />
              </div>
              <p className="mt-4 font-display text-lg text-paper">{product.name}</p>
            </Link>
          ))}
        </div>
      </section>

      <ManifestoSection />
      <CommunitySection />
      <Newsletter />
    </div>
  )
}
