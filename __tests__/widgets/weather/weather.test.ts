import { runWidget } from '../../../src/widgets/runWidget'
import { createWeatherWidget } from '../../../src/widgets/weather'
import type { City } from '../../../src/widgets/weather/city'

const busan: City = {
  name: '부산광역시',
  region: '부산광역시',
  country: '대한민국',
  latitude: 35.10168,
  longitude: 129.03004,
  timezone: 'Asia/Seoul',
}

describe('createWeatherWidget', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('runWidget으로 실행하면 정규화된 날씨를 ok로 반환한다', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          current: { temperature_2m: 19.6, weather_code: 1 },
          daily: { temperature_2m_max: [25.5], temperature_2m_min: [14.1] },
        }),
        { status: 200 },
      ),
    )

    const widget = createWeatherWidget(busan)
    const result = await runWidget(widget)

    expect(widget.name).toBe('weather')
    expect(result).toEqual({
      status: 'ok',
      data: { temperature: 19.6, condition: '대체로 맑음', high: 25.5, low: 14.1 },
    })
  })

  it('선택한 도시의 좌표로 조회한다', async () => {
    const spy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          current: { temperature_2m: 1, weather_code: 0 },
          daily: { temperature_2m_max: [2], temperature_2m_min: [0] },
        }),
        { status: 200 },
      ),
    )

    await runWidget(createWeatherWidget(busan))

    const url = new URL(String(spy.mock.calls[0][0]))
    expect(url.searchParams.get('latitude')).toBe('35.10168')
    expect(url.searchParams.get('longitude')).toBe('129.03004')
  })

  it('API가 실패하면 error로 반환한다', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'))

    expect(await runWidget(createWeatherWidget(busan))).toEqual({
      status: 'error',
      message: 'network down',
    })
  })
})
