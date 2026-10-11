import { runWidget } from '../../../src/widgets/runWidget'
import { weatherWidget } from '../../../src/widgets/weather'

describe('weatherWidget', () => {
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

    const result = await runWidget(weatherWidget)

    expect(weatherWidget.name).toBe('weather')
    expect(result).toEqual({
      status: 'ok',
      data: { temperature: 19.6, condition: '대체로 맑음', high: 25.5, low: 14.1 },
    })
  })

  it('API가 실패하면 error로 반환한다', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'))

    expect(await runWidget(weatherWidget)).toEqual({
      status: 'error',
      message: 'network down',
    })
  })
})
