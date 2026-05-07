import {
  Power,
  Droplet,
  Wind,
  Lightbulb,
  Cpu,
} from 'lucide-react'

import { useEffect, useState } from 'react'
import axiosClient from '../api/axiosClient'

const DeviceStatus = () => {
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(false)

  const user = JSON.parse(localStorage.getItem('user'))
  const USER_ID = user?.user_id

  // =========================
  // ICON MAP
  // =========================
  const iconMap = {
    pump: Droplet,
    fan: Wind,
    light: Lightbulb,
    sensor: Cpu,
  }

  // =========================
  // COLOR MAP
  // =========================
  const colorMap = {
    pump: '#3b82f6',
    fan: '#10b981',
    light: '#f59e0b',
    sensor: '#8b5cf6',
  }

  // =========================
  // NAME MAP
  // =========================
  const nameMap = {
    pump: 'Máy bơm',
    fan: 'Quạt',
    light: 'Đèn',
    sensor: 'Cảm biến',
  }

  // =========================
  // LOAD DEVICES
  // =========================
  const loadDevices = async () => {
    try {
      setLoading(true)

      const res = await axiosClient.get(
        `/api/devices/group/status?user_id=${USER_ID}`
      )

      const mapped = res.data.map((d, index) => ({
        id: index + 1,
        type: d.type,
        name: nameMap[d.type] || d.type,
        status: d.is_on ? 'ON' : 'OFF', 
        total: d.total_devices,
        active: d.active_devices,  
        icon: iconMap[d.type] || Cpu,
        color: colorMap[d.type] || '#6b7280',
      }))

      setDevices(mapped)
    } catch (err) {
      console.error('Load devices error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (USER_ID) {
      loadDevices()
    }
  }, [])

  // =========================
  // TOGGLE DEVICE GROUP
  // =========================
  const toggleDevice = async (device) => {
    try {
      const action =
        device.status === 'ON'
          ? 'turn_off'
          : 'turn_on'

      // Optimistic UI update
      setDevices((prev) =>
        prev.map((d) =>
          d.type === device.type
            ? {
                ...d,
                status:
                  device.status === 'ON'
                    ? 'OFF'
                    : 'ON',
                active:
                  device.status === 'ON'
                    ? 0
                    : d.total,
              }
            : d
        )
      )

      await axiosClient.post(
        `/api/devices/control/type/${action}`,
        {
          user_id: USER_ID,
          device_type: device.type,
        }
      )

      // Sync lại với DB
      await loadDevices()

    } catch (err) {
      console.error('Toggle device error:', err)

      // rollback nếu lỗi
      loadDevices()
    }
  }

  if (loading && devices.length === 0) {
    return (
      <div className="card">
        <div className="card-content">
          Đang tải thiết bị...
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      {/* HEADER */}
      <div className="card-header">
        <div className="card-title">
          <span>⚙️</span>
          Trạng thái Thiết bị
        </div>

        <div
          style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
          }}
        >
          Đang hoạt động:
          <strong>
            {' '}
            {
              devices.filter(
                (d) => d.status === 'ON'
              ).length
            }
          </strong>
        </div>
      </div>

      {/* CONTENT */}
      <div className="card-content">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 'var(--spacing-md)',
          }}
        >
          {devices.map((device) => {
            const Icon = device.icon || Cpu
            const isActive =
              device.status === 'ON'

            return (
              <div
                key={device.id}
                style={{
                  background: isActive
                    ? `${device.color}15`
                    : 'var(--bg-secondary)',

                  border: `2px solid ${
                    isActive
                      ? device.color
                      : 'var(--gray-300)'
                  }`,

                  borderRadius:
                    'var(--radius-lg)',

                  padding:
                    'var(--spacing-md)',

                  transition: 'all 0.2s',
                }}
              >
                {/* TOP */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent:
                      'space-between',

                    alignItems: 'start',

                    marginBottom:
                      'var(--spacing-md)',
                  }}
                >
                  <Icon
                    size={24}
                    style={{
                      color: isActive
                        ? device.color
                        : 'var(--text-secondary)',
                    }}
                  />

                  <div
                    className={`badge badge-${
                      isActive
                        ? 'success'
                        : 'error'
                    }`}
                    style={{
                      background: isActive
                        ? 'rgba(16,185,129,0.2)'
                        : 'rgba(239,68,68,0.2)',

                      color: isActive
                        ? '#059669'
                        : '#dc2626',
                    }}
                  >
                    {isActive
                      ? 'BẬT'
                      : 'TẮT'}
                  </div>
                </div>

                {/* INFO */}
                <div
                  style={{
                    marginBottom:
                      'var(--spacing-md)',
                  }}
                >
                  <div
                    style={{
                      fontWeight: '600',
                      color:
                        'var(--text-primary)',
                    }}
                  >
                    {device.name}
                  </div>

                  <div
                    style={{
                      fontSize: '12px',
                      color:
                        'var(--text-secondary)',

                      marginTop: '4px',
                    }}
                  >
                    {device.active}/
                    {device.total}{' '}
                    thiết bị hoạt động
                  </div>
                </div>

                {/* BUTTON */}
                <button
                  className={`btn btn-${
                    isActive
                      ? 'primary'
                      : 'outline'
                  } btn-sm`}
                  onClick={() =>
                    toggleDevice(device)
                  }
                  style={{
                    width: '100%',
                  }}
                >
                  <Power size={14} />

                  {isActive
                    ? 'Tắt tất cả'
                    : 'Bật tất cả'}
                </button>
              </div>
            )
          })}
        </div>

        {/* SUMMARY */}
        <div
          style={{
            marginTop:
              'var(--spacing-lg)',

            padding:
              'var(--spacing-md)',

            background:
              'var(--bg-secondary)',

            borderRadius:
              'var(--radius-md)',

            border:
              '1px solid var(--gray-200)',
          }}
        >
          <div
            style={{
              display: 'grid',

              gridTemplateColumns:
                'repeat(auto-fit, minmax(150px, 1fr))',

              gap: 'var(--spacing-md)',
            }}
          >
            {/* TOTAL GROUP */}
            <div>
              <div
                style={{
                  fontSize: '12px',
                  color:
                    'var(--text-secondary)',

                  marginBottom: '4px',
                }}
              >
                Nhóm thiết bị
              </div>

              <div
                style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color:
                    'var(--primary-green)',
                }}
              >
                {devices.length}
              </div>
            </div>

            {/* ACTIVE */}
            <div>
              <div
                style={{
                  fontSize: '12px',
                  color:
                    'var(--text-secondary)',

                  marginBottom: '4px',
                }}
              >
                Đang bật
              </div>

              <div
                style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color:
                    'var(--primary-blue)',
                }}
              >
                {
                  devices.filter(
                    (d) =>
                      d.status === 'ON'
                  ).length
                }
              </div>
            </div>

            {/* STATUS */}
            <div>
              <div
                style={{
                  fontSize: '12px',
                  color:
                    'var(--text-secondary)',

                  marginBottom: '4px',
                }}
              >
                Hệ thống
              </div>

              <div
                style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#10b981',
                }}
              >
                ✓ Bình thường
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeviceStatus