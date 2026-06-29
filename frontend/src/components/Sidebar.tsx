import { Link, useLocation } from 'react-router-dom'
import { useAppSelector } from '@/redux/hooks'
import { FiSearch, FiBarChart3, FiUsers, FiShoppingCart, FiHome, FiStore } from 'react-icons/fi'
import clsx from 'clsx'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  roles?: string[]
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: <FiHome /> },
  { label: 'Search', href: '/search', icon: <FiSearch /> },
  { label: 'Negotiations', href: '/negotiations', icon: <FiShoppingCart /> },
  { label: 'Analytics', href: '/analytics', icon: <FiBarChart3 /> },
  { label: 'Team', href: '/team', icon: <FiUsers /> },
  { label: 'Supplier Portal', href: '/supplier', icon: <FiStore />, roles: ['supplier'] },
]

export default function Sidebar() {
  const location = useLocation()
  const user = useAppSelector((state) => state.auth.user)

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.roles) {
      return user && item.roles.includes(user.role)
    }
    return true
  })

  return (
    <aside className="w-64 bg-gray-900 text-white">
      <div className="p-6">
        <h2 className="text-lg font-bold">Menu</h2>
      </div>

      <nav className="space-y-2 px-4">
        {visibleItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={clsx(
              'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
              location.pathname === item.href
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-800'
            )}
          >
            <span className="text-xl">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  )
}
