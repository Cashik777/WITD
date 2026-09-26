import { Link, Navigate, NavLink, Outlet } from 'react-router-dom'
import { useAdminAuth } from '@/hooks/useAdminAuth'

export default function AdminLayout() {
  const { email, loading, logout } = useAdminAuth()

  if (loading) return null
  if (!email) return <Navigate to="/admin/login" replace />

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `text-xs tracking-widest uppercase pb-1 border-b ${isActive ? 'text-paper border-paper' : 'text-paper/60 border-transparent hover:text-paper'}`

  return (
    <div className="max-w-content mx-auto px-5 md:px-8 py-10">
      <div className="flex items-center justify-between border-b border-line pb-5 mb-8">
        <div className="flex items-center gap-8">
          <Link to="/admin" className="font-display text-xl text-paper">
            WITD Admin
          </Link>
          <nav className="flex items-center gap-6">
            <NavLink to="/admin" end className={linkClass}>
              Products
            </NavLink>
            <NavLink to="/admin/orders" className={linkClass}>
              Orders
            </NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-mist">{email}</span>
          <button onClick={logout} className="text-xs tracking-widest uppercase text-paper/60 hover:text-paper">
            Log Out
          </button>
        </div>
      </div>
      <Outlet />
    </div>
  )
}
