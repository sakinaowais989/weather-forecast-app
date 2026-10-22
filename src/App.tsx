
import { useEffect, useState, type FormEvent } from 'react'
import './App.css'

type DayForecast = {
  date: string
  code: number
  high: number
  low: number
}

type Weather = {
  city: string
  country: string
  temperature: number
  feelsLike: number
  humidity: number
  wind: number
  code: number
  forecast: DayForecast[]
}

function getCondition(code: number) {
  if (code === 0) return { text: 'Clear sky', icon: '☀️' }
  if ([1, 2].includes(code)) return { text: 'Partly cloudy', icon: '🌤️' }
  if (code === 3) return { text: 'Cloudy', icon: '☁️' }
  if ([45, 48].includes(code)) return { text: 'Foggy', icon: '🌫️' }
  if ([51, 53, 55, 56, 57].includes(code)) return { text: 'Drizzle', icon: '🌦️' }
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { text: 'Rainy', icon: '🌧️' }
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { text: 'Snowy', icon: '❄️' }
  if ([95, 96, 99].includes(code)) return { text: 'Thunderstorm', icon: '⛈️' }
  return { text: 'Variable conditions', icon: '🌥️' }
}

function App() {
  const [city, setCity] = useState('')
  const [weather, setWeather] = useState<Weather | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function searchWeather(cityName: string) {
    setLoading(true)
    setError('')

    try {
      const geoUrl = new URL('https://geocoding-api.open-meteo.com/v1/search')
      geoUrl.search = new URLSearchParams({
        name: cityName,
        count: '1',
        language: 'en',
        format: 'json',
      }).toString()

      const geoResponse = await fetch(geoUrl.toString())
      if (!geoResponse.ok) throw new Error('Could not search for this city.')

      const geoData = await geoResponse.json()
      const place = geoData.results?.[0]

      if (!place) {
        throw new Error('City not found. Check the spelling and try again.')
      }

      const forecastUrl = new URL('https://api.open-meteo.com/v1/forecast')
      forecastUrl.search = new URLSearchParams({
        latitude: String(place.latitude),
        longitude: String(place.longitude),
        current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min',
        timezone: 'auto',
        forecast_days: '5',
      }).toString()

      const response = await fetch(forecastUrl.toString())
      if (!response.ok) throw new Error('Could not load weather data.')

      const data = await response.json()

      setWeather({
        city: place.name,
        country: place.country || '',
        temperature: Math.round(data.current.temperature_2m),
        feelsLike: Math.round(data.current.apparent_temperature),
        humidity: data.current.relative_humidity_2m,
        wind: Math.round(data.current.wind_speed_10m),
        code: data.current.weather_code,
        forecast: data.daily.time.map((date: string, i: number) => ({
          date,
          code: data.daily.weather_code[i],
          high: Math.round(data.daily.temperature_2m_max[i]),
          low: Math.round(data.daily.temperature_2m_min[i]),
        })),
      })
      setCity('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void searchWeather('Karachi')
  }, [])

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (city.trim()) void searchWeather(city.trim())
  }

  const condition = weather ? getCondition(weather.code) : null

  return (
    <main className="weather-app">
      <header className="topbar">
        <a className="brand" href="/">
          <span className="brand-icon">☀</span>SkyCast
        </a>
        <span className="topbar-label">LIVE WEATHER FORECAST</span>
      </header>

      <section className="hero">
        <p className="eyebrow">YOUR PERSONAL WEATHER GUIDE</p>
        <h1>Every day, <span>in view.</span></h1>
        <p className="subtitle">
          Discover the weather around the world and plan your day with confidence.
        </p>

        <form className="search-form" onSubmit={handleSearch}>
          <span className="search-icon">⌕</span>
          <input
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="Search city, e.g. London"
            aria-label="Search city"
          />
          <button type="submit" disabled={loading || !city.trim()}>
            {loading ? 'Loading...' : 'Search ↗'}
          </button>
        </form>

        {error && <p className="error-message" role="alert">{error}</p>}
      </section>

      {loading && !weather && <p className="status-message">Loading live weather...</p>}

      {weather && condition && (
        <>
          <section className="weather-card">
            <div className="weather-heading">
              <div>
                <p className="card-label">CURRENT WEATHER</p>
                <h2> {weather.city}{weather.country ? `, ${weather.country}` : ''}</h2>
                <p className="date-text">Latest available weather data</p>
              </div>
              <span className="live-badge">● LIVE DATA</span>
            </div>

            <div className="temperature-area">
              <div>
                <p className="temperature">{weather.temperature}<span>°C</span></p>
                <p className="condition">{condition.text}</p>
                <p className="feels-like">Feels like {weather.feelsLike}°C</p>
              </div>
              <div className="weather-illustration">{condition.icon}</div>
            </div>

            <div className="details-grid">
              <div className="detail">
                <span className="detail-icon">💧</span>
                <div><p>Humidity</p><strong>{weather.humidity}%</strong></div>
              </div>
              <div className="detail">
                <span className="detail-icon">💨</span>
                <div><p>Wind speed</p><strong>{weather.wind} km/h</strong></div>
              </div>
              <div className="detail">
                <span className="detail-icon">🌡️</span>
                <div><p>Feels like</p><strong>{weather.feelsLike}°C</strong></div>
              </div>
            </div>
          </section>

          <section className="forecast-section">
            <div className="section-heading">
              <div>
                <p className="card-label">PLAN AHEAD</p>
                <h2>5-day forecast</h2>
              </div>
              <span className="forecast-note">Daily highs & lows</span>
            </div>

            <div className="forecast-grid">
              {weather.forecast.map((day, index) => {
                const info = getCondition(day.code)
                const date = new Date(`${day.date}T12:00:00`)

                return (
                  <article className="forecast-day" key={day.date}>
                    <p>{index === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                    <span className="forecast-icon">{info.icon}</span>
                    <span className="forecast-condition">{info.text}</span>
                    <strong>{day.high}° <span>{day.low}°</span></strong>
                  </article>
                )
              })}
            </div>
          </section>
        </>
      )}

      <footer>
        <span className="brand"><span className="brand-icon">☀</span>SkyCast</span>
        <p>Weather data by Open-Meteo</p>
      </footer>
    </main>
  )
}

export default App
