import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Simple validation
      if (!email || !password) {
        throw new Error('Vui lòng nhập đầy đủ thông tin')
      }

      // Mock authentication
      if (
        (email === 'admin@smartfarm.com' && password === 'admin123') ||
        email === 'user@smartfarm.com'
      ) {
        localStorage.setItem('token', 'mock-token-' + Date.now())
        navigate('/dashboard')
      } else {
        throw new Error('Email hoặc mật khẩu không chính xác')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: 'var(--spacing-lg)',
        }}
      >
        {/* Card */}
        <div
          className="card"
          style={{
            boxShadow: 'var(--shadow-xl)',
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
            <div
              style={{
                fontSize: '48px',
                marginBottom: 'var(--spacing-md)',
              }}
            >
              🌾
            </div>
            <h1 style={{ margin: 0, marginBottom: '8px', fontSize: '28px' }}>
              Smart Farm
            </h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
              Hệ thống quản lý nông trại thông minh
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div className="input-group">
              <label htmlFor="email">Email / Tên đăng nhập</label>
              <input
                type="email"
                id="email"
                placeholder="admin@smartfarm.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div className="input-group">
              <label htmlFor="password">Mật khẩu</label>
              <input
                type="password"
                id="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Error */}
            {error && (
              <div
                className="alert alert-error"
                style={{ marginBottom: 'var(--spacing-md)' }}
              >
                <div>{error}</div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                width: '100%',
                marginBottom: 'var(--spacing-md)',
              }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span> Đang xử lý...
                </>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </form>

          {/* Demo Info */}
          <div
            style={{
              padding: 'var(--spacing-md)',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontWeight: '600', marginBottom: '8px' }}>
              💡 Tài khoản demo:
            </div>
            <div>Email: <strong>admin@smartfarm.com</strong></div>
            <div>Mật khẩu: <strong>admin123</strong></div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            textAlign: 'center',
            marginTop: 'var(--spacing-xl)',
            color: 'white',
            fontSize: '12px',
          }}
        >
          <div>© 2024 Smart Farm Management System</div>
          <div>Tất cả quyền được bảo lưu</div>
        </div>
      </div>
    </div>
  )
}

export default Login
