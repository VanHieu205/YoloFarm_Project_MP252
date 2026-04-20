import { useState } from 'react'
import AutomationItem from '../components/AutomationItem'
import { Plus } from 'lucide-react'

const Automation = () => {
  const [automations, setAutomations] = useState([
    // 🌱 TƯỚI NƯỚC
    {
      id: 1,
      name: 'Tưới nước tự động',
      type: 'threshold',
      condition: 'Độ ẩm < 40%',
      action: 'Bật máy bơm 1',
      status: 'active',
      lastRun: '5 phút trước',
      color: '#3b82f6',
    },
    {
      id: 2,
      name: 'Ngừng tưới khi đủ nước',
      type: 'threshold',
      condition: 'Độ ẩm > 70%',
      action: 'Tắt máy bơm 1',
      status: 'active',
      lastRun: '2 phút trước',
      color: '#3b82f6',
    },

    // 🌡️ NHIỆT ĐỘ
    {
      id: 3,
      name: 'Làm mát khi nóng',
      type: 'threshold',
      condition: 'Nhiệt độ > 30°C',
      action: 'Bật quạt 1',
      status: 'active',
      lastRun: '10 phút trước',
      color: '#10b981',
    },
    {
      id: 4,
      name: 'Tắt quạt khi mát',
      type: 'threshold',
      condition: 'Nhiệt độ < 25°C',
      action: 'Tắt quạt 1',
      status: 'paused',
      lastRun: '15 phút trước',
      color: '#10b981',
    },

    // 💡 ÁNH SÁNG
    {
      id: 5,
      name: 'Bật đèn khi thiếu sáng',
      type: 'threshold',
      condition: 'Ánh sáng < 300 Lux',
      action: 'Bật đèn 1',
      status: 'active',
      lastRun: '20 phút trước',
      color: '#f59e0b',
    },
    {
      id: 6,
      name: 'Tắt đèn khi đủ sáng',
      type: 'threshold',
      condition: 'Ánh sáng > 800 Lux',
      action: 'Tắt đèn 1',
      status: 'active',
      lastRun: '25 phút trước',
      color: '#f59e0b',
    },

    // ⏰ THEO THỜI GIAN
    {
      id: 7,
      name: 'Tưới nước buổi sáng',
      type: 'schedule',
      condition: '06:00 mỗi ngày',
      action: 'Bật máy bơm 1',
      status: 'active',
      lastRun: 'Hôm nay 06:00',
      color: '#6366f1',
    },
    {
      id: 8,
      name: 'Tưới nước buổi chiều',
      type: 'schedule',
      condition: '17:30 mỗi ngày',
      action: 'Bật máy bơm 2',
      status: 'active',
      lastRun: 'Hôm qua 17:30',
      color: '#6366f1',
    },
    {
      id: 9,
      name: 'Bật đèn buổi tối',
      type: 'schedule',
      condition: '18:00 mỗi ngày',
      action: 'Bật đèn 1',
      status: 'active',
      lastRun: 'Hôm qua 18:00',
      color: '#f59e0b',
    },
    {
      id: 10,
      name: 'Tắt đèn ban đêm',
      type: 'schedule',
      condition: '23:00 mỗi ngày',
      action: 'Tắt đèn 1',
      status: 'active',
      lastRun: 'Hôm qua 23:00',
      color: '#f59e0b',
    },

    // 🧪 KHÁC
    {
      id: 11,
      name: 'Khử trùng định kỳ',
      type: 'schedule',
      condition: '02:00 mỗi ngày',
      action: 'Bật máy sát trùng',
      status: 'paused',
      lastRun: '2 ngày trước',
      color: '#ef4444',
    },
    {
      id: 12,
      name: 'Cảnh báo nhiệt độ cao',
      type: 'threshold',
      condition: 'Nhiệt độ > 35°C',
      action: 'Gửi cảnh báo',
      status: 'active',
      lastRun: '1 phút trước',
      color: '#ef4444',
    },
  ])
  const toggle = (id) => {
    setAutomations((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, status: a.status === 'active' ? 'paused' : 'active' }
          : a
      )
    )
  }

  const remove = (id) => {
    setAutomations((prev) => prev.filter((a) => a.id !== id))
  }

  // GROUP THEO TYPE
  const grouped = automations.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = []
    acc[item.type].push(item)
    return acc
  }, {})

  return (
    <div className="card">
      {/* HEADER */}
      <div className="card-header">
        <div className="card-title">Automation</div>

        <button className="btn btn-primary btn-sm">
          <Plus size={16} />
          Add rule
        </button>
      </div>

      {/* DESCRIPTION */}
      <div
        style={{
          marginBottom: 'var(--spacing-md)',
          fontSize: '13px',
          color: 'var(--text-secondary)',
        }}
      >
        Quản lý kịch bản tự động trong hệ thống nông trại thông minh.
      </div>

      {/* GROUPED LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {Object.keys(grouped).map((type) => (
          <div key={type}>
            
            {/* GROUP TITLE */}
            <div style={{ fontWeight: 600, marginBottom: 8 }}>
              {type === 'threshold' && '🔁 Theo ngưỡng'}
              {type === 'schedule' && '⏰ Theo thời gian'}
            </div>

            {/* ITEMS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {grouped[type].map((item) => (
                <AutomationItem
                  key={item.id}
                  item={item}
                  onToggle={toggle}
                  onDelete={remove}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Automation
