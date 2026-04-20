import { useState } from 'react'
import { ChevronDown, ChevronUp, Lightbulb, Waves, Activity, MapPin, Settings, CheckCircle } from 'lucide-react'
import { FaLightbulb, FaDroplet, FaThermometer } from 'react-icons/fa6'

const Devices = () => {
  const [devices, setDevices] = useState([
    // LIGHTS
    { 
      id: 1, 
      name: 'Đèn LED nhà kính 1', 
      type: 'light', 
      status: 'on', 
      icon: FaLightbulb,
      location: 'Nhà kính 1',
      power: 1500,
      color: '#f59e0b'
    },
    { 
      id: 2, 
      name: 'Đèn LED nhà kính 2', 
      type: 'light', 
      status: 'off', 
      icon: FaLightbulb,
      location: 'Nhà kính 2',
      power: 0,
      color: '#f59e0b'
    },
    { 
      id: 3, 
      name: 'Đèn LED khu A', 
      type: 'light', 
      status: 'on', 
      icon: FaLightbulb,
      location: 'Khu A',
      power: 1200,
      color: '#f59e0b'
    },
    // PUMPS
    { 
      id: 4, 
      name: 'Máy bơm nước 1', 
      type: 'pump', 
      status: 'on', 
      icon: FaDroplet,
      location: 'Khu A',
      power: 2500,
      color: '#3b82f6'
    },
    { 
      id: 5, 
      name: 'Máy bơm nước 2', 
      type: 'pump', 
      status: 'off', 
      icon: FaDroplet,
      location: 'Khu B',
      power: 0,
      color: '#3b82f6'
    },
    // SENSORS
    { 
      id: 6, 
      name: 'Cảm biến nhiệt độ 1', 
      type: 'sensor', 
      status: 'active', 
      icon: FaThermometer,
      location: 'Khu B',
      power: 100,
      color: '#8b5cf6'
    },
    { 
      id: 7, 
      name: 'Cảm biến nhiệt độ 2', 
      type: 'sensor', 
      status: 'active', 
      icon: FaThermometer,
      location: 'Nhà kính 2',
      power: 100,
      color: '#8b5cf6'
    },
  ])

  const [expandedTypes, setExpandedTypes] = useState(['light', 'pump', 'sensor'])

  const toggleType = (type) => {
    setExpandedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  const toggleDevice = (id) => {
    setDevices(devices.map(device =>
      device.id === id
        ? {
            ...device,
            status: device.status === 'on' || device.status === 'active' ? 'off' : 'on',
            power: device.status === 'on' || device.status === 'active' ? 0 : device.power || 1000
          }
        : device
    ))
  }

  const deviceTypes = {
    light: { name: 'Đèn', icon: Lightbulb, color: '#f59e0b' },
    pump: { name: 'Máy bơm', icon: Waves, color: '#3b82f6' },
    sensor: { name: 'Cảm biến', icon: Activity, color: '#8b5cf6' },
  }

  const getDevicesByType = (type) => devices.filter(d => d.type === type)
  const getActiveCount = (type) => {
    const typeDevices = getDevicesByType(type)
    return typeDevices.filter(d => d.status === 'on' || d.status === 'active').length
  }

  const TypeSection = ({ typeKey }) => {
    const typeDevices = getDevicesByType(typeKey)
    const activeCount = getActiveCount(typeKey)
    const percentage = typeDevices.length > 0 ? Math.round((activeCount / typeDevices.length) * 100) : 0
    const type = deviceTypes[typeKey]
    const isExpanded = expandedTypes.includes(typeKey)
    const TypeIcon = type.icon

    if (typeDevices.length === 0) return null

    return (
      <div style={{ marginBottom: '24px' }}>
        {/* SECTION HEADER */}
        <div
          onClick={() => toggleType(typeKey)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px',
            background: 'white',
            border: `1px solid ${type.color}40`,
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            userSelect: 'none',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f9fafb'
            e.currentTarget.style.borderColor = `${type.color}60`
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'white'
            e.currentTarget.style.borderColor = `${type.color}40`
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}
        >
          <TypeIcon size={24} color={type.color} />
          
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
              {type.name}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              {activeCount}/{typeDevices.length} đang hoạt động
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '16px', fontWeight: '700', color: type.color }}>
                {percentage}%
              </div>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>
                Tỉ lệ hoạt động
              </div>
            </div>
            {isExpanded ? <ChevronUp size={20} color="#6b7280" /> : <ChevronDown size={20} color="#6b7280" />}
          </div>
        </div>

        {/* PROGRESS BAR */}
        <div style={{ marginTop: '12px', marginBottom: '16px' }}>
          <div style={{
            height: '8px',
            background: '#e5e7eb',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div
              style={{
                height: '100%',
                background: `linear-gradient(90deg, ${type.color}, ${type.color}aa)`,
                width: `${percentage}%`,
                transition: 'width 0.3s ease'
              }}
            />
          </div>
        </div>

        {/* DEVICES LIST */}
        {isExpanded && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {typeDevices.map((device, index) => {
              const isActive = device.status === 'on' || device.status === 'active'
              const DeviceIcon = device.icon
              
              return (
                <div
                  key={device.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    background: isActive ? `${type.color}08` : 'white',
                    border: `1px solid ${isActive ? type.color : '#e5e7eb'}`,
                    borderRadius: '8px',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateX(4px)'
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateX(0)'
                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)'
                  }}
                >
                  <DeviceIcon style={{ fontSize: '18px', color: type.color, minWidth: '18px' }} />
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                      {device.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={12} />
                      {device.location}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', minWidth: '80px' }}>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      Công suất
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: type.color }}>
                      {device.power}W
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    minWidth: '100px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      background: isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                      color: isActive ? '#10b981' : '#6b7280'
                    }}>
                      {isActive ? <CheckCircle size={12} /> : <div style={{ width: '12px', height: '12px', border: '2px solid #9ca3af', borderRadius: '50%' }} />}
                      <span>{isActive ? 'Hoạt động' : 'Tắt'}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleDevice(device.id)}
                    style={{
                      minWidth: '60px',
                      background: isActive ? type.color : '#d1d5db',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '0.8'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '1'
                    }}
                  >
                    {isActive ? 'Tắt' : 'Bật'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  const totalPower = devices.reduce((sum, d) => sum + d.power, 0)
  const totalActive = devices.filter(d => d.status === 'on' || d.status === 'active').length

  return (
    <div style={{
      background: '#f8f9fa',
      color: '#1f2937',
      minHeight: '100vh',
      padding: '24px'
    }}>
      {/* HEADER */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px', color: '#111827', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Settings size={28} />
          Quản lý thiết bị
        </h1>
        <p style={{ color: '#6b7280' }}>
          Theo dõi và điều khiển trạng thái của tất cả thiết bị trong nông trại
        </p>
      </div>

      {/* QUICK STATS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <div style={{
          padding: '16px',
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
            Thiết bị bật
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
            {totalActive}/{devices.length}
          </div>
        </div>

        <div style={{
          padding: '16px',
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
            Tổng công suất
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#3b82f6' }}>
            {(totalPower / 1000).toFixed(1)} kW
          </div>
        </div>

        <div style={{
          padding: '16px',
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
            Trạng thái hệ thống
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={20} />
            Bình thường
          </div>
        </div>
      </div>

      {/* DEVICE SECTIONS */}
      <div style={{
        borderTop: '1px solid #e5e7eb',
        paddingTop: '24px'
      }}>
        {Object.keys(deviceTypes).map(typeKey => (
          <TypeSection key={typeKey} typeKey={typeKey} />
        ))}
      </div>

      {/* FOOTER */}
      <div style={{
        textAlign: 'center',
        color: '#6b7280',
        fontSize: '12px',
        marginTop: '48px',
        paddingTop: '20px',
        borderTop: '1px solid #e5e7eb'
      }}>
        Cập nhật realtime • {new Date().toLocaleString('vi-VN')}
      </div>
    </div>
  )
}

export default Devices
