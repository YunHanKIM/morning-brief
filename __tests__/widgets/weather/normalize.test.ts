import { normalizeWeather } from '../../../src/widgets/weather/normalize'

const makeRaw = (weatherCode: number) => ({
  current: { temperature_2m: 19.6, weather_code: weatherCode },
  daily: { temperature_2m_max: [25.5], temperature_2m_min: [14.1] },
})

describe('normalizeWeather', () => {
  it('현재 기온, 상태, 오늘 최고/최저를 반환한다', () => {
    expect(normalizeWeather(makeRaw(0))).toEqual({
      temperature: 19.6,
      condition: '맑음',
      high: 25.5,
      low: 14.1,
    })
  })

  it.each([
    [0, '맑음'],
    [3, '흐림'],
    [45, '안개'],
    [53, '이슬비'],
    [63, '비'],
    [73, '눈'],
    [81, '소나기'],
    [95, '뇌우'],
    [999, '알 수 없음'],
  ])('날씨 코드 %i는 "%s"로 변환한다', (code, label) => {
    expect(normalizeWeather(makeRaw(code)).condition).toBe(label)
  })
})
