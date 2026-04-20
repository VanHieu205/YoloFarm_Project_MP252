import { useState } from 'react'
import { User, Lock, Building2, Bell, Save, Eye, EyeOff, Mail, Phone, MapPin, Leaf, Ruler, Calendar, RefreshCw, Bug, Wheat, Cloud } from 'lucide-react'
import { FaUser, FaRuler, FaMapMarkerAlt, FaSeedling } from 'react-icons/fa'
import '../styles/components.css'

const UserProfile = () => {
  const [activeTab, setActiveTab] = useState('personal')
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  })

  // Personal Info State
  const [personalInfo, setPersonalInfo] = useState({
    fullName: 'Nguyễn Văn A',
    email: 'admin@smartfarm.com',
    phone: '0987654321',
    avatar: null
  })

  // Farm Info State
  const [farmInfo, setFarmInfo] = useState({
    farmName: 'Trang Trại Xanh',
    address: 'Xã Phước Long, Huyện Vĩnh Cửu, Đồng Nai',
    totalArea: 15.5,
    mainCrops: ['Lúa', 'Ngô', 'Rau'],
    foundedYear: 2020,
  })

  // Password State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotification: true,
    smsNotification: false,
    weatherAlert: true,
    pestAlert: true,
    harvestReminder: true,
  })

  // Edit modes
  const [editingPersonal, setEditingPersonal] = useState(false)
  const [editingFarm, setEditingFarm] = useState(false)

  // Handlers
  const handlePersonalChange = (field, value) => {
    setPersonalInfo({ ...personalInfo, [field]: value })
  }

  const handleFarmChange = (field, value) => {
    setFarmInfo({ ...farmInfo, [field]: value })
  }

  const handlePasswordChange = (field, value) => {
    setPasswordData({ ...passwordData, [field]: value })
  }

  const handleNotificationChange = (setting) => {
    setNotificationSettings({
      ...notificationSettings,
      [setting]: !notificationSettings[setting],
    })
  }

  const savePersonalInfo = () => {
    // TODO: API call to save personal info
    alert('Lưu thông tin cá nhân thành công!')
    setEditingPersonal(false)
  }

  const saveFarmInfo = () => {
    // TODO: API call to save farm info
    alert('Lưu thông tin trang trại thành công!')
    setEditingFarm(false)
  }

  const changePassword = () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      alert('Vui lòng điền đầy đủ thông tin!')
      return
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Mật khẩu mới không khớp!')
      return
    }
    // TODO: API call to change password
    alert('Đổi mật khẩu thành công!')
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
  }

  return (
    <div>
      {/* Page Header */}
      <div
        style={{
          marginBottom: 'var(--spacing-xl)',
          background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
          padding: 'var(--spacing-xl)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-lg)' }}>
          <div style={{ fontSize: '48px' }}>{personalInfo.avatar}</div>
          <div>
            <h1 style={{ margin: 0, marginBottom: '4px', color: 'white', fontSize: '28px' }}>
              <User style={{ marginRight: '8px', display: 'inline-block' }} />
              {personalInfo.fullName}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0 }}>{personalInfo.email}</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--spacing-lg)', flexWrap: 'wrap' }}>
        {[
          { id: 'personal', label: 'Thông tin cá nhân', icon: User },
          { id: 'farm', label: 'Thông tin trại', icon: Building2 },
          { id: 'password', label: 'Đổi mật khẩu', icon: Lock },
          { id: 'notifications', label: 'Thông báo', icon: Bell },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 16px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: activeTab === tab.id ? 'var(--primary-color)' : '#e5e7eb',
              color: activeTab === tab.id ? '#1f2937' : '#374151',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13px',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab.id) e.currentTarget.style.background = '#d1d5db'
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.id) e.currentTarget.style.background = '#e5e7eb'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {/* Personal Info Tab */}
        {activeTab === 'personal' && (
          <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
              <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><User size={20} /> Thông tin cá nhân</h2>
              {!editingPersonal && (
                <button
                  onClick={() => setEditingPersonal(true)}
                  style={{
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '13px',
                    transition: 'all 0.2s',
                    display: 'flex',          
                    alignItems: 'center',     
                    justifyContent: 'center',
                    gap: '6px'                
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#2563eb')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#3b82f6')}
                >
                  <RefreshCw size={ 15} /> Chỉnh sửa
                </button>
              )}
            </div>

            {editingPersonal ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Tên đầy đủ</label>
                  <input
                    type="text"
                    value={personalInfo.fullName}
                    onChange={(e) => handlePersonalChange('fullName', e.target.value)}
                    style={{ width: '100%', marginTop: '6px', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid #d1d5db', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Email</label>
                  <input
                    type="email"
                    value={personalInfo.email}
                    onChange={(e) => handlePersonalChange('email', e.target.value)}
                    style={{ width: '100%', marginTop: '6px', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid #d1d5db', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Số điện thoại</label>
                  <input
                    type="tel"
                    value={personalInfo.phone}
                    onChange={(e) => handlePersonalChange('phone', e.target.value)}
                    style={{ width: '100%', marginTop: '6px', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid #d1d5db', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Avatar (Emoji)</label>
                  <input
                    type="text"
                    value={personalInfo.avatar}
                    onChange={(e) => handlePersonalChange('avatar', e.target.value)}
                    style={{ width: '100%', marginTop: '6px', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid #d1d5db', fontSize: '14px' }}
                    maxLength="2"
                  />
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.5)', borderRadius: 'var(--radius-md)' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    <FaUser style={{ marginRight: '4px', display: 'inline-block' }} /> Tên đầy đủ
                  </label>
                  <div style={{ fontSize: '16px', fontWeight: '600', marginTop: '8px' }}>{personalInfo.fullName}</div>
                </div>
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.5)', borderRadius: 'var(--radius-md)' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}><Mail size={14} style={{ marginRight: '4px', display: 'inline-block' }} /> Email</label>
                  <div style={{ fontSize: '16px', fontWeight: '600', marginTop: '8px', color: '#3b82f6' }}>{personalInfo.email}</div>
                </div>
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.5)', borderRadius: 'var(--radius-md)' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    <Phone size={14} style={{ marginRight: '4px', display: 'inline-block' }} /> Số điện thoại
                  </label>
                  <div style={{ fontSize: '16px', fontWeight: '600', marginTop: '8px' }}>{personalInfo.phone}</div>
                </div>
              </div>
            )}

            {editingPersonal && (
              <div style={{ display: 'flex', gap: '8px', marginTop: 'var(--spacing-lg)' }}>
                <button
                  onClick={savePersonalInfo}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: 'var(--primary-color)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                >
                  <Save size={16} /> Lưu
                </button>
                <button
                  onClick={() => setEditingPersonal(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: '#e5e7eb',
                    color: '#1f2937',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Hủy
                </button>
              </div>
            )}
          </div>
        )}

        {/* Farm Info Tab */}
        {activeTab === 'farm' && (
          <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
              <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><Building2 size={20} /> Thông tin trại</h2>
              {!editingFarm && (
                <button
                  onClick={() => setEditingFarm(true)}
                  style={{
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '13px',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#059669')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#10b981')}
                >
                  <RefreshCw size={14} /> Chỉnh sửa
                </button>
              )}
            </div>

            {editingFarm ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Tên trang trại</label>
                  <input
                    type="text"
                    value={farmInfo.farmName}
                    onChange={(e) => handleFarmChange('farmName', e.target.value)}
                    style={{ width: '100%', marginTop: '6px', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid #d1d5db', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Tổng diện tích (ha)</label>
                  <input
                    type="number"
                    value={farmInfo.totalArea}
                    onChange={(e) => handleFarmChange('totalArea', parseFloat(e.target.value))}
                    style={{ width: '100%', marginTop: '6px', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid #d1d5db', fontSize: '14px' }}
                    step="0.1"
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Địa chỉ</label>
                  <input
                    type="text"
                    value={farmInfo.address}
                    onChange={(e) => handleFarmChange('address', e.target.value)}
                    style={{ width: '100%', marginTop: '6px', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid #d1d5db', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Loại cây trồng chính</label>
                  <input
                    type="text"
                    value={farmInfo.mainCrops.join(', ')}
                    onChange={(e) => handleFarmChange('mainCrops', e.target.value.split(',').map((c) => c.trim()))}
                    style={{ width: '100%', marginTop: '6px', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid #d1d5db', fontSize: '14px' }}
                    placeholder="VD: Lúa, Ngô, Rau"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Năm thành lập</label>
                  <input
                    type="number"
                    value={farmInfo.foundedYear}
                    onChange={(e) => handleFarmChange('foundedYear', parseInt(e.target.value))}
                    style={{ width: '100%', marginTop: '6px', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid #d1d5db', fontSize: '14px' }}
                  />
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.5)', borderRadius: 'var(--radius-md)' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>🏡 Tên trang trại</label>
                  <div style={{ fontSize: '16px', fontWeight: '600', marginTop: '8px', color: '#10b981' }}>{farmInfo.farmName}</div>
                </div>
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.5)', borderRadius: 'var(--radius-md)' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    <FaRuler style={{ marginRight: '4px', display: 'inline-block' }} /> Tổng diện tích
                  </label>
                  <div style={{ fontSize: '16px', fontWeight: '600', marginTop: '8px' }}>{farmInfo.totalArea} ha</div>
                </div>
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.5)', borderRadius: 'var(--radius-md)', gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    < FaMapMarkerAlt style={{ marginRight: '4px', display: 'inline-block' }} /> Địa chỉ
                  </label>
                  <div style={{ fontSize: '14px', marginTop: '8px', color: '#666' }}>{farmInfo.address}</div>
                </div>
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.5)', borderRadius: 'var(--radius-md)' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    <FaSeedling style={{ marginRight: '4px', display: 'inline-block' }} /> Cây trồng chính
                  </label>
                  <div style={{ fontSize: '14px', marginTop: '8px' }}>{farmInfo.mainCrops.join(', ')}</div>
                </div>
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.5)', borderRadius: 'var(--radius-md)' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>📅 Năm thành lập</label>
                  <div style={{ fontSize: '16px', fontWeight: '600', marginTop: '8px' }}>{farmInfo.foundedYear}</div>
                </div>
              </div>
            )}

            {editingFarm && (
              <div style={{ display: 'flex', gap: '8px', marginTop: 'var(--spacing-lg)' }}>
                <button
                  onClick={saveFarmInfo}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                >
                  <Save size={16} /> Lưu
                </button>
                <button
                  onClick={() => setEditingFarm(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: '#e5e7eb',
                    color: '#1f2937',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Hủy
                </button>
              </div>
            )}
          </div>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid #e5e7eb', maxWidth: '600px' }}>
            <h2 style={{ margin: 0, marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: '8px' }}><Lock size={20} /> Đổi mật khẩu</h2>

            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Mật khẩu hiện tại</label>
              <div style={{ position: 'relative', marginTop: '6px' }}>
                <input
                  type={showPassword.current ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                  style={{ width: '100%', padding: '10px', paddingRight: '40px', borderRadius: 'var(--radius-md)', border: '1px solid #d1d5db', fontSize: '14px' }}
                  placeholder="Nhập mật khẩu hiện tại"
                />
                <button
                  onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
                >
                  {showPassword.current ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Mật khẩu mới</label>
              <div style={{ position: 'relative', marginTop: '6px' }}>
                <input
                  type={showPassword.new ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                  style={{ width: '100%', padding: '10px', paddingRight: '40px', borderRadius: 'var(--radius-md)', border: '1px solid #d1d5db', fontSize: '14px' }}
                  placeholder="Nhập mật khẩu mới"
                />
                <button
                  onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
                >
                  {showPassword.new ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Xác nhận mật khẩu mới</label>
              <div style={{ position: 'relative', marginTop: '6px' }}>
                <input
                  type={showPassword.confirm ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                  style={{ width: '100%', padding: '10px', paddingRight: '40px', borderRadius: 'var(--radius-md)', border: '1px solid #d1d5db', fontSize: '14px' }}
                  placeholder="Nhập lại mật khẩu mới"
                />
                <button
                  onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
                >
                  {showPassword.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              onClick={changePassword}
              style={{
                width: '100%',
                padding: '12px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '14px',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#dc2626')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#ef4444')}
            >
              <RefreshCw size={16} /> Đổi mật khẩu
            </button>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid #e5e7eb' }}>
            <h2 style={{ margin: 0, marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: '8px' }}><Bell size={20} /> Cài đặt thông báo</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
              {[
                { key: 'emailNotification', label: 'Thông báo qua email', description: 'Nhận thông báo qua email', icon: Mail },
                { key: 'smsNotification', label: 'Thông báo qua SMS', description: 'Nhận thông báo qua tin nhắn', icon: Phone },
                { key: 'weatherAlert', label: 'Cảnh báo thời tiết', description: 'Nhận cảnh báo về thời tiết bất thường', icon: Cloud },
                { key: 'pestAlert', label: 'Cảnh báo sâu bệnh', description: 'Nhận cảnh báo khi phát hiện sâu bệnh', icon: Bug },
                { key: 'harvestReminder', label: 'Nhắc nhở thu hoạch', description: 'Nhắc nhở khi đến lịch thu hoạch', icon: Wheat },
              ].map((item) => (
                <div
                  key={item.key}
                  style={{
                    padding: 'var(--spacing-lg)',
                    background: 'rgba(255,255,255,0.5)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {item.icon && <item.icon size={16} />}
                      {item.label}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{item.description}</div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={notificationSettings[item.key]}
                      onChange={() => handleNotificationChange(item.key)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary-color)' }}
                    />
                  </label>
                </div>
              ))}
            </div>

            <button
              onClick={() => alert('Cài đặt thông báo đã được lưu!')}
              style={{
                width: '100%',
                marginTop: 'var(--spacing-xl)',
                padding: '12px',
                background: 'var(--primary-color)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '14px',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              <Save size={16} /> Lưu cài đặt
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserProfile
