import type { Widget } from '../types'
import type { City } from './city'
import { fetchWeather, type WeatherRaw } from './fetch'
import { normalizeWeather, type WeatherData } from './normalize'

export function createWeatherWidget(city: City): Widget<WeatherData, WeatherRaw> {
  return {
    name: 'weather',
    fetch: () => fetchWeather(city),
    normalize: normalizeWeather,
  }
}
