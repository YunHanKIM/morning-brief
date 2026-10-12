/** @jest-environment jsdom */
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { CityPicker } from '../../src/components/CityPicker'
import { searchCitiesAction } from '../../src/components/cityActions'
import { POPULAR_CITIES, type City } from '../../src/widgets/weather/city'

jest.mock('../../src/components/cityActions', () => ({
  searchCitiesAction: jest.fn(),
  loadWeatherAction: jest.fn(),
}))
const searchMock = jest.mocked(searchCitiesAction)

const tokyo: City = {
  name: '도쿄',
  region: '도쿄 도',
  country: '일본',
  latitude: 35.6895,
  longitude: 139.6917,
  timezone: 'Asia/Tokyo',
}
const village: City = {
  name: '부산',
  region: '전라남도',
  country: '대한민국',
  latitude: 35.29562,
  longitude: 126.73647,
  timezone: 'Asia/Seoul',
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

const input = () => screen.getByLabelText('도시 검색') as HTMLInputElement
const search = (text: string) => {
  fireEvent.change(input(), { target: { value: text } })
  fireEvent.click(screen.getByRole('button', { name: '검색' }))
}

describe('CityPicker', () => {
  beforeEach(() => {
    searchMock.mockReset()
  })

  describe('자주 쓰는 도시', () => {
    it('주요 도시 8곳을 버튼으로 보여준다', () => {
      render(<CityPicker onSelect={() => {}} />)
      const group = screen.getByRole('group', { name: '자주 쓰는 도시' })
      expect(within(group).getAllByRole('button').map((b) => b.textContent)).toEqual(
        POPULAR_CITIES.map((c) => c.name),
      )
    })

    it('버튼을 누르면 그 도시로 onSelect를 호출한다 (검색 없이)', () => {
      const onSelect = jest.fn()
      render(<CityPicker onSelect={onSelect} />)

      fireEvent.click(screen.getByRole('button', { name: '부산' }))

      expect(onSelect).toHaveBeenCalledWith(POPULAR_CITIES[1])
      expect(searchMock).not.toHaveBeenCalled()
    })
  })

  describe('검색', () => {
    it('검색어로 검색하고 결과를 이름·행정구역·나라와 함께 보여준다', async () => {
      searchMock.mockResolvedValue({ status: 'ok', cities: [tokyo, village] })
      render(<CityPicker onSelect={() => {}} />)

      search('Tokyo')

      const list = await screen.findByRole('list', { name: '검색 결과' })
      expect(searchMock).toHaveBeenCalledWith('Tokyo')
      const items = within(list).getAllByRole('button')
      expect(items[0].textContent).toBe('도쿄 · 도쿄 도, 일본')
      expect(items[1].textContent).toBe('부산 · 전라남도, 대한민국')
    })

    it('결과를 누르면 그 도시로 onSelect를 호출한다', async () => {
      searchMock.mockResolvedValue({ status: 'ok', cities: [tokyo] })
      const onSelect = jest.fn()
      render(<CityPicker onSelect={onSelect} />)

      search('Tokyo')
      fireEvent.click(await screen.findByRole('button', { name: '도쿄 · 도쿄 도, 일본' }))

      expect(onSelect).toHaveBeenCalledWith(tokyo)
    })

    it('Enter(폼 제출)로도 검색한다', async () => {
      searchMock.mockResolvedValue({ status: 'ok', cities: [tokyo] })
      render(<CityPicker onSelect={() => {}} />)

      fireEvent.change(input(), { target: { value: 'Tokyo' } })
      fireEvent.submit(input().form as HTMLFormElement)

      expect(await screen.findByRole('list', { name: '검색 결과' })).toBeTruthy()
    })

    it('결과가 없으면 안내 문구를 보여준다', async () => {
      searchMock.mockResolvedValue({ status: 'ok', cities: [] })
      render(<CityPicker onSelect={() => {}} />)

      search('zzzzqqqq')

      expect(await screen.findByText('검색 결과가 없습니다')).toBeTruthy()
    })

    it('검색이 실패하면 오류를 알림으로 보여준다', async () => {
      searchMock.mockResolvedValue({ status: 'error', message: 'boom' })
      render(<CityPicker onSelect={() => {}} />)

      search('Tokyo')

      expect((await screen.findByRole('alert')).textContent).toContain('boom')
    })

    it('검색 호출 자체가 실패해도 오류를 알림으로 보여준다', async () => {
      searchMock.mockRejectedValue(new Error('network'))
      render(<CityPicker onSelect={() => {}} />)

      search('Tokyo')

      expect((await screen.findByRole('alert')).textContent).toContain('검색하지 못했습니다')
    })

    it('검색하는 동안 검색 중을 보여준다', async () => {
      const pending = deferred<Awaited<ReturnType<typeof searchCitiesAction>>>()
      searchMock.mockReturnValue(pending.promise)
      render(<CityPicker onSelect={() => {}} />)

      search('Tokyo')

      expect((await screen.findByRole('status')).textContent).toContain('검색 중')
      await act(async () => pending.resolve({ status: 'ok', cities: [tokyo] }))
      expect(screen.queryByText(/검색 중/)).toBeNull()
    })

    it.each([['빈 입력', ''], ['공백만', '   ']])('%s이면 검색하지 않는다', (_name, text) => {
      render(<CityPicker onSelect={() => {}} />)

      search(text)

      expect(searchMock).not.toHaveBeenCalled()
    })

    it('연속으로 검색해 응답 순서가 뒤바뀌어도 마지막 검색 결과만 보여준다', async () => {
      const first = deferred<Awaited<ReturnType<typeof searchCitiesAction>>>()
      const second = deferred<Awaited<ReturnType<typeof searchCitiesAction>>>()
      searchMock.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
      render(<CityPicker onSelect={() => {}} />)

      search('Busan')
      search('Tokyo')
      await act(async () => second.resolve({ status: 'ok', cities: [tokyo] }))
      await act(async () => first.resolve({ status: 'ok', cities: [village] }))

      expect(screen.getByRole('button', { name: '도쿄 · 도쿄 도, 일본' })).toBeTruthy()
      expect(screen.queryByRole('button', { name: /전라남도/ })).toBeNull()
    })
  })

  it('disabled이면 모든 버튼과 입력이 비활성화된다', () => {
    render(<CityPicker onSelect={() => {}} disabled />)

    expect(input().disabled).toBe(true)
    expect((screen.getByRole('button', { name: '검색' }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole('button', { name: '서울' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('도시 이름 검색 안내를 보여준다', () => {
    render(<CityPicker onSelect={() => {}} />)
    expect(screen.getByText(/영문 이름으로 검색/)).toBeTruthy()
  })
})
