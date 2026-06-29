import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authAPI } from '@/services/api'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ email: '', password: '', first_name: '', last_name: '' })
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authAPI.register(formData)
      toast.success('Registration successful! Please login.')
      navigate('/login')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8">Register</h1>
        <form onSubmit={handleRegister} className="space-y-4">
          <input type="text" placeholder="First Name" onChange={(e) => setFormData({...formData, first_name: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
          <input type="text" placeholder="Last Name" onChange={(e) => setFormData({...formData, last_name: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
          <input type="email" placeholder="Email" onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
          <input type="password" placeholder="Password" onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
          <button type="submit" disabled={loading} className="w-full py-2 bg-blue-600 text-white rounded-lg">{loading ? 'Registering...' : 'Register'}</button>
        </form>
        <p className="text-center mt-4"><Link to="/login" className="text-blue-600">Login instead</Link></p>
      </div>
    </div>
  )
}
