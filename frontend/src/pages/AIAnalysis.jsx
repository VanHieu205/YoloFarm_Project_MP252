import { useEffect, useState, useCallback } from "react"
import axios from "axios"
import {
  Brain, Leaf, AlertTriangle, TrendingUp, TrendingDown,
  Thermometer, Droplets, Wind, Sun, RefreshCw,
  Clock, Bot, Play, Sparkles,
} from "lucide-react"

const API = "http://localhost:8000"
const TARGET_YIELD = 6.2

// ─── Helpers ───────────────────────────────────────────────────────────────
const healthColor = s => s >= 80 ? "#4ade80" : s >= 50 ? "#fbbf24" : "#f87171"
const riskColor   = r => ({ low:"#4ade80", medium:"#fbbf24", high:"#f87171" })[r?.toLowerCase()] ?? "#a78bfa"
const riskLabel   = r => ({ low:"Thấp", medium:"Trung bình", high:"Cao" })[r?.toLowerCase()] ?? "—"

// ─── Sinh gợi ý từ sensor + AI ─────────────────────────────────────────────
function buildRecs(sensor, ai) {
  const recs = []
  const gap = TARGET_YIELD - (ai?.yield ?? 0)
  if (gap <= 0) return recs

  const T   = sensor?.Temperature
  const H   = sensor?.Humidity
  const SM  = sensor?.Soil_Moisture
  const LUX = sensor?.light_intensity

  if (SM != null && SM < 50)
    recs.push({
      color:"#60a5fa", bg:"rgba(59,130,246,.07)", border:"rgba(59,130,246,.2)", iconBg:"rgba(59,130,246,.18)",
      icon: Droplets, priority:"ƯU TIÊN CAO",
      title: "Điều chỉnh lịch máy bơm tưới",
      why: `Độ ẩm đất ${SM}% — thấp hơn ngưỡng 50–60% tối ưu cho lúa. Tăng tần suất tưới buổi sáng sớm để ổn định chỉ số này.`,
      impact: 0.8,
      actions: [
        { label:"Đổi lịch tưới",  icon:Clock, prompt:"Tôi muốn thay đổi lịch tưới máy bơm để tăng độ ẩm đất lên 50–60%, gợi ý lịch trình cụ thể" },
        { label:"Tạo automation", icon:Bot,   prompt:"Cài automation tự động bật máy bơm khi độ ẩm đất xuống dưới 50%" },
        { label:"Bật bơm ngay",   icon:Play,  prompt:"Bật máy bơm ngay bây giờ" },
      ],
    })

  if (T != null && T > 28)
    recs.push({
      color:"#fbbf24", bg:"rgba(251,191,36,.07)", border:"rgba(251,191,36,.2)", iconBg:"rgba(251,191,36,.18)",
      icon: Wind, priority:"ƯU TIÊN TRUNG BÌNH",
      title: "Tối ưu lịch chạy quạt thông gió",
      why: `Nhiệt độ ${T}°C — sẽ tăng lên 31–33°C buổi trưa gây stress nhiệt. Bật quạt sớm hơn 1 giờ (10h) và tăng tốc độ 20%.`,
      impact: 0.5,
      actions: [
        { label:"Đổi lịch quạt",        icon:Clock, prompt:"Thay đổi lịch quạt thông gió: bật lúc 10h, tắt lúc 14h30, tốc độ 80%" },
        { label:"Automation nhiệt độ",  icon:Bot,   prompt:"Tạo automation bật quạt khi nhiệt độ vượt quá 30 độ C" },
      ],
    })

  if (LUX != null && LUX < 800)
    recs.push({
      color:"#a78bfa", bg:"rgba(139,92,246,.07)", border:"rgba(139,92,246,.2)", iconBg:"rgba(139,92,246,.18)",
      icon: Sun, priority:"TỐI ƯU BỔ SUNG",
      title: "Bổ sung ánh sáng buổi sáng sớm",
      why: `Ánh sáng ${LUX} lux — dưới ngưỡng quang hợp tốt (800 lux). Bật đèn grow light 6h–8h giúp cây tích lũy tinh bột trước khi nắng gắt.`,
      impact: 0.2,
      actions: [
        { label:"Lên lịch đèn",         icon:Clock, prompt:"Lên lịch bật đèn grow light từ 6h đến 8h sáng mỗi ngày" },
        { label:"Automation ánh sáng",  icon:Bot,   prompt:"Automation bật đèn grow light khi ánh sáng dưới 500 lux lúc buổi sáng" },
      ],
    })

  if (H != null && H < 60)
    recs.push({
      color:"#2dd4bf", bg:"rgba(20,184,166,.07)", border:"rgba(20,184,166,.2)", iconBg:"rgba(20,184,166,.18)",
      icon: Droplets, priority:"BỔ SUNG",
      title: "Tăng độ ẩm không khí",
      why: `Độ ẩm không khí ${H}% — thấp hơn mức lý tưởng 65–80%. Phun sương buổi sáng giúp giảm thoát hơi nước và tăng hiệu suất quang hợp.`,
      impact: 0.2,
      actions: [
        { label:"Lên lịch phun sương",  icon:Clock, prompt:"Lên lịch bật hệ thống phun sương buổi sáng 7h–9h để tăng độ ẩm không khí" },
        { label:"Automation độ ẩm KK",  icon:Bot,   prompt:"Tạo automation bật phun sương khi độ ẩm không khí xuống dưới 60%" },
      ],
    })

  return recs
}

// ─── Atoms ─────────────────────────────────────────────────────────────────
const SL = ({ children }) => (
  <div style={{ fontSize:11, fontWeight:500, letterSpacing:".08em",
    color:"rgba(255,255,255,.35)", marginBottom:10 }}>{children}</div>
)

const Divider = () => (
  <div style={{ borderTop:"1px solid rgba(255,255,255,.06)", margin:"1rem 0" }} />
)

const StatCard = ({ label, value, suffix="", Icon, color, sub, barPct }) => (
  <div style={{ borderRadius:12, padding:"14px 16px", border:`1px solid ${color}33`, background:`${color}0d` }}>
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
      <span style={{ fontSize:11, fontWeight:500, letterSpacing:".06em", color, opacity:.7 }}>{label}</span>
      <Icon size={18} color={color} />
    </div>
    <div style={{ fontSize:26, fontWeight:500, color, lineHeight:1 }}>
      {value ?? "—"}{value != null ? suffix : ""}
    </div>
    {barPct != null && (
      <div style={{ height:5, borderRadius:99, background:`${color}22`, overflow:"hidden", marginTop:10 }}>
        <div style={{ width:`${Math.min(100,barPct)}%`, height:"100%", background:color, borderRadius:99 }} />
      </div>
    )}
    {sub && <div style={{ fontSize:11, color, opacity:.55, marginTop:6 }}>{sub}</div>}
  </div>
)

const SensorCard = ({ label, value, unit, Icon, color }) => (
  <div style={{ borderRadius:10, padding:"12px 14px", border:`1px solid ${color}2e`,
    background:`${color}0b`, display:"flex", alignItems:"center", gap:10 }}>
    <div style={{ width:34, height:34, borderRadius:8, background:`${color}26`,
      display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
      <Icon size={17} color={color} />
    </div>
    <div>
      <div style={{ fontSize:11, fontWeight:500, letterSpacing:".04em", color, opacity:.6, marginBottom:2 }}>{label}</div>
      <div style={{ fontSize:17, fontWeight:500, color }}>
        {value ?? "—"}<span style={{ fontSize:11, opacity:.55, marginLeft:2 }}>{unit}</span>
      </div>
    </div>
  </div>
)

const RecCard = ({ rec, idx, onAction }) => {
  const Icon = rec.icon
  return (
    <div style={{ borderRadius:12, padding:"16px 18px", border:`1px solid ${rec.border}`,
      background:rec.bg, marginBottom:10 }}>
      <div style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:12 }}>
        <div style={{ width:38, height:38, borderRadius:9, background:rec.iconBg,
          display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <Icon size={19} color={rec.color} />
        </div>
        <div>
          <div style={{ fontSize:11, fontWeight:500, letterSpacing:".06em",
            color:rec.color, opacity:.7, marginBottom:4 }}>
            {String(idx+1).padStart(2,"0")} · {rec.priority}
          </div>
          <div style={{ fontSize:14, fontWeight:500, color:rec.color }}>{rec.title}</div>
        </div>
      </div>

      <p style={{ fontSize:12, color:"rgba(255,255,255,.45)", lineHeight:1.6,
        margin:"0 0 12px 50px" }}>{rec.why}</p>

      <div style={{ display:"flex", flexWrap:"wrap", gap:8, paddingLeft:50 }}>
        {rec.actions.map((a, i) => {
          const AIcon = a.icon
          return (
            <button key={i} onClick={() => onAction && onAction(a.prompt)}
              style={{ display:"inline-flex", alignItems:"center", gap:6, fontSize:12, fontWeight:500,
                padding:"7px 12px", borderRadius:8, cursor:"pointer",
                border:`1px solid ${rec.color}${i===0?"4d":"2e"}`,
                background:`${rec.color}${i===0?"26":"0d"}`,
                color:rec.color }}>
              <AIcon size={13} /> {a.label}
            </button>
          )
        })}
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:12, marginLeft:50,
        padding:"10px 14px", borderRadius:8, background:`${rec.color}0a`,
        borderLeft:`3px solid ${rec.color}` }}>
        <TrendingUp size={14} color={rec.color} />
        <span style={{ fontSize:11, color:"rgba(255,255,255,.4)" }}>Dự kiến tác động</span>
        <span style={{ fontSize:12, fontWeight:500, color:"#4ade80", marginLeft:"auto" }}>+{rec.impact.toFixed(1)} tấn/ha</span>
      </div>
    </div>
  )
}

// ─── Main component ─────────────────────────────────────────────────────────
const AIAnalysis = ({ navigate }) => {
  const [sensor,      setSensor]      = useState(null)
  const [ai,          setAi]          = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [refreshing,  setRefreshing]  = useState(false)
  const [error,       setError]       = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchData = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true)
    setError(null)
    try {
      let sd = null
      try {
        const { data: d } = await axios.get(`${API}/api/sensors/latest`)
        sd = {
          Temperature:     d.Temperature     ?? d.temperature     ?? null,
          Humidity:        d.Humidity        ?? d.humidity        ?? null,
          Soil_Moisture:   d.Soil_Moisture   ?? d.soil_moisture   ?? null,
          light_intensity: d.light_intensity ?? d.Light_Intensity ?? null,
          co2:             d.co2             ?? d.CO2             ?? null,
        }
      } catch { /* sensor optional */ }
      setSensor(sd)

      const { data } = await axios.post(`${API}/api/ai/predict`, {
        Crop: "rice", Season: "summer",
        Temperature:   sd?.Temperature   ?? null,
        Humidity:      sd?.Humidity      ?? null,
        Soil_Moisture: sd?.Soil_Moisture ?? null,
      })
      setAi(data?.prediction ?? null)
      setLastUpdated(new Date())
    } catch {
      setError("Không thể kết nối tới máy chủ AI.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // navigate về trang automation với prompt tương ứng
  const handleAction = (prompt) => {
    if (navigate) navigate("/automation/create", { state: { prompt } })
  }

  if (loading) return (
    <div style={{ background:"#0a0f1e", minHeight:"100vh", display:"flex",
      flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16 }}>
      <Brain size={40} color="#a78bfa" />
      <p style={{ margin:0, fontSize:14, color:"rgba(255,255,255,.4)" }}>AI đang phân tích dữ liệu…</p>
    </div>
  )

  const health   = ai?.health_score != null ? Math.round(ai.health_score) : null
  const yieldVal = ai?.yield != null ? parseFloat(ai.yield.toFixed(2)) : null
  const conf     = ai?.confidence != null ? Math.round(ai.confidence * 100) : null
  const recs     = buildRecs(sensor, ai)
  const gap      = yieldVal != null ? Math.max(0, TARGET_YIELD - yieldVal) : null
  const totalImpact = recs.reduce((s, r) => s + r.impact, 0)
  const projectedYield = yieldVal != null ? Math.min(TARGET_YIELD, yieldVal + totalImpact).toFixed(1) : null

  return (
    <div style={{ background:"#0a0f1e", padding:"1rem", minHeight:"100vh",
      fontFamily:"system-ui,sans-serif", color:"#f1f5f9" }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1.25rem" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:"rgba(139,92,246,.25)",
            border:"1px solid rgba(139,92,246,.4)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Brain size={18} color="#a78bfa" />
          </div>
          <div>
            <p style={{ fontWeight:500, fontSize:15, margin:0 }}>Phân tích AI</p>
            <p style={{ fontSize:11, color:"rgba(255,255,255,.4)", margin:0 }}>
              {lastUpdated ? `Cập nhật lúc ${lastUpdated.toLocaleTimeString("vi-VN")}` : "Chưa có dữ liệu"}
            </p>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:11, padding:"3px 10px",
            borderRadius:99, fontWeight:500, background:"rgba(34,197,94,.12)", color:"#4ade80",
            border:"1px solid rgba(34,197,94,.2)" }}>
            <span style={{ width:6, height:6, borderRadius:99, background:"#4ade80" }} /> Live
          </span>
          <button onClick={() => fetchData(true)} disabled={refreshing}
            style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:12, padding:"6px 12px",
              borderRadius:8, background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.1)",
              color:"rgba(255,255,255,.6)", cursor:"pointer", opacity: refreshing ? .5 : 1 }}>
            <RefreshCw size={13} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
            Làm mới
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.25)",
          borderRadius:10, padding:"10px 14px", marginBottom:14, fontSize:13,
          color:"#fca5a5", display:"flex", gap:8, alignItems:"center" }}>
          <AlertTriangle size={15} /> {error}
        </div>
      )}

      {/* Stat cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:10, marginBottom:12 }}>
        <StatCard label="SỨC KHỎE"   value={health}   suffix="%" Icon={Leaf}         color={healthColor(health ?? 0)} barPct={health}                              sub="Chỉ số tổng thể" />
        <StatCard label="RỦI RO"     value={riskLabel(ai?.risk_level)}              Icon={AlertTriangle} color={riskColor(ai?.risk_level)}                         sub="Đánh giá hiện tại" />
        <StatCard label="NĂNG SUẤT"  value={yieldVal} suffix=" tấn/ha" Icon={TrendingUp} color="#60a5fa" barPct={yieldVal ? (yieldVal / TARGET_YIELD) * 100 : null} sub="Dự báo XGBoost" />
        <StatCard label="ĐỘ TIN CẬY" value={conf}     suffix="%"      Icon={Brain}       color="#a78bfa" barPct={conf}                                              sub="Độ chính xác" />
      </div>

      <Divider />
      <SL>DỮ LIỆU CẢM BIẾN</SL>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:10, marginBottom:4 }}>
        <SensorCard label="NHIỆT ĐỘ"    value={sensor?.Temperature}    unit="°C"  Icon={Thermometer} color="#f87171" />
        <SensorCard label="ĐỘ ẨM KK"   value={sensor?.Humidity}       unit="%"   Icon={Droplets}    color="#60a5fa" />
        <SensorCard label="ĐỘ ẨM ĐẤT"  value={sensor?.Soil_Moisture}  unit="%"   Icon={Droplets}    color="#4ade80" />
        <SensorCard label="ÁNH SÁNG"   value={sensor?.light_intensity} unit="lux" Icon={Sun}         color="#fbbf24" />
        <SensorCard label="CO₂"        value={sensor?.co2}            unit="ppm" Icon={Wind}         color="#a78bfa" />
      </div>

      {/* Recommendations */}
      {recs.length > 0 && (
        <>
          <Divider />

          {/* Banner */}
          <div style={{ borderRadius:14, padding:"18px 20px", border:"1px solid rgba(239,68,68,.25)",
            background:"rgba(239,68,68,.07)", display:"flex", alignItems:"center",
            justifyContent:"space-between", gap:16, flexWrap:"wrap", marginBottom:14 }}>
            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              <div style={{ width:44, height:44, borderRadius:11, background:"rgba(239,68,68,.18)",
                display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <TrendingDown size={22} color="#f87171" />
              </div>
              <div>
                <span style={{ fontSize:10, fontWeight:500, letterSpacing:".06em", padding:"2px 8px",
                  borderRadius:99, background:"rgba(239,68,68,.15)", color:"#f87171",
                  border:"1px solid rgba(239,68,68,.25)", marginBottom:6, display:"inline-block" }}>
                  AI PHÁT HIỆN
                </span>
                <div style={{ fontSize:15, fontWeight:500, color:"#fca5a5" }}>Năng suất thấp hơn kỳ vọng</div>
                <div style={{ fontSize:12, color:"rgba(255,255,255,.4)", marginTop:3 }}>
                  Còn thiếu {gap?.toFixed(1)} tấn/ha — {recs.length} hành động có thể cải thiện ngay
                </div>
              </div>
            </div>
            <div style={{ display:"flex", gap:20, flexShrink:0 }}>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:22, fontWeight:500, color:"#f87171" }}>{yieldVal ?? "—"}</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,.35)", marginTop:2 }}>tấn/ha hiện tại</div>
              </div>
              <div style={{ width:1, background:"rgba(255,255,255,.08)" }} />
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:22, fontWeight:500, color:"#4ade80" }}>{TARGET_YIELD}</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,.35)", marginTop:2 }}>tấn/ha mục tiêu</div>
              </div>
            </div>
          </div>

          <SL>HÀNH ĐỘNG ĐỀ XUẤT — ƯU TIÊN CAO NHẤT TRƯỚC</SL>

          {recs.map((rec, i) => (
            <RecCard key={i} rec={rec} idx={i} onAction={handleAction} />
          ))}

          {/* Apply all */}
          <div style={{ borderRadius:12, padding:"14px 18px", border:"1px solid rgba(34,197,94,.2)",
            background:"rgba(34,197,94,.06)", display:"flex", alignItems:"center",
            gap:14, flexWrap:"wrap" }}>
            <div style={{ width:38, height:38, borderRadius:9, background:"rgba(34,197,94,.15)",
              display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Sparkles size={19} color="#4ade80" />
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:500, color:"#86efac", marginBottom:2 }}>
                Áp dụng tất cả → dự báo đạt {projectedYield} tấn/ha
              </div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,.4)" }}>
                Tăng +{totalImpact.toFixed(1)} tấn/ha · thời gian thấy hiệu quả: 2–3 tuần
              </div>
            </div>
            <button
              onClick={() => handleAction("Áp dụng tất cả thay đổi: " + recs.map(r=>r.title).join(", "))}
              style={{ display:"inline-flex", alignItems:"center", gap:6, fontSize:12, fontWeight:500,
                padding:"8px 14px", borderRadius:8, cursor:"pointer", whiteSpace:"nowrap",
                background:"rgba(34,197,94,.2)", border:"1px solid rgba(34,197,94,.35)", color:"#4ade80" }}>
              Áp dụng tất cả →
            </button>
          </div>
        </>
      )}

      {recs.length === 0 && ai && (
        <>
          <Divider />
          <div style={{ borderRadius:12, padding:"14px 18px", border:"1px solid rgba(34,197,94,.2)",
            background:"rgba(34,197,94,.06)", display:"flex", alignItems:"center", gap:12 }}>
            <Sparkles size={20} color="#4ade80" />
            <div>
              <div style={{ fontSize:13, fontWeight:500, color:"#86efac" }}>Đã đạt mục tiêu năng suất</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,.4)", marginTop:2 }}>
                Giữ nguyên điều kiện hiện tại — AI không phát hiện vấn đề cần can thiệp.
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

export default AIAnalysis
