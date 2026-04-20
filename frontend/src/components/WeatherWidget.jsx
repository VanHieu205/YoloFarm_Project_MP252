import { Cloud, CloudRain, Wind, Eye } from 'lucide-react'

const WeatherWidget = () => {
  // Mock weather data - dữ liệu thời tiết giả
  const weatherData = {
    location: 'Hà Nội, Việt Nam',
    current: {
      temp: 28,
      condition: 'Hửng nắng',
      humidity: 65,
      windSpeed: 3.2,
      visibility: 10,
      feelsLike: 30,
      uvIndex: 6,
      pressure: 1013,
    },
    forecast: [
      { day: 'Hôm nay', high: 32, low: 24, condition: '☀️ Nắng' },
      { day: 'Ngày mai', high: 30, low: 23, condition: '⛅ Hửng nắng' },
      { day: 'Ngày kia', high: 28, low: 22, condition: '🌧️ Mưa' },
    ],
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <span>🌤️</span>
          Thông tin Thời tiết
        </div>
      </div>

      {/* Current Weather */}
      <div
        style={{
          background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
          padding: 'var(--spacing-lg)',
          borderRadius: 'var(--radius-lg)',
          color: 'white',
          marginBottom: 'var(--spacing-lg)',
        }}
      >
        <div style={{ marginBottom: 'var(--spacing-md)' }}>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>
            {weatherData.location}
          </div>
          <div style={{ fontSize: '12px', opacity: 0.8 }}>
            Cập nhật lúc {new Date().toLocaleTimeString('vi-VN')}
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--spacing-md)',
            marginBottom: 'var(--spacing-lg)',
          }}
        >
          <div>
            <div style={{ fontSize: '48px', fontWeight: '700' }}>
              {weatherData.current.temp}°C
            </div>
            <div style={{ fontSize: '16px', opacity: 0.9 }}>
              {weatherData.current.condition}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>
              Cảm thấy như {weatherData.current.feelsLike}°C
            </div>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              fontSize: '12px',
            }}
          >
            <div style={{ background: 'rgba(255,255,255,0.15)', padding: '8px', borderRadius: '8px' }}>
              <div style={{ opacity: 0.8, marginBottom: '4px' }}>Độ ẩm</div>
              <div style={{ fontSize: '16px', fontWeight: '600' }}>
                {weatherData.current.humidity}%
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.15)', padding: '8px', borderRadius: '8px' }}>
              <div style={{ opacity: 0.8, marginBottom: '4px' }}>Gió</div>
              <div style={{ fontSize: '16px', fontWeight: '600' }}>
                {weatherData.current.windSpeed} m/s
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.15)', padding: '8px', borderRadius: '8px' }}>
              <div style={{ opacity: 0.8, marginBottom: '4px' }}>Tầm nhìn</div>
              <div style={{ fontSize: '16px', fontWeight: '600' }}>
                {weatherData.current.visibility} km
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.15)', padding: '8px', borderRadius: '8px' }}>
              <div style={{ opacity: 0.8, marginBottom: '4px' }}>UV Index</div>
              <div style={{ fontSize: '16px', fontWeight: '600' }}>
                {weatherData.current.uvIndex}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3-Day Forecast */}
      <div>
        <h3 style={{ marginBottom: 'var(--spacing-md)', marginTop: 0 }}>
          📅 Dự báo 3 ngày
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'var(--spacing-md)',
          }}
        >
          {weatherData.forecast.map((forecast, index) => (
            <div
              key={index}
              style={{
                background: 'var(--bg-secondary)',
                padding: 'var(--spacing-md)',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center',
                border: '1px solid var(--gray-200)',
              }}
            >
              <div style={{ fontWeight: '600', marginBottom: '8px' }}>
                {forecast.day}
              </div>
              <div style={{ fontSize: '20px', marginBottom: '8px' }}>
                {forecast.condition}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '14px' }}>
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Cao</div>
                  <div style={{ fontWeight: '600', color: '#ef4444' }}>
                    {forecast.high}°
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Thấp</div>
                  <div style={{ fontWeight: '600', color: '#3b82f6' }}>
                    {forecast.low}°
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default WeatherWidget
