import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axiosClient from "../api/axiosClient"
import { Eye, EyeOff } from "lucide-react"

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false) // Thêm ẩn/hiện pass
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  // 1. Kiểm tra nếu đã login rồi thì đá sang Dashboard luôn
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      navigate('/dashboard')
    }
  }, [navigate])

  const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    // 2. Validate phía Client trước khi gọi API
    if (!email || !password) {
      setError('Vui lòng nhập đầy đủ thông tin')
      return
    }
    if (!validateEmail(email)) {
      setError('Email không đúng định dạng')
      return
    }

    setLoading(true)
    try {
      
      const response = await axiosClient.post('api/users/login', {
        email: email,
        password: password
      })

      if (response.data.success && response.data.token) {
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        navigate('/dashboard')
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Email hoặc mật khẩu không chính xác'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        <div className="card" style={styles.card}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.logo}>🌾</div>
            <h1 style={styles.title}>Smart Farm</h1>
            <p style={styles.subtitle}>Hệ thống quản lý nông trại thông minh</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                placeholder="admin@smartfarm.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="input-group" style={{ position: 'relative' }}>
              <label htmlFor="password">Mật khẩu</label>
              <input
                type={showPassword ? "text" : "password"} // Toggle type
                id="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              {/* Nút ẩn hiện mật khẩu nhỏ bên góc */}
              <span 
                onClick={() => setShowPassword(!showPassword)}
                style={styles.togglePassword}
              >
                {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
              </span>
            </div>

            {error && (
              <div className="alert alert-error" style={{ marginBottom: 'var(--spacing-md)' }}>
                <div>{error}</div>
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={styles.submitBtn} disabled={loading}>
              {loading ? <><span className="spinner"></span> Đang xử lý...</> : 'Đăng nhập'}
            </button>
          </form>

          {/* 3. Thêm link sang trang Register (Dựa trên API register đã có) */}
          <div style={styles.footerLink}>
            Chưa có tài khoản? <Link to="/register" style={{ color: '#10b981', fontWeight: '600' }}>Đăng ký ngay</Link>
          </div>

          {/* Demo Info */}
          
        </div>

        <div style={styles.copyright}>
          © 2026 Smart Farm Management System
        </div>
      </div>
    </div>
  )
}

// Gom style vào một object cho gọn code bên trên
const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
  },
  wrapper: { width: '100%', maxWidth: '400px', padding: 'var(--spacing-lg)' },
  card: { boxShadow: 'var(--shadow-xl)', padding: '2rem', borderRadius: '1rem' },
  header: { textAlign: 'center', marginBottom: '2rem' },
  logo: { fontSize: '48px', marginBottom: '0.5rem' },
  title: { margin: 0, fontSize: '28px', color: 'var(--text-primary)' },
  subtitle: { margin: 0, color: 'var(--text-secondary)', fontSize: '14px' },
  submitBtn: { width: '100%', marginBottom: '1rem', height: '45px' },
  togglePassword: {
    position: 'absolute',
    right: '10px',
    top: '38px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  footerLink: { textAlign: 'center', fontSize: '14px', marginBottom: '1rem' },
  demoBox: {
    padding: 'var(--spacing-md)',
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-md)',
    fontSize: '11px',
    color: 'var(--text-secondary)',
    textAlign: 'center',
  },
  copyright: { textAlign: 'center', marginTop: '2rem', color: 'white', fontSize: '12px' }
}

export default Login