import { useEffect, useState } from 'react'
import AutomationItem from '../components/AutomationItem'
import { Plus } from 'lucide-react'
import {
  getAutomations,
  updateAutomationStatus,
  deleteAutomation,
} from '../api/automationApi'

const Automation = () => {
  const [automations, setAutomations] = useState([])
  const [loading, setLoading] = useState(true)

  // LOAD DATA
  useEffect(() => {
    fetchAutomations()
  }, [])

  const fetchAutomations = async () => {
    try {
      const data = await getAutomations()
      setAutomations(data)
    } catch (error) {
      console.error('Lỗi load automation:', error)
    } finally {
      setLoading(false)
    }
  }

  // TOGGLE STATUS
  const toggle = async (id, currentStatus) => {
    try {
      const newStatus =
        currentStatus === 'active' ? 'paused' : 'active'

      await updateAutomationStatus(id, newStatus)

      setAutomations((prev) =>
        prev.map((a) =>
          a.id === id
            ? { ...a, status: newStatus }
            : a
        )
      )
    } catch (error) {
      console.error('Lỗi cập nhật automation:', error)
    }
  }

  // DELETE
  const remove = async (id) => {
    try {
      await deleteAutomation(id)

      setAutomations((prev) =>
        prev.filter((a) => a.id !== id)
      )
    } catch (error) {
      console.error('Lỗi xóa automation:', error)
    }
  }

  // GROUP THEO TYPE
  const grouped = automations.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = []
    acc[item.type].push(item)
    return acc
  }, {})

  if (loading) {
    return <div>Đang tải automation...</div>
  }

  return (
    <div className="card">
      {/* HEADER */}
      <div className="card-header">
        <div className="card-title">
          Automation
        </div>

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
        Quản lý kịch bản tự động trong hệ thống
        nông trại thông minh.
      </div>

      {/* EMPTY */}
      {automations.length === 0 && (
        <div
          style={{
            padding: '20px',
            textAlign: 'center',
            color: '#6b7280',
          }}
        >
          Không có automation nào
        </div>
      )}

      {/* GROUPED LIST */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {Object.keys(grouped).map((type) => (
          <div key={type}>
            {/* GROUP TITLE */}
            <div
              style={{
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              {type === 'threshold' &&
                '🔁 Theo ngưỡng'}

              {type === 'schedule' &&
                '⏰ Theo thời gian'}
            </div>

            {/* ITEMS */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              {grouped[type].map((item) => (
                <AutomationItem
                  key={item.id}
                  item={item}
                  onToggle={() =>
                    toggle(item.id, item.status)
                  }
                  onDelete={() => remove(item.id)}
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
