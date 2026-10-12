import { resolveBriefCity } from '../../src/brief/briefCity'
import { POPULAR_CITIES } from '../../src/widgets/weather/city'

const tokyo = {
  name: '도쿄',
  region: '도쿄 도',
  country: '일본',
  latitude: 35.6895,
  longitude: 139.6917,
  timezone: 'Asia/Tokyo',
}

describe('resolveBriefCity', () => {
  it.each([
    ['설정 없음(undefined)', undefined],
    ['빈 문자열', ''],
    ['공백뿐', '   '],
  ])('%s이면 기본 도시 서울을 쓴다', (_name, value) => {
    expect(resolveBriefCity(value)).toEqual(POPULAR_CITIES[0])
  })

  it.each(POPULAR_CITIES.map((city) => [city.name, city]))(
    '주요 도시 이름 %s는 그 도시를 쓴다',
    (name, city) => {
      expect(resolveBriefCity(name as string)).toEqual(city)
    },
  )

  it('이름 앞뒤 공백은 무시한다', () => {
    expect(resolveBriefCity('  부산  ')).toEqual(POPULAR_CITIES[1])
  })

  it('도시 JSON도 받는다 (주요 도시가 아닌 곳)', () => {
    expect(resolveBriefCity(JSON.stringify(tokyo))).toEqual(tokyo)
  })

  it.each([
    ['목록에 없는 이름', '아무개시'],
    ['깨진 JSON', '{not json'],
    ['도시가 아닌 JSON', JSON.stringify({ name: 'x' })],
    ['위도 범위 초과', JSON.stringify({ ...tokyo, latitude: 999 })],
    ['잘못된 시간대', JSON.stringify({ ...tokyo, timezone: 'abc' })],
    ['JSON null', 'null'],
    ['JSON 숫자', '123'],
  ])('잘못된 설정은 null을 반환한다 (조용히 서울로 바꾸지 않는다): %s', (_name, value) => {
    expect(resolveBriefCity(value)).toBeNull()
  })
})
