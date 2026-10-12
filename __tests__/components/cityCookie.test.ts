/** @jest-environment jsdom */
import { CITY_COOKIE, readCity, saveCityCookie } from '../../src/components/cityCookie'
import { POPULAR_CITIES } from '../../src/widgets/weather/city'

const busan = POPULAR_CITIES[1]

describe('readCity', () => {
  it('저장된 JSON을 도시로 읽는다', () => {
    expect(readCity(JSON.stringify(busan))).toEqual(busan)
  })

  it.each([
    ['쿠키 없음', undefined],
    ['빈 문자열', ''],
    ['JSON이 아님', '{not json'],
    ['도시가 아닌 JSON', JSON.stringify({ name: 'x' })],
    ['위도 범위 초과', JSON.stringify({ ...busan, latitude: 999 })],
    ['잘못된 시간대', JSON.stringify({ ...busan, timezone: 'abc' })],
    ['JSON null', 'null'],
  ])('믿을 수 없는 값은 null을 반환한다: %s', (_name, raw) => {
    expect(readCity(raw)).toBeNull()
  })
})

describe('saveCityCookie', () => {
  afterEach(() => {
    document.cookie = `${CITY_COOKIE}=; path=/; max-age=0`
  })

  it('브라우저 쿠키에 도시를 저장하고 다시 읽을 수 있다', () => {
    saveCityCookie(busan)

    const stored = document.cookie
      .split('; ')
      .find((entry) => entry.startsWith(`${CITY_COOKIE}=`))
      ?.slice(CITY_COOKIE.length + 1)
    expect(stored).toBeTruthy()
    expect(readCity(decodeURIComponent(stored as string))).toEqual(busan)
  })

  it('다른 도시를 저장하면 덮어쓴다', () => {
    saveCityCookie(busan)
    saveCityCookie(POPULAR_CITIES[7])

    const entries = document.cookie.split('; ').filter((e) => e.startsWith(`${CITY_COOKIE}=`))
    expect(entries).toHaveLength(1)
    expect(decodeURIComponent(entries[0].slice(CITY_COOKIE.length + 1))).toContain('제주')
  })

  describe('속성', () => {
    // document.cookie에 쓰인 문자열을 그대로 잡아서 검사한다
    const writtenCookie = (secure?: boolean) => {
      const setter = jest.spyOn(document, 'cookie', 'set')
      saveCityCookie(busan, secure)
      const written = String(setter.mock.calls[0][0])
      setter.mockRestore()
      return written
    }

    it('https에서는 secure를 붙인다', () => {
      expect(writtenCookie(true)).toContain('; secure')
    })

    it('http(로컬 개발)에서는 secure를 붙이지 않는다', () => {
      expect(writtenCookie(false)).not.toContain('secure')
    })

    it('기본값은 현재 주소가 https인지에 따른다 (jsdom은 http)', () => {
      expect(writtenCookie()).not.toContain('secure')
    })

    it('1년 만료, 경로 /, SameSite=Lax다', () => {
      const written = writtenCookie(false)
      expect(written).toContain('path=/')
      expect(written).toContain('max-age=31536000')
      expect(written.toLowerCase()).toContain('samesite=lax')
    })
  })
})
