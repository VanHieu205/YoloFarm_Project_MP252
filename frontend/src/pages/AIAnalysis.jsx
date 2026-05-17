import { useEffect, useState, useCallback } from "react"
import axios from "axios"
import {
  Brain, Leaf, AlertTriangle, TrendingUp, TrendingDown,
  Thermometer, Droplets, Wind, Sun, RefreshCw,
  Clock, Bot, Play, Sparkles, Activity,
} from "lucide-react"

const API = "http://localhost:8000"
const TARGET_YIELD_KG = 6200  // kg/ha (= 6.2 tấn/ha)

// ─── Tính health score từ sensor thật ────────────────────────────────────
function calcHealthScore(temp, humid, soilMoist) {
  let score = 100
  if (temp != null) {
    if (temp > 35 || temp < 15) score -= 25
    else if (temp > 32 || temp < 20) score -= 10
  }
  if (humid != null) {
    if (humid < 40 || humid > 95) score -= 20
    else if (humid < 55 || humid > 85) score -= 8
  }
  if (soilMoist != null) {
    if (soilMoist < 30 || soilMoist > 80) score -= 25
    else if (soilMoist < 45 || soilMoist > 70) score -= 10
  }
  return Math.max(0, score)
}

// ─── Tính risk từ health + yield ─────────────────────────────────────────
function calcRisk(healthScore, yieldKg) {
  const yieldRatio = yieldKg != null ? yieldKg / TARGET_YIELD_KG : 1
  if (healthScore < 50 || yieldRatio < 0.8) return "high"
  if (healthScore < 75 || yieldRatio < 0.92) return "medium"
  return "low"
}

// ─── Helpers ──────────────────────────────────────────────────────────────
const healthColor = s => s >= 80 ? "#4ade80" : s >= 50 ? "#fbbf24" : "#f87171"
const riskColor   = r => ({ low:"#4ade80", medium:"#fbbf24", high:"#f87171" })[r] ?? "#a78bfa"
const riskLabel   = r => ({ low:"Thấp", medium:"Trung bình", high:"Cao" })[r] ?? "—"
const toTan       = kg => kg != null ? (kg / 1000).toFixed(2) : null

// ─── Sinh gợi ý từ expert_advice + sensor thật ────────────────────────────
function buildRecs(sensor, expertAdvice = []) {
  const recs = []
  const T  = sensor?.temperature
  const H  = sensor?.humidity
  const SM = sensor?.soil_moisture

  if (SM != null && SM < 40)
    recs.push({
      color:"#f87171", bg:"rgba(239,68,68,.07)", border:"rgba(239,68,68,.2)", iconBg:"rgba(239,68,68,.18)",
      icon: Droplets, priority:"KHẨN CẤP",
      title: "Đất đang khô hạn — kích hoạt máy bơm",
      why: `Độ ẩm đất ${SM}% thấp hơn ngưỡng an toàn 40%. AI cảnh báo nguy cơ mất năng suất cao nếu không tưới ngay.`,
      impact: 900,
      actions: [
        { label:"Bật bơm ngay",   icon:Play,  prompt:"Bật máy bơm ngay bây giờ" },
        { label:"Tạo automation", icon:Bot,   prompt:"Cài automation tự động bật máy bơm khi độ ẩm đất xuống dưới 40%" },
      ],
    })
  else if (SM != null && SM < 50)
    recs.push({
      color:"#60a5fa", bg:"rgba(59,130,246,.07)", border:"rgba(59,130,246,.2)", iconBg:"rgba(59,130,246,.18)",
      icon: Droplets, priority:"ƯU TIÊN CAO",
      title: "Điều chỉnh lịch máy bơm tưới",
      why: `Độ ẩm đất ${SM}% — thấp hơn ngưỡng 50–60% tối ưu cho lúa. Tăng tần suất tưới buổi sáng sớm.`,
      impact: 500,
      actions: [
        { label:"Đổi lịch tưới",  icon:Clock, prompt:"Thay đổi lịch tưới máy bơm để tăng độ ẩm đất lên 50–60%" },
        { label:"Tạo automation", icon:Bot,   prompt:"Cài automation tự động bật máy bơm khi độ ẩm đất xuống dưới 50%" },
        { label:"Bật bơm ngay",   icon:Play,  prompt:"Bật máy bơm ngay bây giờ" },
      ],
    })

  if (SM != null && SM > 80)
    recs.push({
      color:"#f87171", bg:"rgba(239,68,68,.07)", border:"rgba(239,68,68,.2)", iconBg:"rgba(239,68,68,.18)",
      icon: Droplets, priority:"KHẨN CẤP",
      title: "Đất ngập úng — khơi thông thoát nước",
      why: `Độ ẩm đất ${SM}% vượt ngưỡng 80%, nguy cơ thối rễ cao. Cần tắt máy bơm và kiểm tra hệ thống thoát nước.`,
      impact: 800,
      actions: [
        { label:"Tắt máy bơm", icon:Play, prompt:"Tắt máy bơm ngay bây giờ" },
        { label:"Automation ngập", icon:Bot, prompt:"Tạo automation tắt máy bơm khi độ ẩm đất vượt quá 80%" },
      ],
    })

  if (T != null && T > 35)
    recs.push({
      color:"#f87171", bg:"rgba(239,68,68,.07)", border:"rgba(239,68,68,.2)", iconBg:"rgba(239,68,68,.18)",
      icon: Thermometer, priority:"KHẨN CẤP",
      title: "Nhiệt độ quá cao — stress nhiệt",
      why: `Nhiệt độ ${T}°C vượt ngưỡng 35°C gây stress nhiệt nghiêm trọng. Cần bật quạt và phun sương làm mát ngay.`,
      impact: 700,
      actions: [
        { label:"Bật quạt ngay",     icon:Play,  prompt:"Bật quạt thông gió ngay bây giờ" },
        { label:"Automation nhiệt",  icon:Bot,   prompt:"Tạo automation bật quạt và phun sương khi nhiệt độ vượt quá 35°C" },
      ],
    })
  else if (T != null && T > 28)
    recs.push({
      color:"#fbbf24", bg:"rgba(251,191,36,.07)", border:"rgba(251,191,36,.2)", iconBg:"rgba(251,191,36,.18)",
      icon: Wind, priority:"ƯU TIÊN TRUNG BÌNH",
      title: "Tối ưu lịch chạy quạt thông gió",
      why: `Nhiệt độ ${T}°C — có thể tăng 31–33°C buổi trưa. Bật quạt sớm hơn 1 giờ và tăng tốc độ 20%.`,
      impact: 300,
      actions: [
        { label:"Đổi lịch quạt",       icon:Clock, prompt:"Thay đổi lịch quạt thông gió: bật lúc 10h, tắt lúc 14h30, tốc độ 80%" },
        { label:"Automation nhiệt độ", icon:Bot,   prompt:"Tạo automation bật quạt khi nhiệt độ vượt quá 30 độ C" },
      ],
    })

  if (H != null && H < 40)
    recs.push({
      color:"#f87171", bg:"rgba(239,68,68,.07)", border:"rgba(239,68,68,.2)", iconBg:"rgba(239,68,68,.18)",
      icon: Droplets, priority:"ƯU TIÊN CAO",
      title: "Độ ẩm không khí quá thấp",
      why: `Độ ẩm ${H}% — quá thấp, cây bốc hơi nước mạnh, giảm quang hợp. Bật phun sương ngay.`,
      impact: 400,
      actions: [
        { label:"Bật phun sương",     icon:Play,  prompt:"Bật hệ thống phun sương ngay bây giờ" },
        { label:"Automation độ ẩm",   icon:Bot,   prompt:"Tạo automation bật phun sương khi độ ẩm không khí xuống dưới 40%" },
      ],
    })
  else if (H != null && H < 60)
    recs.push({
      color:"#2dd4bf", bg:"rgba(20,184,166,.07)", border:"rgba(20,184,166,.2)", iconBg:"rgba(20,184,166,.18)",
      icon: Droplets, priority:"BỔ SUNG",
      title: "Tăng độ ẩm không khí",
      why: `Độ ẩm không khí ${H}% thấp hơn mức lý tưởng 65–80%. Phun sương buổi sáng giúp giảm thoát hơi nước.`,
      impact: 200,
      actions: [
        { label:"Lên lịch phun sương", icon:Clock, prompt:"Lên lịch bật hệ thống phun sương buổi sáng 7h–9h để tăng độ ẩm không khí" },
        { label:"Automation độ ẩm KK", icon:Bot,   prompt:"Tạo automation bật phun sương khi độ ẩm không khí xuống dưới 60%" },
      ],
    })

  return recs.sort((a, b) => b.impact - a.impact)
}

// ─── Atoms ────────────────────────────────────────────────────────────────
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
        {value != null ? value : "—"}<span style={{ fontSize:11, opacity:.55, marginLeft:2 }}>{unit}</span>
      </div>
    </div>
  </div>
)

const AdviceCard = ({ text }) => {
  const isWarning  = text.startsWith("CẢNH BÁO")
  const isGood     = text.startsWith("TỐT")
  const isAnalysis = text.startsWith("PHÂN TÍCH")
  const color = isWarning ? "#f87171" : isGood ? "#4ade80" : isAnalysis ? "#fbbf24" : "#a78bfa"
  const bg    = isWarning ? "rgba(239,68,68,.08)" : isGood ? "rgba(34,197,94,.08)" : isAnalysis ? "rgba(251,191,36,.08)" : "rgba(139,92,246,.08)"
  return (
    <div style={{ borderRadius:9, padding:"10px 14px", background:bg,
      borderLeft:`3px solid ${color}`, marginBottom:8,
      fontSize:12, color:"rgba(255,255,255,.7)", lineHeight:1.6 }}>
      {text}
    </div>
  )
}

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
            <button key={i} onClick={() => onAction?.(a.prompt)}
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
        <span style={{ fontSize:12, fontWeight:500, color:"#4ade80", marginLeft:"auto" }}>
          +{(rec.impact/1000).toFixed(1)} tấn/ha
        </span>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────
const AIAnalysis = ({ navigate, userId = "USR-002", cropName = "rice" }) => {
  const [sensor,      setSensor]      = useState(null)   // từ sensor_data_used
  const [aiAnalysis,  setAiAnalysis]  = useState(null)   // từ ai_analysis
  const [loading,     setLoading]     = useState(true)
  const [refreshing,  setRefreshing]  = useState(false)
  const [error,       setError]       = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchData = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true)
    setError(null)
    try {
      const { data } = await axios.post(`${API}/api/ai_routes/predict`, {
        user_id:       userId,
        crop_name:     cropName,
        manual_season: null,
      })

      if (!data.success) throw new Error("API trả về success=false")

      // Lấy sensor từ sensor_data_used (backend đã query DB)
      setSensor(data.sensor_data_used ?? null)
      setAiAnalysis(data.ai_analysis ?? null)
      setLastUpdated(new Date())
    } catch (e) {
      const msg = e?.response?.data?.detail ?? e?.message ?? "Lỗi không xác định"
      setError(`Không thể kết nối tới máy chủ AI: ${msg}`)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [userId, cropName])

  useEffect(() => { fetchData() }, [fetchData])

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

  // ── Tính các chỉ số từ dữ liệu thật ──
  const T  = sensor?.temperature
  const H  = sensor?.humidity
  const SM = sensor?.soil_moisture

  const yieldKg  = aiAnalysis?.predicted_yield_raw ?? null          // kg/ha thật
  const yieldTan = yieldKg != null ? (yieldKg / 1000).toFixed(2) : null
  const targetTan = (TARGET_YIELD_KG / 1000).toFixed(1)

  const safeMin  = aiAnalysis?.safe_range?.min
  const safeMax  = aiAnalysis?.safe_range?.max

  const health   = T != null || H != null || SM != null
                    ? calcHealthScore(T, H, SM) : null
  const risk     = health != null && yieldKg != null
                    ? calcRisk(health, yieldKg) : null

  const diag     = aiAnalysis?.diagnostics ?? {}
  const advice   = aiAnalysis?.expert_advice ?? []

  const recs     = buildRecs(sensor, advice)
  const gap      = yieldKg != null ? Math.max(0, TARGET_YIELD_KG - yieldKg) : null
  const totalImpact = recs.reduce((s, r) => s + r.impact, 0)
  const projectedKg = yieldKg != null
    ? Math.min(TARGET_YIELD_KG, yieldKg + totalImpact) : null

  const dataQuality = diag.data_quality
  const isImputed   = dataQuality === "imputed_warning"

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
              {lastUpdated
                ? `Cập nhật lúc ${lastUpdated.toLocaleTimeString("vi-VN")}`
                : "Chưa có dữ liệu"}
            </p>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {diag.season_detected && (
            <span style={{ fontSize:11, padding:"3px 10px", borderRadius:99,
              background:"rgba(167,139,250,.12)", color:"#a78bfa",
              border:"1px solid rgba(167,139,250,.2)" }}>
              {diag.season_detected}
            </span>
          )}
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

      {/* Data quality warning */}
      {isImputed && (
        <div style={{ background:"rgba(251,191,36,.1)", border:"1px solid rgba(251,191,36,.25)",
          borderRadius:10, padding:"10px 14px", marginBottom:14, fontSize:12,
          color:"#fde68a", display:"flex", gap:8, alignItems:"center" }}>
          <AlertTriangle size={14} />
          Một số cảm biến không có dữ liệu — AI đã dùng giá trị mặc định. Kết quả có thể sai lệch.
        </div>
      )}

      {error && (
        <div style={{ background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.25)",
          borderRadius:10, padding:"10px 14px", marginBottom:14, fontSize:13,
          color:"#fca5a5", display:"flex", gap:8, alignItems:"center" }}>
          <AlertTriangle size={15} /> {error}
        </div>
      )}

      {/* Stat cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:10, marginBottom:12 }}>
        <StatCard
          label="SỨC KHỎE" value={health} suffix="%"
          Icon={Leaf} color={healthColor(health ?? 0)} barPct={health}
          sub="Tính từ cảm biến thật"
        />
        <StatCard
          label="RỦI RO" value={risk ? riskLabel(risk) : "—"}
          Icon={AlertTriangle} color={risk ? riskColor(risk) : "#a78bfa"}
          sub="Yield + môi trường"
        />
        <StatCard
          label="NĂNG SUẤT" value={yieldTan} suffix=" tấn/ha"
          Icon={TrendingUp} color="#60a5fa"
          barPct={yieldKg != null ? (yieldKg / TARGET_YIELD_KG) * 100 : null}
          sub={safeMin != null ? `±${diag.uncertainty_margin ?? ""} · ${(safeMin/1000).toFixed(1)}–${(safeMax/1000).toFixed(1)} tấn` : "Dự báo XGBoost"}
        />
        <StatCard
          label="TÁC ĐỘNG KHÍ HẬU" value={diag.weather_impact_ratio != null ? Math.round(diag.weather_impact_ratio * 100) : null} suffix="%"
          Icon={Activity} color="#a78bfa"
          barPct={diag.weather_impact_ratio != null ? diag.weather_impact_ratio * 100 : null}
          sub={diag.base_yield_source ?? "Nguồn dữ liệu"}
        />
      </div>

      <Divider />
      <SL>DỮ LIỆU CẢM BIẾN — LẤY TỪ DATABASE</SL>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:10, marginBottom:4 }}>
        <SensorCard label="NHIỆT ĐỘ"   value={T}  unit="°C" Icon={Thermometer} color="#f87171" />
        <SensorCard label="ĐỘ ẨM KK"   value={H}  unit="%"  Icon={Droplets}    color="#60a5fa" />
        <SensorCard label="ĐỘ ẨM ĐẤT"  value={SM} unit="%"  Icon={Droplets}    color="#4ade80" />
        <SensorCard
          label="CẬP NHẬT LÚC"
          value={sensor?.timestamp
            ? new Date(sensor.timestamp).toLocaleTimeString("vi-VN", { hour:"2-digit", minute:"2-digit" })
            : null}
          unit="" Icon={Clock} color="#fbbf24"
        />
      </div>

      {/* Expert advice từ AI engine */}
      {advice.length > 0 && (
        <>
          <Divider />
          <SL>NHẬN XÉT CHUYÊN GIA — AI ENGINE</SL>
          {advice.map((a, i) => <AdviceCard key={i} text={a} />)}
        </>
      )}

      {/* Recommendations + actions */}
      {recs.length > 0 && (
        <>
          <Divider />

          {/* Banner gap */}
          {gap != null && gap > 0 && (
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
                    Còn thiếu {(gap/1000).toFixed(1)} tấn/ha — {recs.length} hành động có thể cải thiện
                  </div>
                </div>
              </div>
              <div style={{ display:"flex", gap:20, flexShrink:0 }}>
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:22, fontWeight:500, color:"#f87171" }}>{yieldTan ?? "—"}</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,.35)", marginTop:2 }}>tấn/ha hiện tại</div>
                </div>
                <div style={{ width:1, background:"rgba(255,255,255,.08)" }} />
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:22, fontWeight:500, color:"#4ade80" }}>{targetTan}</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,.35)", marginTop:2 }}>tấn/ha mục tiêu</div>
                </div>
              </div>
            </div>
          )}

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
                Áp dụng tất cả → dự báo đạt {projectedKg != null ? (projectedKg/1000).toFixed(1) : "—"} tấn/ha
              </div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,.4)" }}>
                Tăng +{(totalImpact/1000).toFixed(1)} tấn/ha · thời gian thấy hiệu quả: 2–3 tuần
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

      {recs.length === 0 && aiAnalysis && (
        <>
          <Divider />
          <div style={{ borderRadius:12, padding:"14px 18px", border:"1px solid rgba(34,197,94,.2)",
            background:"rgba(34,197,94,.06)", display:"flex", alignItems:"center", gap:12 }}>
            <Sparkles size={20} color="#4ade80" />
            <div>
              <div style={{ fontSize:13, fontWeight:500, color:"#86efac" }}>Điều kiện tốt — không cần can thiệp</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,.4)", marginTop:2 }}>
                AI không phát hiện vấn đề môi trường. Giữ nguyên lịch tưới và thông gió hiện tại.
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
