import { parseCity, type City } from '../widgets/weather/city'

export const CITY_COOKIE = 'city'
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

// 쿠키는 믿을 수 없는 입력이라 읽을 때마다 검증한다. 틀리면 null(저장된 도시 없음)
export function readCity(raw: string | undefined): City | null {
  if (!raw) return null
  try {
    return parseCity(JSON.parse(raw))
  } catch {
    return null
  }
}

// 브라우저에서 직접 저장한다. 서버가 쿠키를 쓰면 페이지 전체가 다시 그려지기 때문
// https에서는 secure를 붙인다(로컬 개발의 http에서는 붙이면 저장이 안 된다)
export function saveCityCookie(city: City, secure: boolean = location.protocol === 'https:'): void {
  const value = encodeURIComponent(JSON.stringify(city))
  const attributes = `path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax${secure ? '; secure' : ''}`
  document.cookie = `${CITY_COOKIE}=${value}; ${attributes}`
}
