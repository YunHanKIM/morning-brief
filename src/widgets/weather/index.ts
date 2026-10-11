import type { Widget } from '../types'
import { fetchWeather, type WeatherRaw } from './fetch'
import { normalizeWeather, type WeatherData } from './normalize'

export const weatherWidget: Widget<WeatherData, WeatherRaw> = {
  name: 'weather',
  fetch: fetchWeather,
  normalize: normalizeWeather,
}
