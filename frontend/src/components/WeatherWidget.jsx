import { useEffect, useState } from 'react'
import { Cloud, CloudRain, Wind, Eye } from 'lucide-react'
import axiosClient from '../api/axiosClient'

const WeatherWidget = () => {
  const [weatherData, setWeatherData] = useState(null)
  const [forecastData, setForecastData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadWeatherData()
  }, [])
  const [city, setCity] = useState('Ho Chi Minh')
  const loadWeatherData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch current weather
      const currentRes = await axiosClient.get(
        `/api/weather/current?city=${city}`
      )
      // Fetch forecast
      const forecastRes = await axiosClient.get(
        `/api/weather/forecast?city=${city}&days=3`
      )

      setWeatherData({
        location: `${currentRes.data.city}, ${currentRes.data.country}`,
        current: {
          temp: Math.round(currentRes.data.temperature),
          condition: currentRes.data.description,
          humidity: currentRes.data.humidity,
          windSpeed: currentRes.data.wind_speed,
          visibility: currentRes.data.visibility,
          feelsLike: Math.round(currentRes.data.feels_like),
          uvIndex: currentRes.data.uv_index,
          iconUrl: currentRes.data.icon_url,
        },
      })

      // Transform forecast data
      const forecast = forecastRes.data.forecast.map((day, index) => ({
        day: index === 0 ? 'Hôm nay' : index === 1 ? 'Ngày mai' : 'Ngày kia',
        high: day.temp_max,
        low: day.temp_min,
        condition: day.description,
        iconUrl: day.icon_url,
      }))

      setForecastData(forecast)
    } catch (err) {
      console.error('Weather API Error:', err)
      setError('Không tải được dữ liệu thời tiết')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <span>🌤️</span>
            Thông tin Thời tiết
          </div>
        </div>
        <div style={{ padding: 'var(--spacing-lg)', textAlign: 'center' }}>
          Đang tải dữ liệu thời tiết...
        </div>
      </div>
    )
  }

  if (error || !weatherData || !forecastData) {
    return (
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <span>🌤️</span>
            Thông tin Thời tiết
          </div>
        </div>
        <div style={{ padding: 'var(--spacing-lg)', textAlign: 'center', color: 'red' }}>
          {error || 'Không tải được dữ liệu thời tiết'}
        </div>
      </div>
    )
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
            {/* Weather Icon */}
            <img
              src={weatherData.current.iconUrl}
              alt={weatherData.current.condition}
              style={{
                width: '80px',
                height: '80px',
                marginBottom: '8px',
              }}
            />
            
            <div style={{ fontSize: '48px', fontWeight: '700' }}>
              {weatherData.current.temp}°C
            </div>
            <div style={{ fontSize: '16px', opacity: 0.9, textTransform: 'capitalize' }}>
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
          {forecastData.map((forecast, index) => (
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

              {/* Weather Icon */}
              <img
                src={forecast.iconUrl}
                alt={forecast.condition}
                style={{
                  width: '60px',
                  height: '60px',
                  margin: '0 auto 8px',
                }}
              />

              <div style={{ fontSize: '14px', marginBottom: '8px', textTransform: 'capitalize' }}>
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
