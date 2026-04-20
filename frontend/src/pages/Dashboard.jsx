import SensorChart from '../components/SensorChart'
import WeatherWidget from '../components/WeatherWidget'
import DeviceStatus from '../components/DeviceStatus'
import AlertsPanel from '../components/AlertsPanel'

const Dashboard = () => {
  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 style={{ margin: 0, marginBottom: '8px' }}> Tổng quan nông trại</h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
          Chào mừng! Đây là trang tổng quan thời gian thực của hệ thống quản lý nông trại thông minh
        </p>
      </div>

      {/* Quick Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 'var(--spacing-lg)',
          marginBottom: 'var(--spacing-xl)',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #10b981, #34d399)',
            color: 'white',
            padding: 'var(--spacing-lg)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '8px' }}>
            Khu vực đang hoạt động
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700' }}>5 / 8</div>
          <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
            62.5% dung lượng
          </div>
        </div>

        <div
          style={{
            background: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
            color: 'white',
            padding: 'var(--spacing-lg)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '8px' }}>
            Thiết bị hoạt động
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700' }}>12 / 16</div>
          <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
            Bình thường
          </div>
        </div>

        <div
          style={{
            background: 'linear-gradient(135deg, #10b981, #3b82f6)',
            color: 'white',
            padding: 'var(--spacing-lg)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '8px' }}>
            Năng suất dự kiến
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700' }}>↑ 12.5%</div>
          <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
            Tăng so với tuần trước
          </div>
        </div>

        <div
          style={{
            background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
            color: 'white',
            padding: 'var(--spacing-lg)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '8px' }}>
            Tiêu thụ điện
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700' }}>45.2 kWh</div>
          <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
            Hôm nay
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
          gap: 'var(--spacing-xl)',
          marginBottom: 'var(--spacing-xl)',
        }}
      >
        {/* Sensor Chart */}
        <div style={{ minHeight: '500px' }}>
          <SensorChart />
        </div>

        {/* Weather Widget */}
        <div>
          <WeatherWidget />
        </div>
      </div>

      {/* Device Status and Alerts */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: 'var(--spacing-xl)',
        }}
      >
        <div>
          <DeviceStatus />
        </div>

        <div>
          <AlertsPanel />
        </div>
      </div>

      {/* Footer Info */}
      <div
        style={{
          marginTop: 'var(--spacing-xl)',
          padding: 'var(--spacing-lg)',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--gray-200)',
          textAlign: 'center',
          color: 'var(--text-secondary)',
          fontSize: '12px',
        }}
      >
        <div>
          ℹ️ Các dữ liệu được cập nhật mỗi 5 phút | Lần cập nhật cuối:{' '}
          {new Date().toLocaleString('vi-VN')}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
