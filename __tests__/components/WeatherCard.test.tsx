/** @jest-environment jsdom */
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { loadWeatherAction } from '../../src/components/cityActions'
import { CITY_COOKIE, readCity } from '../../src/components/cityCookie'
import { WeatherCard } from '../../src/components/WeatherCard'
import { POPULAR_CITIES } from '../../src/widgets/weather/city'
import type { WeatherData } from '../../src/widgets/weather/normalize'
import type { WidgetResult } from '../../src/widgets/types'

jest.mock('../../src/components/cityActions', () => ({
  searchCitiesAction: jest.fn(),
  loadWeatherAction: jest.fn(),
}))
const loadWeatherMock = jest.mocked(loadWeatherAction)

const [seoul, busan, , , , , , jeju] = POPULAR_CITIES
const seoulData: WeatherData = { temperature: 18.4, condition: '맑음', high: 22, low: 11 }
const busanData: WeatherData = { temperature: 21, condition: '구름 많음', high: 24, low: 19 }
const jejuData: WeatherData = { temperature: 23, condition: '흐림', high: 25, low: 22 }
const ok = (data: WeatherData): WidgetResult<WeatherData> => ({ status: 'ok', data })

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

const savedCity = () => {
  const entry = document.cookie.split('; ').find((e) => e.startsWith(`${CITY_COOKIE}=`))
  return entry ? readCity(decodeURIComponent(entry.slice(CITY_COOKIE.length + 1))) : null
}

describe('WeatherCard', () => {
  beforeEach(() => {
    loadWeatherMock.mockReset()
    document.cookie = `${CITY_COOKIE}=; path=/; max-age=0`
  })

  it('카드는 "날씨"라는 이름의 영역(region)으로 식별된다', () => {
    render(<WeatherCard city={seoul} result={ok(seoulData)} />)
    expect(screen.getByRole('region', { name: '날씨' })).toBeTruthy()
  })

  it('ok 결과면 도시 이름과 기온·상태·최고/최저를 보여준다', () => {
    render(<WeatherCard city={seoul} result={ok(seoulData)} />)
    expect(screen.getByText('서울 · 서울특별시')).toBeTruthy()
    expect(screen.getByText('18.4°')).toBeTruthy()
    expect(screen.getByText('맑음')).toBeTruthy()
    expect(screen.getByText('최고 22° / 최저 11°')).toBeTruthy()
  })

  it('error 결과면 오류 메시지를 알림으로 보여주고 기온은 숨긴다', () => {
    render(<WeatherCard city={seoul} result={{ status: 'error', message: 'network down' }} />)
    expect(screen.getByRole('alert').textContent).toContain('network down')
    expect(screen.queryByText('18.4°')).toBeNull()
  })

  it('loading이면 로딩 상태를 보여준다', () => {
    render(<WeatherCard city={seoul} loading />)
    expect(screen.getByRole('status').textContent).toContain('불러오는 중')
  })

  it('도시가 있는데 결과가 없으면 빈 상태를 보여준다', () => {
    render(<WeatherCard city={seoul} />)
    expect(screen.getByRole('status').textContent).toContain('날씨 정보가 없습니다')
  })

  describe('첫 방문 (저장된 도시가 없음)', () => {
    it('도시를 선택하라는 안내와 도시 선택 창을 바로 보여준다', () => {
      render(<WeatherCard city={null} />)
      expect(screen.getByText('도시를 선택하세요')).toBeTruthy()
      expect(screen.getByLabelText('도시 검색')).toBeTruthy()
      expect(screen.getByRole('group', { name: '자주 쓰는 도시' })).toBeTruthy()
      expect(screen.queryByText(/°/)).toBeNull()
    })

    it('loading 중에는 선택 안내 대신 로딩 상태를 보여준다', () => {
      render(<WeatherCard city={null} loading />)
      expect(screen.getByRole('status').textContent).toContain('불러오는 중')
      expect(screen.queryByText('도시를 선택하세요')).toBeNull()
    })

    it('도시를 고르면 쿠키에 저장하고 그 도시의 날씨를 보여준다', async () => {
      loadWeatherMock.mockResolvedValue(ok(busanData))
      render(<WeatherCard city={null} />)

      fireEvent.click(screen.getByRole('button', { name: '부산' }))

      expect(await screen.findByText('21°')).toBeTruthy()
      expect(loadWeatherMock).toHaveBeenCalledWith(busan)
      expect(screen.getByText('부산 · 부산광역시')).toBeTruthy()
      expect(savedCity()).toEqual(busan)
      expect(screen.queryByLabelText('도시 검색')).toBeNull()
    })
  })

  describe('도시 바꾸기', () => {
    it('버튼이 선택 창의 펼침 상태를 스크린리더에 알린다 (aria-expanded, aria-controls)', () => {
      render(<WeatherCard city={seoul} result={ok(seoulData)} />)
      const toggle = screen.getByRole('button', { name: '도시 바꾸기' })
      expect(toggle.getAttribute('aria-expanded')).toBe('false')

      fireEvent.click(toggle)

      const opened = screen.getByRole('button', { name: '닫기' })
      expect(opened.getAttribute('aria-expanded')).toBe('true')
      const controlled = document.getElementById(opened.getAttribute('aria-controls') as string)
      expect(controlled).toBeTruthy()
      expect(within(controlled as HTMLElement).getByLabelText('도시 검색')).toBeTruthy()
    })

    it('버튼을 누르면 도시 선택 창이 열리고 닫을 수 있다', () => {
      render(<WeatherCard city={seoul} result={ok(seoulData)} />)

      fireEvent.click(screen.getByRole('button', { name: '도시 바꾸기' }))
      expect(screen.getByLabelText('도시 검색')).toBeTruthy()

      fireEvent.click(screen.getByRole('button', { name: '닫기' }))
      expect(screen.queryByLabelText('도시 검색')).toBeNull()
    })

    it('새 도시를 고르면 날씨와 저장된 도시가 바뀐다', async () => {
      loadWeatherMock.mockResolvedValue(ok(jejuData))
      render(<WeatherCard city={seoul} result={ok(seoulData)} />)

      fireEvent.click(screen.getByRole('button', { name: '도시 바꾸기' }))
      fireEvent.click(screen.getByRole('button', { name: '제주' }))

      expect(await screen.findByText('23°')).toBeTruthy()
      expect(screen.queryByText('18.4°')).toBeNull()
      expect(screen.getByText('제주 · 제주특별자치도')).toBeTruthy()
      expect(savedCity()).toEqual(jeju)
      expect(screen.queryByLabelText('도시 검색')).toBeNull()
    })

    it('조회하는 동안 불러오는 중을 보여주고 선택 창은 잠근다', async () => {
      const pending = deferred<WidgetResult<WeatherData>>()
      loadWeatherMock.mockReturnValue(pending.promise)
      render(<WeatherCard city={seoul} result={ok(seoulData)} />)

      fireEvent.click(screen.getByRole('button', { name: '도시 바꾸기' }))
      fireEvent.click(screen.getByRole('button', { name: '제주' }))

      expect(within(screen.getByRole('region', { name: '날씨' })).getByRole('status').textContent).toContain('불러오는 중')
      await act(async () => pending.resolve(ok(jejuData)))
      await waitFor(() => expect(screen.queryByRole('status')).toBeNull())
    })

    it('날씨 조회가 실패해도 도시는 저장되고 오류를 보여주며 다시 바꿀 수 있다', async () => {
      loadWeatherMock.mockResolvedValue({ status: 'error', message: 'boom' })
      render(<WeatherCard city={seoul} result={ok(seoulData)} />)

      fireEvent.click(screen.getByRole('button', { name: '도시 바꾸기' }))
      fireEvent.click(screen.getByRole('button', { name: '제주' }))

      expect((await screen.findByRole('alert')).textContent).toContain('boom')
      expect(savedCity()).toEqual(jeju)
      expect(screen.getByRole('button', { name: '도시 바꾸기' })).toBeTruthy()
    })

    it('조회 호출 자체가 실패해도 오류를 알림으로 보여준다', async () => {
      loadWeatherMock.mockRejectedValue(new Error('network'))
      render(<WeatherCard city={seoul} result={ok(seoulData)} />)

      fireEvent.click(screen.getByRole('button', { name: '도시 바꾸기' }))
      fireEvent.click(screen.getByRole('button', { name: '제주' }))

      expect((await screen.findByRole('alert')).textContent).toContain('서버와 통신하지 못했습니다')
    })

    it('조회하는 동안에는 다른 도시를 고를 수 없다 (연속 선택으로 인한 순서 꼬임 방지)', async () => {
      const pending = deferred<WidgetResult<WeatherData>>()
      loadWeatherMock.mockReturnValue(pending.promise)
      render(<WeatherCard city={seoul} result={ok(seoulData)} />)

      fireEvent.click(screen.getByRole('button', { name: '도시 바꾸기' }))
      fireEvent.click(screen.getByRole('button', { name: '부산' }))

      expect((screen.getByRole('button', { name: '제주' }) as HTMLButtonElement).disabled).toBe(true)
      await act(async () => pending.resolve(ok(busanData)))
      expect(await screen.findByText('21°')).toBeTruthy()
      expect(loadWeatherMock).toHaveBeenCalledTimes(1)
    })
  })
})
