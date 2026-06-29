import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import { logout } from '@/redux/slices/authSlice'
import { FiLogOut, FiUser, FiMenu } from 'react-icons/fi'

export default function Navbar() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const user = useAppSelector((state) => state.auth.user)

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="flex justify-between items-center px-6 py-4">
        <h1 className="text-xl font-bold text-blue-600">B2B Sourcing OS</h1>

        <div className="flex items-center gap-4">
          {user && (
            <>
              <div className="text-sm">
                <p className="font-medium text-gray-900">{user.first_name} {user.last_name}</p>
                <p className="text-gray-500 text-xs">{user.role}</p>
              </div>
              <button
                onClick={() => navigate('/profile')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <FiUser size={20} />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-red-100 text-red-600 rounded-lg"
              >
                <FiLogOut size={20} />
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
