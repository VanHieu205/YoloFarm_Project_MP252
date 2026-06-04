import { useState, useEffect, useCallback } from "react"
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Droplet, Thermometer, Sun } from "lucide-react"
import axiosClient from "../api/axiosClient"

// ── Helpers ───────────────────────────────────────────────────────────────────

const tooltipStyle = {
  background: "var(--white)",
  border: "1px solid var(--gray-200)",
  borderRadius: "var(--radius-md)",
}

const toDateInputValue = (d) => d.toISOString().slice(0, 10)

const formatTime = (ts, mode) => {
  if (!ts) return ""
  const d = new Date(ts)
  if (isNaN(d)) return ts
  if (mode === "hour")  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
  if (mode === "day")   return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })
}

const ChartBlock = ({ title, children, last = false }) => (
  <div style={{ marginBottom: last ? 0 : "var(--spacing-lg)" }}>
    <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}>{title}</div>
    <ResponsiveContainer width="100%" height={250}>
      {children}
    </ResponsiveContainer>
  </div>
)

// ── Main Component ────────────────────────────────────────────────────────────

const SensorChart = () => {
  const [mode, setMode]           = useState("hour")
  const [date, setDate]           = useState(toDateInputValue(new Date()))
  const [chartData, setChartData] = useState([])
  const [latestStats, setLatestStats] = useState({})
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  // ── Fetch biểu đồ ────────────────────────────────────────────────────────
  const fetchChart = useCallback(async (m, d, silent = false) => {
    if (!silent) setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ mode: m })
      if (m === "day" && d) params.append("date", d)
      const res = await axiosClient.get(`/api/sensors/history?${params}`)
      setChartData(res.data.map((r) => ({
        time:     formatTime(r.timestamp, m),
        rawTs:    r.timestamp,
        temp:     r.temperature,
        humidity: r.humidity,
        light:    r.light_intensity,
        soil:     r.soil_moisture,
        co2:      r.co2,
      })))
    } catch (err) {
      console.error(err)
      setError("Không thể tải dữ liệu biểu đồ.")
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  // ── Fetch latest (chỉ số card) ────────────────────────────────────────────
  const fetchLatest = useCallback(async () => {
    try {
      const res = await axiosClient.get("/api/sensors/latest")
      if (res.data && !res.data.message) setLatestStats(res.data)
    } catch (err) {
      console.error(err)
    }
  }, [])

  useEffect(() => {
    fetchChart(mode, date)

    if (mode !== "hour") return
    const interval = setInterval(() => fetchChart("hour", date, true), 5000)
    return () => clearInterval(interval)
  }, [mode, date, fetchChart])

  useEffect(() => {
    fetchLatest()
    const interval = setInterval(fetchLatest, 2000)
    return () => clearInterval(interval)
  }, [fetchLatest])

  // ── Stats ─────────────────────────────────────────────────────────────────
  const currentStats = [
    { label: "Nhiệt độ", value: latestStats.temperature    != null ? `${latestStats.temperature}°C`        : "—", unit: "độ C",      icon: Thermometer, color: "#ef4444", bgColor: "rgba(239,68,68,0.1)"  },
    { label: "Độ ẩm",    value: latestStats.humidity       != null ? `${latestStats.humidity}%`              : "—", unit: "Phần trăm", icon: Droplet,     color: "#3b82f6", bgColor: "rgba(59,130,246,0.1)" },
    { label: "Ánh sáng", value: latestStats.light_intensity != null ? String(latestStats.light_intensity)   : "—", unit: "Analog",    icon: Sun,         color: "#f59e0b", bgColor: "rgba(245,158,11,0.1)" },
  ]

  const tabs = [
    { key: "hour",  label: "60 Phút"   },
    { key: "day",   label: "Theo Ngày" },
    { key: "month", label: "30 Ngày"   },
  ]

  const chartTitle =
    mode === "hour"  ? "Biểu đồ 60 phút gần nhất" :
    mode === "day"   ? `Biểu đồ ngày ${new Date(date + "T00:00:00").toLocaleDateString("vi-VN")}` :
                       "Biểu đồ 30 ngày gần nhất"

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <span></span>
          Dữ liệu Cảm biến Thời gian Thực
        </div>
      </div>

      {/* Current Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--spacing-md)", marginBottom: "var(--spacing-lg)" }}>
        {currentStats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} style={{ background: stat.bgColor, padding: "var(--spacing-md)", borderRadius: "var(--radius-lg)", border: `2px solid ${stat.color}` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--spacing-sm)" }}>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{stat.label}</div>
                <Icon size={16} style={{ color: stat.color }} />
              </div>
              <div style={{ fontSize: "28px", fontWeight: "700", color: stat.color, marginBottom: "4px" }}>{stat.value}</div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{stat.unit}</div>
            </div>
          )
        })}
      </div>

      {/* Tab bar + date picker */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "var(--spacing-lg)", flexWrap: "wrap" }}>
        {tabs.map(({ key, label }) => {
          const active = mode === key
          return (
            <button
              key={key}
              onClick={() => setMode(key)}
              style={{
                padding: "6px 18px",
                borderRadius: "999px",
                border: active ? "2px solid #6366f1" : "2px solid var(--gray-200)",
                background: active ? "#6366f1" : "transparent",
                color: active ? "#fff" : "var(--text-secondary)",
                fontWeight: active ? "700" : "500",
                fontSize: "13px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {label}
            </button>
          )
        })}

        {mode === "day" && (
          <input
            type="date"
            value={date}
            max={toDateInputValue(new Date())}
            onChange={(e) => setDate(e.target.value)}
            style={{
              marginLeft: "auto",
              padding: "5px 10px",
              borderRadius: "8px",
              border: "2px solid var(--gray-200)",
              background: "transparent",
              color: "var(--text-primary)",
              fontSize: "13px",
              cursor: "pointer",
            }}
          />
        )}
      </div>

      {/* Charts */}
      <div>
        <h3 style={{ marginBottom: "var(--spacing-md)", marginTop: 0 }}>📈 {chartTitle}</h3>

        {loading && <div style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>Đang tải dữ liệu...</div>}
        {error   && <div style={{ padding: "40px", textAlign: "center", color: "#ef4444" }}>{error}</div>}

        {!loading && !error && (
          <>
            <ChartBlock title="Nhiệt độ (°C)">
              <AreaChart data={chartData}>
                <defs><linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
                <XAxis dataKey="time" stroke="var(--text-secondary)" tick={{ fontSize: 11 }} />
                <YAxis stroke="var(--text-secondary)" />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="temp" stroke="#ef4444" fillOpacity={1} fill="url(#colorTemp)" name="Nhiệt độ (°C)" />
              </AreaChart>
            </ChartBlock>

            <ChartBlock title="Độ ẩm không khí (%)">
              <AreaChart data={chartData}>
                <defs><linearGradient id="colorHumidity" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
                <XAxis dataKey="time" stroke="var(--text-secondary)" tick={{ fontSize: 11 }} />
                <YAxis stroke="var(--text-secondary)" />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="humidity" stroke="#3b82f6" fillOpacity={1} fill="url(#colorHumidity)" name="Độ ẩm (%)" />
              </AreaChart>
            </ChartBlock>

            <ChartBlock title="Ánh sáng (Analog)">
              <AreaChart data={chartData}>
                <defs><linearGradient id="colorLight" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/><stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
                <XAxis dataKey="time" stroke="var(--text-secondary)" tick={{ fontSize: 11 }} />
                <YAxis stroke="var(--text-secondary)" />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="light" stroke="#f59e0b" fillOpacity={1} fill="url(#colorLight)" name="Ánh sáng (Analog)" />
              </AreaChart>
            </ChartBlock>

            <ChartBlock title="Độ ẩm đất (%)">
              <AreaChart data={chartData}>
                <defs><linearGradient id="colorSoil" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/><stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
                <XAxis dataKey="time" stroke="var(--text-secondary)" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} stroke="var(--text-secondary)" />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="soil" stroke="#22c55e" fillOpacity={1} fill="url(#colorSoil)" name="Độ ẩm đất (%)" />
              </AreaChart>
            </ChartBlock>

            <ChartBlock title="CO₂ (ppm)" last>
              <AreaChart data={chartData}>
                <defs><linearGradient id="colorCo2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
                <XAxis dataKey="time" stroke="var(--text-secondary)" tick={{ fontSize: 11 }} />
                <YAxis stroke="var(--text-secondary)" />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="co2" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorCo2)" name="CO₂ (ppm)" />
              </AreaChart>
            </ChartBlock>
          </>
        )}
      </div>
    </div>
  )
}

export default SensorChart
