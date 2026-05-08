import { useEffect, useState } from 'react'
import AutomationItem from '../components/AutomationItem'
import { Plus } from 'lucide-react'
import axiosClient from "../api/axiosClient"

const Automation = () => {

  const [automations, setAutomations] = useState([])

  // =====================================================
  // LOAD AUTOMATIONS
  // =====================================================
  const loadAutomations = async () => {

    try {

      const user_id = localStorage.getItem("user_id")

      const response = await axiosClient.get(
        `/automation/all?user_id=${user_id}`
      )

      const mapped = response.data.automations.map((item) => ({

        ...item,

        config_id: item.config_id,

        color:
          item.type === "threshold"
            ? "#3b82f6"
            : "#6366f1"

      }))

      setAutomations(mapped)

    } catch (error) {
      console.log(error)
    }
  }

  // =====================================================
  // FIRST LOAD
  // =====================================================
  useEffect(() => {
    loadAutomations()
  }, [])

  // =====================================================
  // GROUP BY TYPE
  // =====================================================
  const grouped = automations.reduce((acc, item) => {

    if (!acc[item.type]) {
      acc[item.type] = []
    }

    acc[item.type].push(item)

    return acc

  }, {})

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
        Quản lý kịch bản tự động trong hệ thống nông trại thông minh.
      </div>

      {/* GROUP LIST */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 20
        }}
      >

        {Object.keys(grouped).map((type) => (

          <div key={type}>

            {/* TITLE */}
            <div
              style={{
                fontWeight: 600,
                marginBottom: 8
              }}
            >
              {type === 'threshold' && '🔁 Theo ngưỡng'}
              {type === 'schedule' && '⏰ Theo thời gian'}
            </div>

            {/* ITEMS */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}
            >

              {grouped[type].map((item) => (

                <AutomationItem
                  key={item.id}
                  item={item}
                  refreshData={loadAutomations}
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