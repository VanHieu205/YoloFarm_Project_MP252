import { AlertCircle, AlertTriangle, Info, CheckCircle, Trash2 } from 'lucide-react'
import { useState } from 'react'

const AlertsPanel = () => {
  const [alerts, setAlerts] = useState([
    {
      id: 1,
      type: 'warning',
      title: 'Độ ẩm cao',
      message: 'Độ ẩm đã vượt ngưỡng 75% trong khu vực A',
      sensor: 'Cảm biến A1',
      time: '5 phút trước',
    },
    {
      id: 2,
      type: 'error',
      title: 'Nhiệt độ vượt ngưỡng',
      message: 'Nhiệt độ trong nhà kính B đạt 35°C',
      sensor: 'Cảm biến B2',
      time: '12 phút trước',
      thresholdValue: '35/30',
    },
    {
      id: 3,
      type: 'info',
      title: 'Bơm tưới tắt',
      message: 'Hệ thống tưới tự động đã tắt do điều kiện thời tiết',
      sensor: 'Thiết bị B1',
      time: '30 phút trước',
    },
    {
      id: 4,
      type: 'success',
      title: 'Hệ thống bình thường',
      message: 'Tất cả các chỉ số đã quay về mức bình thường',
      sensor: 'Hệ thống chung',
      time: '1 giờ trước',
    },
  ])

  const removeAlert = (id) => {
    setAlerts(alerts.filter((alert) => alert.id !== id))
  }

  const getAlertIcon = (type) => {
    switch (type) {
      case 'error':
        return <AlertCircle size={20} />
      case 'warning':
        return <AlertTriangle size={20} />
      case 'info':
        return <Info size={20} />
      case 'success':
        return <CheckCircle size={20} />
      default:
        return <Info size={20} />
    }
  }

  const getAlertColor = (type) => {
    switch (type) {
      case 'error':
        return '#ef4444'
      case 'warning':
        return '#f59e0b'
      case 'info':
        return '#3b82f6'
      case 'success':
        return '#10b981'
      default:
        return '#6b7280'
    }
  }

  const getAlertBgColor = (type) => {
    switch (type) {
      case 'error':
        return 'rgba(239, 68, 68, 0.1)'
      case 'warning':
        return 'rgba(245, 158, 11, 0.1)'
      case 'info':
        return 'rgba(59, 130, 246, 0.1)'
      case 'success':
        return 'rgba(16, 185, 129, 0.1)'
      default:
        return 'rgba(107, 114, 128, 0.1)'
    }
  }

  const alertStats = {
    error: alerts.filter((a) => a.type === 'error').length,
    warning: alerts.filter((a) => a.type === 'warning').length,
    info: alerts.filter((a) => a.type === 'info').length,
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <span>🚨</span>
          Cảnh báo & Thông báo
        </div>
        {(alertStats.error || alertStats.warning) > 0 && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              color: '#dc2626',
              padding: '4px 12px',
              borderRadius: 'var(--radius-md)',
              fontSize: '12px',
              fontWeight: '600',
            }}
          >
            {alertStats.error + alertStats.warning} cảnh báo
          </div>
        )}
      </div>

      {/* Alert Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: 'var(--spacing-md)',
          marginBottom: 'var(--spacing-lg)',
        }}
      >
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            padding: 'var(--spacing-md)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Lỗi</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#ef4444' }}>
            {alertStats.error}
          </div>
        </div>
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.1)',
            padding: 'var(--spacing-md)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Cảnh báo</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>
            {alertStats.warning}
          </div>
        </div>
        <div
          style={{
            background: 'rgba(59, 130, 246, 0.1)',
            padding: 'var(--spacing-md)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Thông báo</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#3b82f6' }}>
            {alertStats.info}
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        {alerts.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: 'var(--spacing-lg)',
              color: 'var(--text-secondary)',
            }}
          >
            <CheckCircle size={32} style={{ margin: '0 auto 8px' }} />
            <div>Không có cảnh báo nào. Hệ thống hoạt động bình thường!</div>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              style={{
                display: 'flex',
                gap: 'var(--spacing-md)',
                padding: 'var(--spacing-md)',
                background: getAlertBgColor(alert.type),
                border: `2px solid ${getAlertColor(alert.type)}`,
                borderRadius: 'var(--radius-lg)',
                alignItems: 'flex-start',
              }}
            >
              <div
                style={{
                  color: getAlertColor(alert.type),
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              >
                {getAlertIcon(alert.type)}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                  {alert.title}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {alert.message}
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: 'var(--spacing-md)',
                    marginTop: '8px',
                    fontSize: '12px',
                    color: 'var(--text-tertiary)',
                  }}
                >
                  <span>📍 {alert.sensor}</span>
                  <span>🕐 {alert.time}</span>
                  {alert.thresholdValue && <span>⚠️ {alert.thresholdValue}</span>}
                </div>
              </div>

              <button
                className="header-action-btn"
                onClick={() => removeAlert(alert.id)}
                title="Xóa cảnh báo"
              >
                <Trash2 size={16} color="var(--text-secondary)" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Action */}
      {alerts.length > 0 && (
        <div
          style={{
            marginTop: 'var(--spacing-lg)',
            paddingTop: 'var(--spacing-lg)',
            borderTop: '1px solid var(--gray-200)',
            display: 'flex',
            gap: 'var(--spacing-md)',
          }}
        >
          <button className="btn btn-primary btn-sm">
            Xem chi tiết
          </button>
          <button className="btn btn-outline btn-sm">
            Xuất báo cáo
          </button>
        </div>
      )}
    </div>
  )
}

export default AlertsPanel
