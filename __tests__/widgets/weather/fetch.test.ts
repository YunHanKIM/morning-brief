import { fetchWeather } from '../../../src/widgets/weather/fetch'

const validBody = {
  current: { temperature_2m: 19.6, weather_code: 1 },
  daily: { temperature_2m_max: [25.5], temperature_2m_min: [14.1] },
}

const okResponse = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200 })

describe('fetchWeather', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('서울 좌표로 Open-Meteo를 호출하고 검증된 응답을 반환한다', async () => {
    const spy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(okResponse(validBody))

    const raw = await fetchWeather()

    const url = new URL(String(spy.mock.calls[0][0]))
    expect(url.origin + url.pathname).toBe('https://api.open-meteo.com/v1/forecast')
    expect(url.searchParams.get('latitude')).toBe('37.5665')
    expect(url.searchParams.get('longitude')).toBe('126.978')
    expect(url.searchParams.get('timezone')).toBe('Asia/Seoul')
    expect(raw.current.temperature_2m).toBe(19.6)
    expect(raw.daily.temperature_2m_max[0]).toBe(25.5)
  })

  it('5초 타임아웃 신호(AbortSignal)를 함께 전달한다', async () => {
    const spy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(okResponse(validBody))
    const timeoutSpy = jest.spyOn(AbortSignal, 'timeout')

    await fetchWeather()

    expect(timeoutSpy).toHaveBeenCalledWith(5000)
    expect(spy.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal)
  })

  it('HTTP 오류 응답이면 예외를 던진다', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('fail', { status: 500 }))

    await expect(fetchWeather()).rejects.toThrow('500')
  })

  it.each([
    ['current 필드 누락', { current: {} }],
    ['기온이 문자열', { ...validBody, current: { temperature_2m: '19.6', weather_code: 1 } }],
    ['날씨 코드 누락', { ...validBody, current: { temperature_2m: 19.6 } }],
    ['최고 기온 배열이 비어 있음', { ...validBody, daily: { temperature_2m_max: [], temperature_2m_min: [14.1] } }],
    ['daily 필드 누락', { current: validBody.current }],
  ])('응답 모양이 다르면 예외를 던진다: %s', async (_name, body) => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(okResponse(body))

    await expect(fetchWeather()).rejects.toThrow()
  })
})
