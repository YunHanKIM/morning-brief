import { parseCity, POPULAR_CITIES, type City } from '../widgets/weather/city'

// 자동 브리핑은 브라우저 쿠키를 읽을 수 없어 환경변수 BRIEF_CITY로 도시를 정한다(서버 저장소 U10 전까지).
// 값은 주요 도시 이름("부산") 또는 도시 JSON. 비어 있으면 서울. 잘못된 값은 null(조용히 바꾸지 않는다)
export function resolveBriefCity(value: string | undefined): City | null {
  const text = value?.trim()
  if (!text) return POPULAR_CITIES[0]

  const popular = POPULAR_CITIES.find((city) => city.name === text)
  if (popular) return popular

  try {
    return parseCity(JSON.parse(text))
  } catch {
    return null
  }
}
