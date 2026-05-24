import { useState, useEffect } from "react"
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from "recharts"
import { Droplet, Thermometer, Sun, Sprout, Wind } from "lucide-react"
import axiosClient from "../api/axiosClient"

const SensorChart = () => {
  const [sensorData, setSensorData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {

    // load history ban đầu
    const fetchInitial = async () => {
      try {
        const res = await axiosClient.get("/api/sensors/history?limit=48")

        const mapped = res.data.reverse().map((r) => ({
          time: new Date(r.timestamp).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
          temp: r.temperature,
          humidity: r.humidity,
          light: r.light_intensity,
          soil: r.soil_moisture,
          co2: r.co2,
        }))

        setSensorData(mapped)

      } catch (err) {
        console.error(err)
        setError("Không thể tải dữ liệu cảm biến.")
      } finally {
        setLoading(false)
      }
    }

    // realtime append
    const fetchLatest = async () => {
      try {
        const res = await axiosClient.get("/api/sensors/latest")

        const r = res.data

        const newPoint = {
          time: new Date(r.timestamp).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
          temp: r.temperature,
          humidity: r.humidity,
          light: r.light_intensity,
          soil: r.soil_moisture,
          co2: r.co2,
        }

        setSensorData((prev) => {
          // tránh duplicate timestamp
          if (prev.length > 0 &&
              prev[prev.length - 1].time === newPoint.time) {
            return prev
          }

          return [...prev, newPoint].slice(-48)
        })

      } catch (err) {
        console.error(err)
      }
    }

    fetchInitial()

    const interval = setInterval(fetchLatest, 500)

    return () => clearInterval(interval)

  }, [])

  const latest = sensorData.at(-1) ?? {}

  const currentStats = [
    {
      label: "Nhiệt độ",
      value: latest.temp != null ? `${latest.temp}°C` : "—",
      unit: "độ C",
      icon: Thermometer,
      color: "#ef4444",
      bgColor: "rgba(239, 68, 68, 0.1)",
    },
    {
      label: "Độ ẩm không khí",
      value: latest.humidity != null ? `${latest.humidity}%` : "—",
      unit: "Phần trăm",
      icon: Droplet,
      color: "#3b82f6",
      bgColor: "rgba(59, 130, 246, 0.1)",
    },
    {
      label: "Ánh sáng",
      value: latest.light != null ? String(latest.light) : "—",
      unit: "Analog",
      icon: Sun,
      color: "#f59e0b",
      bgColor: "rgba(245, 158, 11, 0.1)",
    },
    {
      label: "Độ ẩm đất",
      value: latest.soil != null ? `${latest.soil}%` : "—",
      unit: "Phần trăm",
      icon: Sprout,
      color: "#22c55e",
      bgColor: "rgba(34, 197, 94, 0.1)",
    },
    {
      label: "CO₂",
      value: latest.co2 != null ? String(latest.co2) : "—",
      unit: "ppm",
      icon: Wind,
      color: "#8b5cf6",
      bgColor: "rgba(139, 92, 246, 0.1)",
    },
  ]

  if (loading) return <div className="card">Đang tải dữ liệu...</div>
  if (error)   return <div className="card" style={{ color: "#ef4444" }}>{error}</div>

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
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "var(--spacing-md)",
          marginBottom: "var(--spacing-lg)",
        }}
      >
        {currentStats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div
              key={index}
              style={{
                background: stat.bgColor,
                padding: "var(--spacing-md)",
                borderRadius: "var(--radius-lg)",
                border: `2px solid ${stat.color}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--spacing-sm)" }}>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{stat.label}</div>
                <Icon size={16} style={{ color: stat.color }} />
              </div>
              <div style={{ fontSize: "28px", fontWeight: "700", color: stat.color, marginBottom: "4px" }}>
                {stat.value}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{stat.unit}</div>
            </div>
          )
        })}
      </div>

      {/* Charts */}
      <div style={{ marginTop: "var(--spacing-lg)" }}>
        <h3 style={{ marginBottom: "var(--spacing-md)", marginTop: 0 }}>Biểu đồ 24 giờ</h3>

        {/* Temperature */}
        <ChartBlock title="Nhiệt độ (°C)">
          <AreaChart data={sensorData}>
            <defs>
              <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
            <XAxis dataKey="time" stroke="var(--text-secondary)" />
            <YAxis stroke="var(--text-secondary)" />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="temp" stroke="#ef4444" fillOpacity={1} fill="url(#colorTemp)" name="Nhiệt độ (°C)" />
          </AreaChart>
        </ChartBlock>

        {/* Humidity */}
        <ChartBlock title="Độ ẩm không khí (%)">
          <AreaChart data={sensorData}>
            <defs>
              <linearGradient id="colorHumidity" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
            <XAxis dataKey="time" stroke="var(--text-secondary)" />
            <YAxis stroke="var(--text-secondary)" />
            <Tooltip contentStyle={tooltipStyle} />

            <Area
              type="monotone"
              dataKey="humidity"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorHumidity)"
              name="Độ ẩm (%)"
            />
          </AreaChart>
        </ChartBlock>

        {/* Light */}
        <ChartBlock title="Ánh sáng (Analog)">
          <AreaChart data={sensorData}>
            <defs>
              <linearGradient id="colorLight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
            <XAxis dataKey="time" stroke="var(--text-secondary)" />
            <YAxis stroke="var(--text-secondary)" />
            <Tooltip contentStyle={tooltipStyle} />

            <Area
              type="monotone"
              dataKey="light"
              stroke="#f59e0b"
              fillOpacity={1}
              fill="url(#colorLight)"
              name="Ánh sáng (Analog)"
            />
          </AreaChart>
        </ChartBlock>
        {/* Soil Moisture */}
        <ChartBlock title="Độ ẩm đất (%)">
          <AreaChart data={sensorData}>
            <defs>
              <linearGradient id="colorSoil" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
            <XAxis dataKey="time" stroke="var(--text-secondary)" />
            <YAxis domain={[0, 100]} stroke="var(--text-secondary)" />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="soil" stroke="#22c55e" fillOpacity={1} fill="url(#colorSoil)" name="Độ ẩm đất (%)" />
          </AreaChart>
        </ChartBlock>

        {/* CO2 */}
        <ChartBlock title="CO₂ (ppm)" last>
          <AreaChart data={sensorData}>
            <defs>
              <linearGradient id="colorCo2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
            <XAxis dataKey="time" stroke="var(--text-secondary)" />
            <YAxis stroke="var(--text-secondary)" />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="co2" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorCo2)" name="CO₂ (ppm)" />
          </AreaChart>
        </ChartBlock>
      </div>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const tooltipStyle = {
  background: "var(--white)",
  border: "1px solid var(--gray-200)",
  borderRadius: "var(--radius-md)",
}

const ChartBlock = ({ title, children, last = false }) => (
  <div style={{ marginBottom: last ? 0 : "var(--spacing-lg)" }}>
    <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}>{title}</div>
    <ResponsiveContainer width="100%" height={250}>
      {children}
    </ResponsiveContainer>
  </div>
)

export default SensorChart