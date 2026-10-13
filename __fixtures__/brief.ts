import type { Brief } from '../src/brief/generateBrief'
import { POPULAR_CITIES } from '../src/widgets/weather/city'

// 날씨만 정상, 나머지는 결과 없음(요약상 error)인 브리핑
export const makeBrief = (date = '2026-10-13'): Brief => ({
  date,
  city: POPULAR_CITIES[0],
  widgets: { weather: 'ok', exchange: 'error', news: 'error', quote: 'error' },
  results: {
    weather: {
      status: 'ok',
      data: { temperature: 18.4, condition: '맑음', high: 22, low: 11 },
    },
  },
})
