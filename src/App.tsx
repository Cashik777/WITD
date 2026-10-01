import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { CartDrawer } from '@/components/CartDrawer'
import Home from '@/pages/Home'
import Shop from '@/pages/Shop'
import ProductDetail from '@/pages/ProductDetail'
import About from '@/pages/About'
import Community from '@/pages/Community'
import CartPage from '@/pages/CartPage'
import Checkout from '@/pages/Checkout'
import OrderConfirmation from '@/pages/OrderConfirmation'
import VerifyPurchase from '@/pages/VerifyPurchase'
import SearchPage from '@/pages/SearchPage'
import NotFound from '@/pages/NotFound'
import { Privacy, Terms } from '@/pages/Legal'
import Account from '@/pages/Account'
import { AdminAuthProvider } from '@/context/AdminAuthContext'
import AdminLogin from '@/pages/admin/AdminLogin'
import AdminLayout from '@/pages/admin/AdminLayout'
import AdminProducts from '@/pages/admin/AdminProducts'
import AdminProductForm from '@/pages/admin/AdminProductForm'
import AdminOrders from '@/pages/admin/AdminOrders'
import AdminCategories from '@/pages/admin/AdminCategories'

function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    // Footer/Checkout etc. link to /about#shipping, #returns, #contact —
    // this used to force scroll-to-top on every route change regardless of
    // hash, so those anchor links silently landed at the top of the page
    // instead of the section they pointed to.
    if (hash) {
      const el = document.getElementById(hash.slice(1))
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
        return
      }
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

function StorefrontLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/shop/:category" element={<Shop />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/community" element={<Community />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-confirmation" element={<OrderConfirmation />} />
          <Route path="/verify" element={<VerifyPurchase />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/account" element={<Account />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  )
}

function AdminSection() {
  return (
    <div className="min-h-screen bg-black">
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminProducts />} />
          <Route path="/admin/products/new" element={<AdminProductForm />} />
          <Route path="/admin/products/:id/edit" element={<AdminProductForm />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
        </Route>
      </Routes>
    </div>
  )
}

export default function App() {
  const { pathname } = useLocation()
  const isAdmin = pathname.startsWith('/admin')

  return (
    <>
      <ScrollToTop />
      {isAdmin ? (
        <AdminAuthProvider>
          <AdminSection />
        </AdminAuthProvider>
      ) : (
        <StorefrontLayout />
      )}
    </>
  )
}
