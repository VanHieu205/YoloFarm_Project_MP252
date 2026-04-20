import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Droplet, Thermometer, Sun } from 'lucide-react'

const SensorChart = () => {
  // Mock data - dữ liệu giả
  const sensorData = [
    { time: '00:00', temp: 22, humidity: 65, light: 300 },
    { time: '04:00', temp: 18, humidity: 72, light: 100 },
    { time: '08:00', temp: 24, humidity: 58, light: 600 },
    { time: '12:00', temp: 28, humidity: 45, light: 950 },
    { time: '16:00', temp: 26, humidity: 52, light: 750 },
    { time: '20:00', temp: 23, humidity: 68, light: 200 },
    { time: '23:59', temp: 20, humidity: 75, light: 50 },
  ]

  const currentStats = [
    {
      label: 'Nhiệt độ',
      value: '25°C',
      unit: 'độ C',
      icon: Thermometer,
      color: '#ef4444',
      bgColor: 'rgba(239, 68, 68, 0.1)',
    },
    {
      label: 'Độ ẩm',
      value: '58%',
      unit: 'Phần trăm',
      icon: Droplet,
      color: '#3b82f6',
      bgColor: 'rgba(59, 130, 246, 0.1)',
    },
    {
      label: 'Ánh sáng',
      value: '750',
      unit: 'Lux',
      icon: Sun,
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.1)',
    },
  ]

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <span></span>
          Dữ liệu Cảm biến Thời gian Thực
        </div>
      </div>

      {/* Current Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--spacing-md)',
          marginBottom: 'var(--spacing-lg)',
        }}
      >
        {currentStats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div
              key={index}
              style={{
                background: stat.bgColor,
                padding: 'var(--spacing-md)',
                borderRadius: 'var(--radius-lg)',
                border: `2px solid ${stat.color}`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 'var(--spacing-sm)',
                }}
              >
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {stat.label}
                </div>
                <Icon size={16} style={{ color: stat.color }} />
              </div>
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  color: stat.color,
                  marginBottom: '4px',
                }}
              >
                {stat.value}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {stat.unit}
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts */}
      <div style={{ marginTop: 'var(--spacing-lg)' }}>
        <h3 style={{ marginBottom: 'var(--spacing-md)', marginTop: 0 }}>
          📈 Biểu đồ 24 giờ
        </h3>

        {/* Temperature Chart */}
        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
            Nhiệt độ (°C)
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={sensorData}>
              <defs>
                <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
              <XAxis dataKey="time" stroke="var(--text-secondary)" />
              <YAxis stroke="var(--text-secondary)" />
              <Tooltip
                contentStyle={{
                  background: 'var(--white)',
                  border: '1px solid var(--gray-200)',
                  borderRadius: 'var(--radius-md)',
                }}
              />
              <Area
                type="monotone"
                dataKey="temp"
                stroke="#ef4444"
                fillOpacity={1}
                fill="url(#colorTemp)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Humidity & Light Chart */}
        <div>
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
            Độ ẩm & Ánh sáng
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={sensorData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
              <XAxis dataKey="time" stroke="var(--text-secondary)" />
              <YAxis yAxisId="left" stroke="var(--text-secondary)" />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="var(--text-secondary)"
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--white)',
                  border: '1px solid var(--gray-200)',
                  borderRadius: 'var(--radius-md)',
                }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="humidity"
                stroke="#3b82f6"
                name="Độ ẩm (%)"
                dot={{ r: 4 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="light"
                stroke="#f59e0b"
                name="Ánh sáng (Lux)"
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default SensorChart
