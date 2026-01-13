// app/admin/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Login failed')
        return
      }

      router.push('/admin')
    } catch {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="admin-card" style={{ width: '100%', maxWidth: '400px' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '24px' }}>Admin Login</h1>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="admin-form-group">
            <label className="admin-label">Email</label>
            <input
              type="email"
              className="admin-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-label">Password</label>
            <input
              type="password"
              className="admin-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="admin-btn" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}
