import { loadWeatherAction, searchCitiesAction } from '../../src/components/cityActions'
import { POPULAR_CITIES } from '../../src/widgets/weather/city'

const busan = POPULAR_CITIES[1]

const weatherBody = {
  current: { temperature_2m: 19.6, weather_code: 1 },
  daily: { temperature_2m_max: [25.5], temperature_2m_min: [14.1] },
}

describe('searchCitiesAction', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('주요 도시 이름은 호출 없이 그 도시를 반환한다', async () => {
    const spy = jest.spyOn(globalThis, 'fetch')

    expect(await searchCitiesAction('서울')).toEqual({ status: 'ok', cities: [POPULAR_CITIES[0]] })
    expect(spy).not.toHaveBeenCalled()
  })

  it('그 밖의 이름은 지오코딩 결과를 반환한다', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          results: [{ name: 'Tokyo', latitude: 35.7, longitude: 139.7, timezone: 'Asia/Tokyo', admin1: '도쿄 도', country: '일본' }],
        }),
        { status: 200 },
      ),
    )

    expect(await searchCitiesAction('Tokyo')).toEqual({
      status: 'ok',
      cities: [{ name: 'Tokyo', region: '도쿄 도', country: '일본', latitude: 35.7, longitude: 139.7, timezone: 'Asia/Tokyo' }],
    })
  })

  it.each([
    ['숫자', 123],
    ['null', null],
    ['객체', { q: 'x' }],
    ['undefined', undefined],
  ])('문자열이 아닌 입력은 호출 없이 빈 결과를 반환한다: %s', async (_name, query) => {
    const spy = jest.spyOn(globalThis, 'fetch')

    expect(await searchCitiesAction(query)).toEqual({ status: 'ok', cities: [] })
    expect(spy).not.toHaveBeenCalled()
  })

  it('검색이 실패하면 던지지 않고 error를 반환한다', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('fail', { status: 500 }))

    const result = await searchCitiesAction('Tokyo')

    expect(result.status).toBe('error')
  })
})

describe('loadWeatherAction', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('받은 도시의 날씨를 반환한다', async () => {
    const spy = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify(weatherBody), { status: 200 }))

    const result = await loadWeatherAction(busan)

    const url = new URL(String(spy.mock.calls[0][0]))
    expect(url.searchParams.get('latitude')).toBe(String(busan.latitude))
    expect(result).toEqual({
      status: 'ok',
      data: { temperature: 19.6, condition: '대체로 맑음', high: 25.5, low: 14.1 },
    })
  })

  it.each([
    ['null', null],
    ['문자열', 'Busan'],
    ['위도 범위 초과', { ...busan, latitude: 999 }],
    ['잘못된 시간대', { ...busan, timezone: 'abc' }],
  ])('잘못된 도시는 호출 없이 error를 반환한다: %s', async (_name, city) => {
    const spy = jest.spyOn(globalThis, 'fetch')

    const result = await loadWeatherAction(city)

    expect(result.status).toBe('error')
    expect(spy).not.toHaveBeenCalled()
  })

  it('날씨 조회가 실패하면 던지지 않고 error 결과를 반환한다', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('fail', { status: 500 }))

    const result = await loadWeatherAction(busan)

    expect(result.status).toBe('error')
  })
})
