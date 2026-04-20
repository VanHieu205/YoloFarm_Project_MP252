import { Zap, Play, Pause, Clock, Trash2 } from 'lucide-react'

const AutomationItem = ({ item, onToggle, onDelete }) => {
  const isActive = item.status === 'active'

  return (
    <div
      style={{
        background: isActive ? `${item.color}12` : 'var(--bg-secondary)',
        border: `2px solid ${isActive ? item.color : 'var(--gray-200)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--spacing-md)',
      }}
    >
      {/* TOP */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Zap size={20} style={{ color: item.color }} />

        <div
          style={{
            fontSize: 11,
            color: isActive ? '#059669' : '#f59e0b',
            fontWeight: 600,
          }}
        >
          {isActive ? 'ĐANG HOẠT ĐỘNG' : 'TẠM DỪNG'}
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ marginTop: 8 }}>
        <div style={{ fontWeight: 600 }}>{item.name}</div>

        {/* TYPE */}
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
          {item.type === 'threshold' && '🔁 Theo ngưỡng'}
          {item.type === 'schedule' && '⏰ Theo thời gian'}
        </div>

        {/* CONDITION */}
        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          {item.type === 'threshold' ? (
            <>
              <b>Nếu:</b> {item.condition}
            </>
          ) : (
            <>
              <b>Thời gian:</b> {item.condition}
            </>
          )}
        </div>

        {/* ACTION */}
        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          <b>Thì:</b> {item.action}
        </div>
      </div>

      {/* TIME */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          fontSize: 11,
          marginTop: 6,
          color: 'var(--text-tertiary)',
        }}
      >
        <Clock size={12} />
        {item.lastRun}
      </div>

      {/* ACTION BUTTON */}
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button
          className={`btn btn-sm ${isActive ? 'btn-outline' : 'btn-primary'}`}
          onClick={() => onToggle(item.id)}
        >
          {isActive ? <Pause size={14} /> : <Play size={14} />}
          {isActive ? 'Tạm dừng' : 'Chạy'}
        </button>

        <button
          className="btn btn-outline btn-sm"
          onClick={() => onDelete(item.id)}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

export default AutomationItem
