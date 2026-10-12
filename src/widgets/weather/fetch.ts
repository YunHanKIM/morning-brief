import { z } from 'zod'
import type { City } from './city'

const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast'
const TIMEOUT_MS = 5000

const weatherRawSchema = z.object({
  current: z.object({
    temperature_2m: z.number(),
    weather_code: z.number(),
  }),
  daily: z.object({
    temperature_2m_max: z.array(z.number()).min(1),
    temperature_2m_min: z.array(z.number()).min(1),
  }),
})

export type WeatherRaw = z.infer<typeof weatherRawSchema>

export async function fetchWeather(city: City): Promise<WeatherRaw> {
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    current: 'temperature_2m,weather_code',
    daily: 'temperature_2m_max,temperature_2m_min',
    timezone: city.timezone,
    forecast_days: '1',
  })
  const response = await fetch(`${WEATHER_URL}?${params}`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (!response.ok) {
    throw new Error(`Open-Meteo 응답 오류: ${response.status}`)
  }
  return weatherRawSchema.parse(await response.json())
}
