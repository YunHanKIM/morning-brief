/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react'
import { WeatherCard } from '../../src/components/WeatherCard'

const data = { temperature: 18.4, condition: '맑음', high: 22, low: 11 }

describe('WeatherCard', () => {
  it('ok 결과면 기온·상태·최고/최저를 보여준다', () => {
    render(<WeatherCard result={{ status: 'ok', data }} />)
    expect(screen.getByRole('heading', { name: '날씨' })).toBeTruthy()
    expect(screen.getByText('18.4°')).toBeTruthy()
    expect(screen.getByText('맑음')).toBeTruthy()
    expect(screen.getByText('최고 22° / 최저 11°')).toBeTruthy()
  })

  it('카드는 "날씨"라는 이름의 영역(region)으로 식별된다', () => {
    render(<WeatherCard result={{ status: 'ok', data }} />)
    expect(screen.getByRole('region', { name: '날씨' })).toBeTruthy()
  })

  it('error 결과면 오류 메시지를 알림으로 보여주고 기온은 숨긴다', () => {
    render(<WeatherCard result={{ status: 'error', message: 'network down' }} />)
    expect(screen.getByRole('alert').textContent).toContain('network down')
    expect(screen.queryByText('18.4°')).toBeNull()
  })

  it('loading이면 로딩 상태를 보여준다', () => {
    render(<WeatherCard loading />)
    expect(screen.getByRole('status').textContent).toContain('불러오는 중')
  })

  it('loading이 아닌데 결과가 없으면 빈 상태를 보여준다', () => {
    render(<WeatherCard />)
    expect(screen.getByRole('status').textContent).toContain('날씨 정보가 없습니다')
  })
})
