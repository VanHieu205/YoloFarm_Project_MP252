import { useState, useEffect } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Waves,
  Activity,
  MapPin,
  Settings,
  CheckCircle,
  Loader2,
  AlertTriangle,
  Fan,
  Server
} from 'lucide-react'
import { FaLightbulb, FaDroplet, FaThermometer, FaWind, FaServer } from 'react-icons/fa6'
import axiosClient from "../api/axiosClient"

// =============================================
// CONFIG
// =============================================
const user = JSON.parse(localStorage.getItem("user"))
const USER_ID = user?.user_id

const TYPE_META = {
  light: {
    name: 'Đèn',
    GroupIcon: Lightbulb,     // icon nhóm
    DeviceIcon: FaLightbulb, // icon từng thiết bị
    color: '#f59e0b'
  },

  pump: {
    name: 'Máy bơm',
    GroupIcon: Waves,
    DeviceIcon: FaDroplet,
    color: '#3b82f6'
  },

  sensor: {
    name: 'Cảm biến',
    GroupIcon: Activity,
    DeviceIcon: FaThermometer,
    color: '#8b5cf6'
  },

  fan: {
    name: 'Quạt',
    GroupIcon: Fan,
    DeviceIcon: FaWind,
    color: '#10b981'
  },

  gateway: {
    name: 'Gateway',
    GroupIcon: Server,
    DeviceIcon: FaServer,
    color: '#f43f5e'
  },
}
const getTypeMeta = (type) =>
  TYPE_META[type] || {
    name: type,
    GroupIcon: Activity,
    DeviceIcon: Activity,
    color: '#6b7280'
  }

const isActive = (device) => device.is_on === true || device.is_on === 1

// =============================================
// COMPONENT
// =============================================
const Devices = () => {
  const [devices, setDevices]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)
  const [expandedTypes, setExpandedTypes] = useState([])
  const [togglingIds, setTogglingIds] = useState(new Set())

  // ------------------------------------------
  // FETCH
  // ------------------------------------------
  useEffect(() => {
    fetchDevices()
  }, [])

  const fetchDevices = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await axiosClient.get('api/devices/all', { params: { user_id: USER_ID } })
      const list = res.data.devices || []
      setDevices(list)
      // mở tất cả nhóm mặc định
      const types = [...new Set(list.map(d => d.type))]
      setExpandedTypes(types)
    } catch (e) {
      setError('Không thể tải danh sách thiết bị. Kiểm tra kết nối server.')
    } finally {
      setLoading(false)
    }
  }

  // ------------------------------------------
  // TOGGLE 1 THIẾT BỊ
  // ------------------------------------------
  const toggleDevice = async (deviceId) => {
    const device = devices.find(d => d.device_id === deviceId)
    if (!device || togglingIds.has(deviceId)) return

    const turnOn = !isActive(device)
    const endpoint = turnOn ? 'api/devices/control/turn_on' : 'api/devices/control/turn_off'

    setTogglingIds(prev => new Set(prev).add(deviceId))

    try {
      const res = await axiosClient.post(endpoint, {
        user_id: USER_ID,
        device_id: deviceId
      })
      setDevices(prev =>
        prev.map(d => d.device_id === deviceId ? { ...d, is_on: res.data.is_on } : d)
      )
    } catch (e) {
      // optimistic fallback
      setDevices(prev =>
        prev.map(d => d.device_id === deviceId ? { ...d, is_on: turnOn } : d)
      )
    } finally {
      setTogglingIds(prev => { const s = new Set(prev); s.delete(deviceId); return s })
    }
  }

  // ------------------------------------------
  // TOGGLE NHÓM
  // ------------------------------------------
  const toggleGroup = async (type, turnOn) => {
    const endpoint = turnOn ? 'api/devices/control/type/turn_on' : 'api/devices/control/type/turn_off'
    const affected = devices.filter(d => d.type === type).map(d => d.device_id)

    setTogglingIds(prev => { const s = new Set(prev); affected.forEach(id => s.add(id)); return s })

    try {
      await axiosClient.post(endpoint, { user_id: USER_ID, device_type: type })
      setDevices(prev =>
        prev.map(d => d.type === type ? { ...d, is_on: turnOn } : d)
      )
    } catch (e) {
      // optimistic fallback
      setDevices(prev =>
        prev.map(d => d.type === type ? { ...d, is_on: turnOn } : d)
      )
    } finally {
      setTogglingIds(prev => { const s = new Set(prev); affected.forEach(id => s.delete(id)); return s })
    }
  }

  // ------------------------------------------
  // ACCORDION
  // ------------------------------------------
  const toggleExpand = (type) => {
    setExpandedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  // ------------------------------------------
  // DERIVED
  // ------------------------------------------
  const types = [...new Set(devices.map(d => d.type))]
  const totalActive = devices.filter(isActive).length
  const totalOnline = devices.filter(d => d.connection_status === 'online').length

  // ------------------------------------------
  // SECTION COMPONENT
  // ------------------------------------------
  const TypeSection = ({ typeKey }) => {
    const typeDevices = devices.filter(d => d.type === typeKey)
    if (typeDevices.length === 0) return null

    const { name, GroupIcon, DeviceIcon, color } = getTypeMeta(typeKey)
    const activeCount = typeDevices.filter(isActive).length
    const percentage  = Math.round((activeCount / typeDevices.length) * 100)
    const isExpanded  = expandedTypes.includes(typeKey)

    return (
      <div style={{ marginBottom: '24px' }}>
        {/* HEADER */}
        <div
          onClick={() => toggleExpand(typeKey)}
          style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '16px',
            background: 'white',
            border: `1px solid ${color}40`,
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            userSelect: 'none',
            boxShadow: '0 1px 3px rgba(0,0,0,.08)'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#f9fafb'
            e.currentTarget.style.borderColor = `${color}70`
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'white'
            e.currentTarget.style.borderColor = `${color}40`
          }}
        >
          <GroupIcon style={{ fontSize: '22px', color, minWidth: '22px' }} />

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>{name}</div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '3px' }}>
              {activeCount}/{typeDevices.length} đang hoạt động
            </div>
          </div>

          {/* NÚT BẬT/TẮT TẤT CẢ */}
          <div
            style={{ display: 'flex', gap: '6px' }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => toggleGroup(typeKey, true)}
              style={{
                fontSize: '11px', padding: '4px 10px',
                borderRadius: '6px', border: `1px solid ${color}60`,
                background: 'transparent', color, cursor: 'pointer',
                fontWeight: '600', transition: 'all 0.15s'
              }}
            >
              Bật tất
            </button>
            <button
              onClick={() => toggleGroup(typeKey, false)}
              style={{
                fontSize: '11px', padding: '4px 10px',
                borderRadius: '6px', border: '1px solid #d1d5db',
                background: 'transparent', color: '#6b7280', cursor: 'pointer',
                fontWeight: '600', transition: 'all 0.15s'
              }}
            >
              Tắt tất
            </button>
          </div>

          <div style={{ textAlign: 'right', minWidth: '60px' }}>
            <div style={{ fontSize: '16px', fontWeight: '700', color }}>{percentage}%</div>
            <div style={{ fontSize: '10px', color: '#9ca3af' }}>Tỉ lệ bật</div>
          </div>

          {isExpanded
            ? <ChevronUp size={18} color="#9ca3af" />
            : <ChevronDown size={18} color="#9ca3af" />
          }
        </div>

        {/* PROGRESS BAR */}
        <div style={{ margin: '10px 0 14px', height: '6px', background: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            background: `linear-gradient(90deg, ${color}, ${color}99)`,
            width: `${percentage}%`,
            transition: 'width 0.4s ease'
          }} />
        </div>

        {/* DEVICE LIST */}
        {isExpanded && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {typeDevices.map(device => {
              const active    = isActive(device)
              const spinning  = togglingIds.has(device.device_id)
              const connColor = device.connection_status === 'online' ? '#10b981'
                              : device.connection_status === 'error'  ? '#ef4444' : '#9ca3af'

              return (
                <div
                  key={device.device_id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 16px',
                    background: active ? `${color}08` : 'white',
                    border: `1px solid ${active ? color : '#e5e7eb'}`,
                    borderRadius: '8px',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 2px rgba(0,0,0,.04)'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateX(3px)'
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,.08)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateX(0)'
                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,.04)'
                  }}
                >
                  <DeviceIcon style={{ fontSize: '17px', color, minWidth: '17px' }} />

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                      {device.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={11} />
                      {device.location || '—'}
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '3px',
                        background: '#f3f4f6', borderRadius: '4px', padding: '1px 6px'
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: connColor, display: 'inline-block' }} />
                        {device.connection_status || 'offline'}
                      </span>
                    </div>
                  </div>

                  {/* MODE BADGE */}
                  <span style={{
                    fontSize: '11px', padding: '2px 8px',
                    borderRadius: '5px', background: '#f3f4f6', color: '#6b7280',
                    fontWeight: '500'
                  }}>
                    {device.mode || 'manual'}
                  </span>

                  {/* STATUS BADGE */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    fontSize: '12px', fontWeight: '600',
                    padding: '4px 8px', borderRadius: '6px',
                    background: active ? 'rgba(16,185,129,.1)' : 'rgba(107,114,128,.1)',
                    color: active ? '#10b981' : '#6b7280',
                    minWidth: '90px', justifyContent: 'center'
                  }}>
                    {active
                      ? <CheckCircle size={12} />
                      : <div style={{ width: '12px', height: '12px', border: '2px solid #9ca3af', borderRadius: '50%' }} />
                    }
                    {active ? 'Hoạt động' : 'Tắt'}
                  </div>

                  {/* TOGGLE BUTTON */}
                  <button
                    onClick={() => toggleDevice(device.device_id)}
                    disabled={spinning}
                    style={{
                      minWidth: '62px', height: '32px',
                      background: active ? color : '#d1d5db',
                      color: 'white', border: 'none',
                      borderRadius: '6px', fontSize: '12px',
                      fontWeight: '600', cursor: spinning ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease', opacity: spinning ? 0.7 : 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                    }}
                  >
                    {spinning
                      ? <Loader2 size={13} style={{ animation: 'spin .7s linear infinite' }} />
                      : (active ? 'Tắt' : 'Bật')
                    }
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // ------------------------------------------
  // RENDER
  // ------------------------------------------
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '12px', color: '#6b7280' }}>
        <Loader2 size={24} style={{ animation: 'spin .7s linear infinite' }} />
        <span>Đang tải danh sách thiết bị...</span>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  return (
    <div style={{ background: '#f8f9fa', color: '#1f2937', minHeight: '100vh', padding: '24px' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* HEADER */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '6px', color: '#111827', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Settings size={26} />
          Quản lý thiết bị
        </h1>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>
          Theo dõi và điều khiển trạng thái của tất cả thiết bị trong nông trại
        </p>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: '#fef2f2', border: '1px solid #fecaca',
          borderRadius: '8px', padding: '12px 16px',
          color: '#dc2626', fontSize: '13px', marginBottom: '20px'
        }}>
          <AlertTriangle size={16} />
          {error}
          <button
            onClick={fetchDevices}
            style={{ marginLeft: 'auto', fontSize: '12px', color: '#dc2626', background: 'none', border: '1px solid #fca5a5', borderRadius: '5px', padding: '3px 10px', cursor: 'pointer' }}
          >
            Thử lại
          </button>
        </div>
      )}

      {/* QUICK STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '28px' }}>
        <div style={{ padding: '16px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,.07)' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>Thiết bị đang bật</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
            {totalActive}<span style={{ fontSize: '14px', color: '#9ca3af', fontWeight: '400' }}>/{devices.length}</span>
          </div>
        </div>

        <div style={{ padding: '16px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,.07)' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>Thiết bị online</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#3b82f6' }}>
            {totalOnline}<span style={{ fontSize: '14px', color: '#9ca3af', fontWeight: '400' }}>/{devices.length}</span>
          </div>
        </div>

        <div style={{ padding: '16px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,.07)' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>Trạng thái hệ thống</div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle size={18} />
            Bình thường
          </div>
        </div>
      </div>

      {/* DEVICE SECTIONS */}
      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '24px' }}>
        {devices.length === 0 && !error ? (
          <div style={{ textAlign: 'center', color: '#9ca3af', padding: '48px 0', fontSize: '14px' }}>
            Không có thiết bị nào
          </div>
        ) : (
          types.map(typeKey => <TypeSection key={typeKey} typeKey={typeKey} />)
        )}
      </div>

      {/* FOOTER */}
      <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: '12px', marginTop: '40px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
        Cập nhật lúc {new Date().toLocaleString('vi-VN')}
      </div>
    </div>
  )
}

export default Devices