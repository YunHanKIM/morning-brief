import { timingSafeEqual } from 'node:crypto'
import { isAuthorized } from '../../src/brief/auth'

// 실제 함수를 그대로 부르되 호출 여부와 인자를 기록한다
jest.mock('node:crypto', () => {
  const actual = jest.requireActual('node:crypto')
  return { ...actual, timingSafeEqual: jest.fn(actual.timingSafeEqual) }
})
const timingSafeEqualMock = jest.mocked(timingSafeEqual)

const SECRET = 's3cret-value'

describe('isAuthorized', () => {
  beforeEach(() => {
    timingSafeEqualMock.mockClear()
  })

  it('Bearer 토큰이 비밀값과 같으면 통과한다', () => {
    expect(isAuthorized(`Bearer ${SECRET}`, SECRET)).toBe(true)
  })

  it('Bearer 스킴은 대소문자를 가리지 않는다', () => {
    expect(isAuthorized(`bearer ${SECRET}`, SECRET)).toBe(true)
    expect(isAuthorized(`BEARER ${SECRET}`, SECRET)).toBe(true)
  })

  it.each([
    ['헤더 없음', null],
    ['빈 헤더', ''],
    ['토큰 없음', 'Bearer '],
    ['스킴만', 'Bearer'],
    ['다른 스킴', `Basic ${SECRET}`],
    ['스킴 없이 토큰만', SECRET],
    ['틀린 토큰', 'Bearer wrong'],
    ['더 긴 토큰', `Bearer ${SECRET}x`],
    ['더 짧은 토큰', `Bearer ${SECRET.slice(0, -1)}`],
    ['대소문자가 다른 토큰', `Bearer ${SECRET.toUpperCase()}`],
    ['토큰 뒤에 공백', `Bearer ${SECRET} `],
    ['토큰이 두 개', `Bearer ${SECRET} ${SECRET}`],
    ['비밀값이 앞에 붙음', `Bearer x${SECRET}`],
  ])('거부한다: %s', (_name, header) => {
    expect(isAuthorized(header, SECRET)).toBe(false)
  })

  it.each([
    ['빈 비밀값', ''],
    ['공백뿐인 비밀값', '   '],
  ])('%s이면 어떤 헤더도 통과시키지 않는다 (설정 누락 시 열리지 않게)', (_name, secret) => {
    expect(isAuthorized('Bearer ', secret)).toBe(false)
    expect(isAuthorized(`Bearer ${secret}`, secret)).toBe(false)
    expect(isAuthorized(null, secret)).toBe(false)
  })

  it('길이가 달라도 상수 시간 비교(timingSafeEqual)로 판정한다', () => {
    isAuthorized('Bearer short', SECRET)
    isAuthorized(`Bearer ${SECRET}`, SECRET)

    expect(timingSafeEqualMock).toHaveBeenCalledTimes(2)
    for (const [a, b] of timingSafeEqualMock.mock.calls) {
      expect((a as Buffer).length).toBe((b as Buffer).length)
    }
  })
})
