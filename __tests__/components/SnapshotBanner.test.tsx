/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react'
import { SnapshotBanner } from '../../src/components/SnapshotBanner'

describe('SnapshotBanner', () => {
  it('저장된 브리핑을 보는 중이면 날짜와 읽기 전용임을 알린다', () => {
    render(<SnapshotBanner state="viewing" date="2026-10-12" />)

    expect(screen.getByRole('status').textContent).toContain('2026-10-12')
    expect(screen.getByRole('status').textContent).toContain('읽기 전용')
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it.each([
    ['not-found', '2026-10-12에 저장된 브리핑이 없습니다'],
    ['invalid', '올바르지 않은 날짜입니다'],
    ['unavailable', '저장소를 사용할 수 없어 브리핑을 불러오지 못했습니다'],
  ] as const)('%s는 알림으로 이유를 알린다', (state, message) => {
    render(<SnapshotBanner state={state} date="2026-10-12" />)

    expect(screen.getByRole('alert').textContent).toContain(message)
  })

  it.each(['viewing', 'not-found', 'invalid', 'unavailable'] as const)(
    '%s에서 오늘 브리핑으로 돌아가는 링크가 있다',
    (state) => {
      render(<SnapshotBanner state={state} date="2026-10-12" />)

      expect(screen.getByRole('link', { name: '오늘 브리핑으로' }).getAttribute('href')).toBe('/')
    },
  )

  it('잘못된 날짜 요청의 내용은 화면에 되풀이하지 않는다 (HTML이든 아니든 글자로도 싣지 않는다)', () => {
    const { container } = render(<SnapshotBanner state="invalid" date="<img src=x onerror=alert(1)>" />)

    expect(container.querySelector('img')).toBeNull()
    expect(container.textContent).not.toContain('onerror')
  })
})
