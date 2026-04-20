import { Power, Droplets, Wind, Lightbulb, Zap } from 'lucide-react'
import { useState } from 'react'

const DeviceStatus = () => {
  const [devices, setDevices] = useState([
    { id: 1, name: 'Máy bơm ', type: 'pump', status: 'ON', icon: Droplets, power: 2500, color: '#3b82f6' },
   
    { id: 2, name: 'Quạt ', type: 'fan', status: 'OFF', icon: Wind, power: 0, color: '#10b981' },

    { id: 3, name: 'Đèn ', type: 'light', status: 'OFF', icon: Lightbulb, power: 0, color: '#f59e0b' },
  
  ])

  const toggleDevice = (id) => {
    setDevices(
      devices.map((device) =>
        device.id === id
          ? {
              ...device,
              status: device.status === 'ON' ? 'OFF' : 'ON',
              power: device.status === 'ON' ? 0 : device.power || 1000,
            }
          : device
      )
    )
  }

  const totalPower = devices.reduce((sum, device) => sum + device.power, 0)

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <span>⚙️</span>
          Trạng thái Thiết bị
        </div>
        <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          Công suất: <strong>{(totalPower / 1000).toFixed(1)} kW</strong>
        </div>
      </div>

      <div className="card-content">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 'var(--spacing-md)',
          }}
        >
          {devices.map((device) => {
            const Icon = device.icon
            const isActive = device.status === 'ON'

            return (
              <div
                key={device.id}
                style={{
                  background: isActive ? `${device.color}15` : 'var(--bg-secondary)',
                  border: `2px solid ${isActive ? device.color : 'var(--gray-300)'}`,
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--spacing-md)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onClick={() => toggleDevice(device.id)}
                onKeyDown={(e) => e.key === 'Enter' && toggleDevice(device.id)}
                role="button"
                tabIndex={0}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start',
                    marginBottom: 'var(--spacing-md)',
                  }}
                >
                  <Icon
                    size={24}
                    style={{ color: isActive ? device.color : 'var(--text-secondary)' }}
                  />
                  <div
                    className={`badge badge-${isActive ? 'success' : 'error'}`}
                    style={{
                      background: isActive
                        ? 'rgba(16, 185, 129, 0.2)'
                        : 'rgba(239, 68, 68, 0.2)',
                      color: isActive ? '#059669' : '#dc2626',
                    }}
                  >
                    {isActive ? 'BẬT' : 'TẮT'}
                  </div>
                </div>

                <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                  <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                    {device.name}
                  </div>
                  {device.power > 0 && (
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {device.power}W
                    </div>
                  )}
                </div>

                <button
                  className={`btn btn-${isActive ? 'primary' : 'outline'} btn-sm`}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleDevice(device.id)
                  }}
                  style={{ width: '100%' }}
                >
                  <Power size={14} />
                  {isActive ? 'Tắt' : 'Bật'}
                </button>
              </div>
            )
          })}
        </div>

        {/* Device Summary */}
        <div
          style={{
            marginTop: 'var(--spacing-lg)',
            padding: 'var(--spacing-md)',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--gray-200)',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--spacing-md)' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Thiết bị bật
              </div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--primary-green)' }}>
                {devices.filter((d) => d.status === 'ON').length}/{devices.length}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Tổng công suất
              </div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--primary-blue)' }}>
                {(totalPower / 1000).toFixed(2)} kW
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Trạng thái
              </div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#10b981' }}>
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
