import { useState } from 'react'
import { FaChartLine, FaCalendarDays, FaFilter } from 'react-icons/fa6'
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'

const ReportManagement = () => {
  const [reportType, setReportType] = useState('sensor')
  const [timeRange, setTimeRange] = useState('month')

  // Fake data demo
  const data = [
    { name: 'T1', value: 30 },
    { name: 'T2', value: 45 },
    { name: 'T3', value: 50 },
    { name: 'T4', value: 40 },
    { name: 'T5', value: 60 },
  ]

  const getTitle = () => {
    switch (reportType) {
      case 'yield': return 'Báo cáo năng suất'
      case 'cost': return 'Báo cáo chi phí'
      default: return 'Dữ liệu cảm biến'
    }
  }

  return (
    <div>
      {/* HEADER */}
      <div style={{
        marginBottom: '20px',
        background: 'linear-gradient(135deg, #16a34a, #22c55e)',
        padding: '20px',
        borderRadius: '12px',
        color: 'white'
      }}>
        <h1 style={{ margin: 0 }}>
          <FaChartLine /> Báo cáo & Thống kê
        </h1>
        <p style={{ opacity: 0.9 }}>
          Theo dõi dữ liệu nông trại theo thời gian thực
        </p>
      </div>

      {/* FILTER */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        {/* TYPE */}
        <div>
          <label><FaFilter /> Loại báo cáo</label><br />
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            style={inputStyle}
          >
            <option value="yield">Năng suất</option>
            <option value="cost">Chi phí</option>
            <option value="sensor">Cảm biến</option>
          </select>
        </div>

        {/* TIME */}
        <div>
          <label><FaCalendarDays /> Thời gian</label><br />
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            style={inputStyle}
          >
            <option value="day">Ngày</option>
            <option value="month">Tháng</option>
            <option value="year">Năm</option>
          </select>
        </div>
      </div>

      {/* CHART */}
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 4px 10px rgba(0,0,0,0.08)'
      }}>
        <h3 style={{ marginBottom: '20px', color: '#166534' }}>
          {getTitle()}
        </h3>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

const inputStyle = {
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  marginTop: '4px'
}

export default ReportManagement