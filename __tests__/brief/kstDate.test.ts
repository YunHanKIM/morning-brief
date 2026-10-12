import { kstDate } from '../../src/brief/kstDate'

describe('kstDate', () => {
  it('한국 시간 기준 날짜(YYYY-MM-DD)를 반환한다', () => {
    expect(kstDate(new Date('2026-10-13T00:00:00+09:00'))).toBe('2026-10-13')
  })

  it('UTC로는 전날 오후여도 한국 시간으로는 다음 날이다', () => {
    expect(kstDate(new Date('2026-10-12T15:00:00Z'))).toBe('2026-10-13')
  })

  it('한국 시간 자정 직전은 아직 같은 날이다', () => {
    expect(kstDate(new Date('2026-10-12T14:59:59Z'))).toBe('2026-10-12')
  })

  it('연말·월말 경계를 넘긴다', () => {
    expect(kstDate(new Date('2026-12-31T15:00:00Z'))).toBe('2027-01-01')
    expect(kstDate(new Date('2026-02-28T15:30:00Z'))).toBe('2026-03-01')
  })
})
