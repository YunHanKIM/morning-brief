import { parseCity, POPULAR_CITIES, searchCities } from '../../../src/widgets/weather/city'

const busan = {
  name: '부산광역시',
  region: '부산광역시',
  country: '대한민국',
  latitude: 35.10168,
  longitude: 129.03004,
  timezone: 'Asia/Seoul',
}

const geoItem = {
  id: 1838524,
  name: '부산광역시',
  latitude: 35.10168,
  longitude: 129.03004,
  timezone: 'Asia/Seoul',
  country_code: 'KR',
  admin1: '부산광역시',
  country: '대한민국',
}

const okResponse = (body: unknown) => new Response(JSON.stringify(body), { status: 200 })

describe('searchCities', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('지오코딩 API에 이름·개수·언어로 검색한다', async () => {
    const spy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(okResponse({ results: [geoItem] }))

    await searchCities('Busan')

    const url = new URL(String(spy.mock.calls[0][0]))
    expect(url.origin + url.pathname).toBe('https://geocoding-api.open-meteo.com/v1/search')
    expect(url.searchParams.get('name')).toBe('Busan')
    expect(url.searchParams.get('count')).toBe('5')
    expect(url.searchParams.get('language')).toBe('ko')
  })

  it('검색 결과를 도시 정보로 변환한다', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(okResponse({ results: [geoItem] }))

    expect(await searchCities('Busan')).toEqual([busan])
  })

  it('결과가 없으면(results 키 없음) 빈 배열을 반환한다', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(okResponse({ generationtime_ms: 0.1 }))

    expect(await searchCities('zzzzqqqq')).toEqual([])
  })

  it('행정구역·나라·시간대가 없는 결과도 빈 값과 auto로 채운다', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      okResponse({ results: [{ name: 'Nowhere', latitude: 1, longitude: 2 }] }),
    )

    expect(await searchCities('Nowhere')).toEqual([
      { name: 'Nowhere', region: '', country: '', latitude: 1, longitude: 2, timezone: 'auto' },
    ])
  })

  it('앞뒤 공백을 지우고 검색한다', async () => {
    const spy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(okResponse({ results: [] }))

    await searchCities('  Busan  ')

    expect(new URL(String(spy.mock.calls[0][0])).searchParams.get('name')).toBe('Busan')
  })

  it('특수문자는 검색어 하나로만 인코딩된다 (다른 파라미터를 끼워 넣을 수 없다)', async () => {
    const spy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(okResponse({ results: [] }))

    await searchCities('a&count=100')

    const url = new URL(String(spy.mock.calls[0][0]))
    expect(url.searchParams.get('name')).toBe('a&count=100')
    expect(url.searchParams.get('count')).toBe('5')
  })

  it.each([
    ['빈 문자열', ''],
    ['공백만', '   '],
    ['1글자', 'a'],
    ['51글자', 'a'.repeat(51)],
  ])('검색어가 너무 짧거나 길면 호출 없이 빈 배열을 반환한다: %s', async (_name, query) => {
    const spy = jest.spyOn(globalThis, 'fetch')

    expect(await searchCities(query)).toEqual([])
    expect(spy).not.toHaveBeenCalled()
  })

  describe('주요 도시 이름은 지오코딩보다 먼저 확인한다', () => {
    it.each([
      ['서울', '서울'],
      ['부산', '부산'],
      ['제주', '제주'],
      ['부산광역시', '부산'],
      ['서울특별시', '서울'],
      ['  대구  ', '대구'],
    ])('"%s"는 호출 없이 주요 도시 %s를 반환한다', async (query, name) => {
      const spy = jest.spyOn(globalThis, 'fetch')

      const result = await searchCities(query)

      expect(spy).not.toHaveBeenCalled()
      expect(result).toEqual([POPULAR_CITIES.find((c) => c.name === name)])
    })

    it('주요 도시가 아닌 이름은 지오코딩 API로 검색한다', async () => {
      const spy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(okResponse({ results: [geoItem] }))

      await searchCities('Busan')

      expect(spy).toHaveBeenCalledTimes(1)
    })
  })

  it('5초 타임아웃 신호(AbortSignal)를 함께 전달한다', async () => {
    const spy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(okResponse({ results: [] }))
    const timeoutSpy = jest.spyOn(AbortSignal, 'timeout')

    await searchCities('Busan')

    expect(timeoutSpy).toHaveBeenCalledWith(5000)
    expect(spy.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal)
  })

  it('HTTP 오류 응답이면 예외를 던진다', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('fail', { status: 500 }))

    await expect(searchCities('Busan')).rejects.toThrow('500')
  })

  it.each([
    ['results가 배열이 아님', { results: 'x' }],
    ['위도가 문자열', { results: [{ ...geoItem, latitude: '35.1' }] }],
    ['이름 누락', { results: [{ latitude: 1, longitude: 2 }] }],
  ])('응답 모양이 다르면 예외를 던진다: %s', async (_name, body) => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(okResponse(body))

    await expect(searchCities('Busan')).rejects.toThrow()
  })
})

describe('parseCity', () => {
  it('올바른 도시는 그대로 반환한다', () => {
    expect(parseCity(busan)).toEqual(busan)
  })

  it.each(['Asia/Seoul', 'America/New_York', 'UTC', 'auto'])('실제 시간대 %s는 통과한다', (timezone) => {
    expect(parseCity({ ...busan, timezone })?.timezone).toBe(timezone)
  })

  it('알 수 없는 필드는 버린다', () => {
    expect(parseCity({ ...busan, extra: 'x' })).toEqual(busan)
  })

  it.each([
    ['null', null],
    ['문자열', 'Busan'],
    ['배열', []],
    ['이름 없음', { ...busan, name: '' }],
    ['이름이 너무 김', { ...busan, name: 'a'.repeat(101) }],
    ['위도 범위 초과', { ...busan, latitude: 91 }],
    ['경도 범위 초과', { ...busan, longitude: -181 }],
    ['위도가 문자열', { ...busan, latitude: '35.1' }],
    ['위도가 NaN', { ...busan, latitude: NaN }],
    ['시간대 없음', { ...busan, timezone: '' }],
    ['시간대에 금지 문자(&)', { ...busan, timezone: 'Asia/Seoul&x=1' }],
    ['시간대에 공백', { ...busan, timezone: 'Asia Seoul' }],
    ['실제 시간대가 아님(슬래시 없음)', { ...busan, timezone: 'abc' }],
    ['실제 시간대가 아님(지역/도시 형태)', { ...busan, timezone: 'Not_A/Zone' }],
  ])('잘못된 값은 null을 반환한다: %s', (_name, value) => {
    expect(parseCity(value)).toBeNull()
  })
})

describe('POPULAR_CITIES', () => {
  it('서울부터 시작하는 주요 도시 8곳이다', () => {
    expect(POPULAR_CITIES).toHaveLength(8)
    expect(POPULAR_CITIES[0].name).toBe('서울')
    expect(POPULAR_CITIES.map((c) => c.name)).toEqual([
      '서울', '부산', '인천', '대구', '대전', '광주', '울산', '제주',
    ])
  })

  it('모두 유효한 도시 정보이고 이름이 겹치지 않는다', () => {
    for (const city of POPULAR_CITIES) {
      expect(parseCity(city)).toEqual(city)
    }
    expect(new Set(POPULAR_CITIES.map((c) => c.name)).size).toBe(POPULAR_CITIES.length)
  })
})
