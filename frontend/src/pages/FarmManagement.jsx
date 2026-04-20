import { useState } from 'react'
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { FaSeedling, FaList, FaBox, FaLeaf, FaDroplet, FaSprayCan, FaScissors, FaChartColumn, FaStar, FaClipboard, FaRuler, FaCalendarDays } from 'react-icons/fa6'
import '../styles/components.css'

const FarmManagement = () => {
  // Helper function to render activity with icon
  const getActivityIcon = (activityName) => {
    const icons = {
      'Tưới nước': <FaDroplet key="icon" style={{ marginRight: '6px' }} />,
      'Bón phân': <FaSeedling key="icon" style={{ marginRight: '6px' }} />,
      'Xịt thuốc': <FaSprayCan key="icon" style={{ marginRight: '6px' }} />,
      'Cắt cỏ': <FaScissors key="icon" style={{ marginRight: '6px' }} />,
    }
    return icons[activityName] || null
  }
  const [seasons, setSeasons] = useState([
    {
      id: 1,
      cropName: 'Lúa',
      plantDate: '2024-01-15',
      harvestDate: '2024-05-15',
      area: 2.5,
      notes: 'Sử dụng giống lúa chất lượng cao',
      status: 'Đang trồng',
      careLog: [
        { date: '2024-01-20', activity: 'Tưới nước', notes: 'Tưới đều' },
        { date: '2024-02-10', activity: 'Bón phân', notes: 'Bón phân NPK' },
      ],
      supplies: [
        { id: 1, name: 'Phân NPK', quantity: 50, unit: 'kg', date: '2024-01-20' },
        { id: 2, name: 'Thuốc trừ sâu', quantity: 10, unit: 'lít', date: '2024-02-10' },
      ],
      yield: null,
    },
    {
      id: 2,
      cropName: 'Ngô',
      plantDate: '2024-02-01',
      harvestDate: '2024-06-01',
      area: 1.8,
      notes: 'Giống ngô lai F1',
      status: 'Chuẩn bị',
      careLog: [],
      supplies: [],
      yield: null,
    },
  ])

  const [selectedSeason, setSelectedSeason] = useState(seasons[0])
  const [expandedSeasons, setExpandedSeasons] = useState([seasons[0].id])
  const [showAddForm, setShowAddForm] = useState(false)
  const [showCareForm, setShowCareForm] = useState(false)
  const [showSupplyForm, setShowSupplyForm] = useState(false)
  const [showYieldForm, setShowYieldForm] = useState(false)
  const [editingSeasonInfo, setEditingSeasonInfo] = useState(false)
  const [editSeasonData, setEditSeasonData] = useState(null)

  // Form state
  const [newSeason, setNewSeason] = useState({
    cropName: '',
    plantDate: '',
    harvestDate: '',
    area: '',
    notes: '',
  })

  const [newCareLog, setNewCareLog] = useState({
    date: new Date().toISOString().split('T')[0],
    activity: '',
    notes: '',
  })

  const [newSupply, setNewSupply] = useState({
    name: '',
    quantity: '',
    unit: 'kg',
    date: new Date().toISOString().split('T')[0],
  })

  const [yieldData, setYieldData] = useState({
    quantity: '',
    unit: 'kg',
    quality: 'Bình thường',
    notes: '',
  })

  // Handlers
  const toggleSeasonExpand = (id) => {
    if (expandedSeasons.includes(id)) {
      setExpandedSeasons(expandedSeasons.filter((s) => s !== id))
    } else {
      setExpandedSeasons([...expandedSeasons, id])
    }
  }

  const addSeason = () => {
    const season = {
      id: Math.max(...seasons.map((s) => s.id), 0) + 1,
      ...newSeason,
      careLog: [],
      supplies: [],
      yield: null,
      status: 'Chuẩn bị',
    }
    setSeasons([...seasons, season])
    setSelectedSeason(season)
    setExpandedSeasons([...expandedSeasons, season.id])
    setNewSeason({ cropName: '', plantDate: '', harvestDate: '', area: '', notes: '' })
    setShowAddForm(false)
  }

  const deleteSeason = (id) => {
    const newSeasons = seasons.filter((s) => s.id !== id)
    setSeasons(newSeasons)
    if (selectedSeason.id === id) {
      setSelectedSeason(newSeasons[0])
    }
  }

  const addCareLog = () => {
    const updated = seasons.map((s) =>
      s.id === selectedSeason.id
        ? {
            ...s,
            careLog: [
              ...s.careLog,
              {
                ...newCareLog,
                id: Math.random(),
              },
            ],
          }
        : s
    )
    setSeasons(updated)
    setSelectedSeason(updated.find((s) => s.id === selectedSeason.id))
    setNewCareLog({ date: new Date().toISOString().split('T')[0], activity: '', notes: '' })
    setShowCareForm(false)
  }

  const addSupply = () => {
    const updated = seasons.map((s) =>
      s.id === selectedSeason.id
        ? {
            ...s,
            supplies: [
              ...s.supplies,
              {
                id: Math.max(...s.supplies.map((sp) => sp.id || 0), 0) + 1,
                ...newSupply,
              },
            ],
          }
        : s
    )
    setSeasons(updated)
    setSelectedSeason(updated.find((s) => s.id === selectedSeason.id))
    setNewSupply({ name: '', quantity: '', unit: 'kg', date: new Date().toISOString().split('T')[0] })
    setShowSupplyForm(false)
  }

  const deleteSupply = (supplyId) => {
    const updated = seasons.map((s) =>
      s.id === selectedSeason.id
        ? {
            ...s,
            supplies: s.supplies.filter((sp) => sp.id !== supplyId),
          }
        : s
    )
    setSeasons(updated)
    setSelectedSeason(updated.find((s) => s.id === selectedSeason.id))
  }

  const addYield = () => {
    const updated = seasons.map((s) =>
      s.id === selectedSeason.id
        ? {
            ...s,
            yield: yieldData,
            status: 'Đã thu hoạch',
          }
        : s
    )
    setSeasons(updated)
    setSelectedSeason(updated.find((s) => s.id === selectedSeason.id))
    setYieldData({ quantity: '', unit: 'kg', quality: 'Bình thường', notes: '' })
    setShowYieldForm(false)
  }

  const startEditingSeason = () => {
    setEditSeasonData({ ...selectedSeason })
    setEditingSeasonInfo(true)
  }

  const saveEditSeason = () => {
    const updated = seasons.map((s) =>
      s.id === selectedSeason.id
        ? editSeasonData
        : s
    )
    setSeasons(updated)
    setSelectedSeason(editSeasonData)
    setEditingSeasonInfo(false)
    setEditSeasonData(null)
  }

  const cancelEditSeason = () => {
    setEditingSeasonInfo(false)
    setEditSeasonData(null)
  }

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: 'var(--spacing-xl)', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', padding: 'var(--spacing-xl)', borderRadius: 'var(--radius-lg)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <h1 style={{ margin: 0, marginBottom: '8px', color: 'white', fontSize: '28px' }}><FaSeedling style={{ marginRight: '8px', display: 'inline-block' }} /> Quản lý mùa vụ & vật tư</h1>
        <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0, fountSize: '15px' }}>
          Quản lý mùa vụ trồng, nhật ký chăm sóc, vật tư và sản lượng toàn diện
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 'var(--spacing-xl)', '@media (max-width: 1024px)': { gridTemplateColumns: '1fr' } }}>
        {/* Left: Season List */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ margin: 0, minWidth: '100px', fontSize: '18px', fontWeight: 700, color: '#1e3a8a' }}><FaList style={{ marginRight: '6px', display: 'inline-block' }} /> Mùa vụ</h3>
            <button
              onClick={() => setShowAddForm(true)}
               style={{
                background: '#facc15', // vàng đẹp
                color: '#1f2937', // chữ đậm (đen xám)
                border: '1px solid #eab308',
                padding: '8px 14px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: 600,
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = '#eab308'
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = '#facc15'
            }}
            >
              <Plus size={16} /> Thêm
            </button>
          </div>

          {/* Add Season Form */}
          {showAddForm && (
            <div style={{ background: 'var(--bg-secondary)', padding: 'var(--spacing-lg)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--spacing-lg)' }}>
              <input
                type="text"
                placeholder="Loại cây (VD: Lúa, Ngô...)"
                value={newSeason.cropName}
                onChange={(e) => setNewSeason({ ...newSeason, cropName: e.target.value })}
                style={{ width: '100%', marginBottom: '8px', padding: '8px', borderRadius: '4px', border: '1px solid var(--gray-200)' }}
              />
              <input
                type="date"
                value={newSeason.plantDate}
                onChange={(e) => setNewSeason({ ...newSeason, plantDate: e.target.value })}
                style={{ width: '100%', marginBottom: '8px', padding: '8px', borderRadius: '4px', border: '1px solid var(--gray-200)' }}
              />
              <input
                type="date"
                value={newSeason.harvestDate}
                onChange={(e) => setNewSeason({ ...newSeason, harvestDate: e.target.value })}
                style={{ width: '100%', marginBottom: '8px', padding: '8px', borderRadius: '4px', border: '1px solid var(--gray-200)' }}
              />
              <input
                type="number"
                placeholder="Diện tích (ha)"
                value={newSeason.area}
                onChange={(e) => setNewSeason({ ...newSeason, area: e.target.value })}
                style={{ width: '100%', marginBottom: '8px', padding: '8px', borderRadius: '4px', border: '1px solid var(--gray-200)' }}
              />
              <textarea
                placeholder="Ghi chú"
                value={newSeason.notes}
                onChange={(e) => setNewSeason({ ...newSeason, notes: e.target.value })}
                style={{ width: '100%', marginBottom: '8px', padding: '8px', borderRadius: '4px', border: '1px solid var(--gray-200)', minHeight: '60px' }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={addSeason}
                  style={{ flex: 1, padding: '8px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Lưu
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  style={{ flex: 1, padding: '8px', background: '#e5e7eb', color: '#1f2937', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Hủy
                </button>
              </div>
            </div>
          )}

          {/* Season List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {seasons.map((season) => (
              <div
                key={season.id}
                onClick={() => {
                  setSelectedSeason(season)
                  if (!expandedSeasons.includes(season.id)) {
                    setExpandedSeasons([...expandedSeasons, season.id])
                  }
                }}
                style={{
                    padding: 'var(--spacing-md)',
                    background: 'var(--bg-secondary)',
                    color: '#000',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    border:
                        selectedSeason.id === season.id
                        ? '2px solid #10b981'
                        : '2px solid #d1d5db',
                    transition: 'all 0.2s',
                    boxShadow: selectedSeason.id === season.id ? '0 4px 12px rgba(16,185,129,0.2)' : 'none',
                    }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div 
                    style={{ fontWeight: '600', marginBottom: '4px' }}>{season.cropName}  
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.8 }}>
                      {season.plantDate} → {season.harvestDate}
                    </div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>
                      <span style={{ display: 'inline-block', padding: '4px 10px', background: season.status === 'Đang trồng' ? '#10b981' : season.status === 'Chuẩn bị' ? '#3b82f6' : '#6366f1', color: 'white', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                        {season.status}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteSeason(season.id)
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '16px', opacity: 0.8, transition: 'all 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Season Details */}
        {selectedSeason && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            {/* Season Info */}
            <div className="card" style={{ background: '#ffffff', border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                <h3 style={{ margin: 0 }}><FaLeaf style={{ marginRight: '6px', display: 'inline-block', color: '#10b981' }} /> Thông tin mùa vụ</h3>
                {!editingSeasonInfo && (
                  <button
                    onClick={startEditingSeason}
                    style={{
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '13px',
                      fontWeight: 600,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
                  >
                    <Edit2 size={16} /> Chỉnh sửa
                  </button>
                )}
              </div>

              {editingSeasonInfo && editSeasonData ? (
                <div style={{ background: '#f9fafb', padding: 'var(--spacing-lg)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--spacing-lg)', border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Loại cây</label>
                      <input
                        type="text"
                        value={editSeasonData.cropName}
                        onChange={(e) => setEditSeasonData({ ...editSeasonData, cropName: e.target.value })}
                        style={{ width: '100%', marginTop: '6px', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '14px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Diện tích (ha)</label>
                      <input
                        type="number"
                        value={editSeasonData.area}
                        onChange={(e) => setEditSeasonData({ ...editSeasonData, area: parseFloat(e.target.value) })}
                        style={{ width: '100%', marginTop: '6px', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '14px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Ngày gieo</label>
                      <input
                        type="date"
                        value={editSeasonData.plantDate}
                        onChange={(e) => setEditSeasonData({ ...editSeasonData, plantDate: e.target.value })}
                        style={{ width: '100%', marginTop: '6px', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '14px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Ngày thu hoạch</label>
                      <input
                        type="date"
                        value={editSeasonData.harvestDate}
                        onChange={(e) => setEditSeasonData({ ...editSeasonData, harvestDate: e.target.value })}
                        style={{ width: '100%', marginTop: '6px', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '14px' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Ghi chú</label>
                    <textarea
                      value={editSeasonData.notes}
                      onChange={(e) => setEditSeasonData({ ...editSeasonData, notes: e.target.value })}
                      style={{ width: '100%', marginTop: '6px', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '14px', minHeight: '80px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: 'var(--spacing-lg)' }}>
                    <button
                      onClick={saveEditSeason}
                      style={{ flex: 1, padding: '10px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#059669'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#10b981'}
                    >
                      Lưu
                    </button>
                    <button
                      onClick={cancelEditSeason}
                      style={{ flex: 1, padding: '10px', background: '#e5e7eb', color: '#1f2937', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
                  <div style={{ padding: '12px', background: 'rgba(255,255,255,0.5)', borderRadius: 'var(--radius-md)' }}>
                    <label style={{ fontSize: '12px', color: '#0c4a6e', fontWeight: 600 }}><FaSeedling style={{ marginRight: '4px', display: 'inline-block' }} /> Loại cây</label>
                    <div style={{ fontSize: '18px', fontWeight: '700', marginTop: '6px', color: '#1f2937' }}>{selectedSeason.cropName}</div>
                  </div>
                  <div style={{ padding: '12px', background: 'rgba(255,255,255,0.5)', borderRadius: 'var(--radius-md)' }}>
                    <label style={{ fontSize: '12px', color: '#0c4a6e', fontWeight: 600 }}><FaRuler style={{ marginRight: '4px', display: 'inline-block' }} /> Diện tích</label>
                    <div style={{ fontSize: '18px', fontWeight: '700', marginTop: '6px', color: '#1f2937' }}>{selectedSeason.area} ha</div>
                  </div>
                  <div style={{ padding: '12px', background: 'rgba(255,255,255,0.5)', borderRadius: 'var(--radius-md)' }}>
                    <label style={{ fontSize: '12px', color: '#0c4a6e', fontWeight: 600 }}><FaCalendarDays style={{ marginRight: '4px', display: 'inline-block' }} /> Ngày gieo</label>
                    <div style={{ fontSize: '16px', fontWeight: '600', marginTop: '6px', color: '#1f2937' }}>{selectedSeason.plantDate}</div>
                  </div>
                  <div style={{ padding: '12px', background: 'rgba(255,255,255,0.5)', borderRadius: 'var(--radius-md)' }}>
                    <label style={{ fontSize: '12px', color: '#0c4a6e', fontWeight: 600 }}><FaCalendarDays style={{ marginRight: '4px', display: 'inline-block' }} /> Ngày thu hoạch</label>
                    <div style={{ fontSize: '16px', fontWeight: '600', marginTop: '6px', color: '#1f2937' }}>{selectedSeason.harvestDate}</div>
                  </div>
                </div>
              )}
              {!editingSeasonInfo && selectedSeason.notes && (
                <div style={{ marginTop: 'var(--spacing-lg)', paddingTop: 'var(--spacing-lg)', borderTop: '2px solid rgba(255,255,255,0.3)' }}>
                  <label style={{ fontSize: '12px', color: '#0c4a6e', fontWeight: 600 }}><FaClipboard style={{ marginRight: '4px', display: 'inline-block' }} /> Ghi chú</label>
                  <div style={{ fontSize: '14px', marginTop: '8px', color: '#1f2937', lineHeight: '1.5' }}>{selectedSeason.notes}</div>
                </div>
              )}
            </div>

            {/* Care Log */}
            <div className="card" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: '1px solid #86efac', boxShadow: '0 4px 12px rgba(34,197,94,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                <h3 style={{ margin: 0 }}><FaClipboard style={{ marginRight: '6px', display: 'inline-block', color: '#10b981' }} /> Nhật ký chăm sóc</h3>
                <button
                  onClick={() => setShowCareForm(!showCareForm)}
                  style={{
                    background: '#facc15',
                    color: '#1f2937',
                    border: '1px solid #eab308',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#eab308'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#facc15'}
                >
                  <Plus size={16} /> Thêm
                </button>
              </div>

              {showCareForm && (
                <div style={{ background: 'var(--bg-secondary)', padding: 'var(--spacing-lg)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--spacing-lg)' }}>
                  <input
                    type="date"
                    value={newCareLog.date}
                    onChange={(e) => setNewCareLog({ ...newCareLog, date: e.target.value })}
                    style={{ width: '100%', marginBottom: '8px', padding: '8px', borderRadius: '4px', border: '1px solid var(--gray-200)' }}
                  />
                  <select
                    value={newCareLog.activity}
                    onChange={(e) => setNewCareLog({ ...newCareLog, activity: e.target.value })}
                    style={{ width: '100%', marginBottom: '8px', padding: '8px', borderRadius: '4px', border: '1px solid var(--gray-200)' }}
                  >
                    <option value="">-- Chọn hoạt động --</option>
                    <option value="Tưới nước">Tưới nước</option>
                    <option value="Bón phân">Bón phân</option>
                    <option value="Xịt thuốc">Xịt thuốc sâu bệnh</option>
                    <option value="Cắt cỏ">Cắt cỏ dại</option>
                    <option value="Khác">Khác</option>
                  </select>
                  <textarea
                    placeholder="Ghi chú chi tiết"
                    value={newCareLog.notes}
                    onChange={(e) => setNewCareLog({ ...newCareLog, notes: e.target.value })}
                    style={{ width: '100%', marginBottom: '8px', padding: '8px', borderRadius: '4px', border: '1px solid var(--gray-200)', minHeight: '60px' }}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={addCareLog}
                      style={{ flex: 1, padding: '8px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Lưu
                    </button>
                    <button
                      onClick={() => setShowCareForm(false)}
                      style={{ flex: 1, padding: '8px', background: '#e5e7eb', color: '#1f2937', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              )}

              {selectedSeason.careLog.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedSeason.careLog.map((log) => (
                    <div key={log.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.6)', borderRadius: '4px', borderLeft: '4px solid #10b981', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: '600', color: '#166534', fontSize: '15px', display: 'flex', alignItems: 'center' }}>
                          {getActivityIcon(log.activity)}
                          {log.activity}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280', background: '#d1fae5', padding: '2px 8px', borderRadius: '3px', fontWeight: 500 }}>{log.date}</div>
                      </div>
                      <div style={{ fontSize: '13px', marginTop: '6px', color: '#1f2937', lineHeight: '1.4' }}>{log.notes}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '30px', textAlign: 'center', color: '#6b7280' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}><FaCalendarDays /></div>
                  Chưa có nhật ký, bắt đầu ghi lại công việc ngay!
                </div>
              )}
            </div>

            {/* Supplies */}
            <div className="card" style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', border: '1px solid #7dd3fc', boxShadow: '0 4px 12px rgba(2,132,199,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                <h3 style={{ margin: 0 }}><FaBox style={{ marginRight: '6px', display: 'inline-block', color: '#0369a1' }} /> Vật tư & phân bón</h3>
                <button
                  onClick={() => setShowSupplyForm(!showSupplyForm)}
                  style={{
                    background: '#facc15',
                    color: '#1f2937',
                    border: '1px solid #eab308',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#eab308'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#facc15'}
                >
                  <Plus size={16} /> Thêm
                </button>
              </div>

              {showSupplyForm && (
                <div style={{ background: 'var(--bg-secondary)', padding: 'var(--spacing-lg)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--spacing-lg)' }}>
                  <input
                    type="text"
                    placeholder="Tên vật tư (VD: Phân NPK, Thuốc trừ sâu...)"
                    value={newSupply.name}
                    onChange={(e) => setNewSupply({ ...newSupply, name: e.target.value })}
                    style={{ width: '100%', marginBottom: '8px', padding: '8px', borderRadius: '4px', border: '1px solid var(--gray-200)' }}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="number"
                      placeholder="Số lượng"
                      value={newSupply.quantity}
                      onChange={(e) => setNewSupply({ ...newSupply, quantity: e.target.value })}
                      style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--gray-200)' }}
                    />
                    <select
                      value={newSupply.unit}
                      onChange={(e) => setNewSupply({ ...newSupply, unit: e.target.value })}
                      style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--gray-200)' }}
                    >
                      <option>kg</option>
                      <option>lít</option>
                      <option>cái</option>
                      <option>bao</option>
                    </select>
                  </div>
                  <input
                    type="date"
                    value={newSupply.date}
                    onChange={(e) => setNewSupply({ ...newSupply, date: e.target.value })}
                    style={{ width: '100%', marginBottom: '8px', padding: '8px', borderRadius: '4px', border: '1px solid var(--gray-200)' }}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={addSupply}
                      style={{ flex: 1, padding: '8px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Lưu
                    </button>
                    <button
                      onClick={() => setShowSupplyForm(false)}
                      style={{ flex: 1, padding: '8px', background: '#e5e7eb', color: '#1f2937', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              )}

              {selectedSeason.supplies.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                  {selectedSeason.supplies.map((supply) => (
                    <div key={supply.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.6)', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid #069dd9', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                      <div>
                        <div style={{ fontWeight: '600', color: '#0369a1', fontSize: '15px' }}>{supply.name}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                          <span style={{ background: '#aaf0fe', padding: '2px 8px', borderRadius: '3px', marginRight: '8px', fontWeight: 500 }}>{supply.quantity} {supply.unit}</span>
                          <span style={{ color: '#6b7280' }}>📅 {supply.date}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteSupply(supply.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '18px', opacity: 0.7, transition: 'all 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '30px', textAlign: 'center', color: '#6b7280' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}><FaBox /></div>
                  Chưa thêm vật tư, thêm ngay để quản lý!
                </div>
              )}
            </div>

            {/* Yield */}
            <div className="card" style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', border: '1px solid #fcd34d', boxShadow: '0 4px 12px rgba(217,119,6,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                <h3 style={{ margin: 0 }}><FaChartColumn style={{ marginRight: '6px', display: 'inline-block', color: '#d97706' }} /> Sản lượng thu hoạch</h3>
                {!selectedSeason.yield && (
                  <button
                    onClick={() => setShowYieldForm(!showYieldForm)}
                    style={{
                      background: '#facc15',
                      color: '#1f2937',
                      border: '1px solid #eab308',
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '13px',
                      fontWeight: 600,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#eab308'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#facc15'}
                  >
                    <Plus size={16} /> Nhập liệu
                  </button>
                )}
              </div>

              {showYieldForm && !selectedSeason.yield && (
                <div style={{ background: 'var(--bg-secondary)', padding: 'var(--spacing-lg)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--spacing-lg)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="number"
                      placeholder="Số lượng"
                      value={yieldData.quantity}
                      onChange={(e) => setYieldData({ ...yieldData, quantity: e.target.value })}
                      style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--gray-200)' }}
                    />
                    <select
                      value={yieldData.unit}
                      onChange={(e) => setYieldData({ ...yieldData, unit: e.target.value })}
                      style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--gray-200)' }}
                    >
                      <option>kg</option>
                      <option>tấn</option>
                      <option>tạ</option>
                    </select>
                  </div>
                  <select
                    value={yieldData.quality}
                    onChange={(e) => setYieldData({ ...yieldData, quality: e.target.value })}
                    style={{ width: '100%', marginBottom: '8px', padding: '8px', borderRadius: '4px', border: '1px solid var(--gray-200)' }}
                  >
                    <option>Xuất sắc</option>
                    <option>Tốt</option>
                    <option>Bình thường</option>
                    <option>Thấp</option>
                  </select>
                  <textarea
                    placeholder="Ghi chú"
                    value={yieldData.notes}
                    onChange={(e) => setYieldData({ ...yieldData, notes: e.target.value })}
                    style={{ width: '100%', marginBottom: '8px', padding: '8px', borderRadius: '4px', border: '1px solid var(--gray-200)', minHeight: '60px' }}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={addYield}
                      style={{ flex: 1, padding: '8px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Lưu
                    </button>
                    <button
                      onClick={() => setShowYieldForm(false)}
                      style={{ flex: 1, padding: '8px', background: '#e5e7eb', color: '#1f2937', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              )}

              {selectedSeason.yield ? (
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.6)', borderRadius: '4px', borderLeft: '4px solid #d97706' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: '#92400e', fontWeight: 600 }}><FaChartColumn style={{ marginRight: '4px', display: 'inline-block' }} /> Sản lượng</label>
                      <div style={{ fontSize: '24px', fontWeight: '700', marginTop: '8px', color: '#b45309' }}>
                        {selectedSeason.yield.quantity} {selectedSeason.yield.unit}
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#92400e', fontWeight: 600 }}><FaStar style={{ marginRight: '4px', display: 'inline-block' }} /> Chất lượng</label>
                      <div style={{ fontSize: '18px', fontWeight: '700', marginTop: '8px', color: '#b45309' }}>{selectedSeason.yield.quality}</div>
                    </div>
                  </div>
                  {selectedSeason.yield.notes && (
                    <div style={{ paddingTop: 'var(--spacing-lg)', borderTop: '1px solid rgba(217,119,6,0.2)' }}>
                      <label style={{ fontSize: '12px', color: '#92400e', fontWeight: 600 }}><FaClipboard style={{ marginRight: '4px', display: 'inline-block' }} /> Ghi chú</label>
                      <div style={{ fontSize: '13px', marginTop: '6px', color: '#1f2937', lineHeight: '1.5' }}>{selectedSeason.yield.notes}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ padding: '30px', textAlign: 'center', color: '#6b7280' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}><FaChartColumn /></div>
                  Chưa có dữ liệu sản lượng, đợi đến lúc thu hoạch!
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FarmManagement
