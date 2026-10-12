import { toDashboardResults } from '../../src/components/toDashboardResults'

const data = { temperature: 18.4, condition: '맑음', high: 22, low: 11 }

describe('toDashboardResults', () => {
  it('올바른 날씨 ok 결과는 그대로 통과시킨다', () => {
    expect(toDashboardResults({ weather: { status: 'ok', data } })).toEqual({
      weather: { status: 'ok', data },
    })
  })

  it('error 결과는 그대로 통과시킨다', () => {
    expect(toDashboardResults({ weather: { status: 'error', message: 'boom' } })).toEqual({
      weather: { status: 'error', message: 'boom' },
    })
  })

  it('날씨 키가 없으면 weather를 비워 둔다', () => {
    expect(toDashboardResults({})).toEqual({})
  })

  it('ok인데 데이터 모양이 틀리면 error로 바꾼다', () => {
    const result = toDashboardResults({ weather: { status: 'ok', data: { temperature: '18' } } })
    expect(result.weather?.status).toBe('error')
  })
})
