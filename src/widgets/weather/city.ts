import { z } from 'zod'

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const TIMEOUT_MS = 5000
const MIN_QUERY_LENGTH = 2
const MAX_QUERY_LENGTH = 50
const RESULT_COUNT = 5

function isRealTimeZone(timezone: string): boolean {
  if (timezone === 'auto') return true
  try {
    new Intl.DateTimeFormat('en', { timeZone: timezone })
    return true
  } catch {
    return false
  }
}

const citySchema = z.object({
  name: z.string().min(1).max(100),
  region: z.string().max(100),
  country: z.string().max(100),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timezone: z
    .string()
    .regex(/^[A-Za-z0-9_+\-/]{1,64}$/)
    .refine(isRealTimeZone),
})

export type City = z.infer<typeof citySchema>

// 쿠키처럼 믿을 수 없는 값을 도시로 좁힌다. 틀리면 null
export function parseCity(value: unknown): City | null {
  const parsed = citySchema.safeParse(value)
  return parsed.success ? parsed.data : null
}

// 한글 짧은 이름("서울", "부산")은 검색이 엉뚱한 곳을 찾아서 주요 도시는 좌표를 고정해 둔다
const kr = (name: string, region: string, latitude: number, longitude: number): City => ({
  name,
  region,
  country: '대한민국',
  latitude,
  longitude,
  timezone: 'Asia/Seoul',
})

export const POPULAR_CITIES: City[] = [
  kr('서울', '서울특별시', 37.566, 126.9784),
  kr('부산', '부산광역시', 35.10168, 129.03004),
  kr('인천', '인천광역시', 37.45646, 126.70515),
  kr('대구', '대구광역시', 35.87028, 128.59111),
  kr('대전', '대전광역시', 36.34913, 127.38493),
  kr('광주', '광주광역시', 35.15472, 126.91556),
  kr('울산', '울산광역시', 35.53722, 129.31667),
  kr('제주', '제주특별자치도', 33.50972, 126.52194),
]

const geocodingSchema = z.object({
  results: z
    .array(
      z.object({
        name: z.string(),
        latitude: z.number(),
        longitude: z.number(),
        timezone: z.string().optional(),
        admin1: z.string().optional(),
        country: z.string().optional(),
      }),
    )
    .optional(),
})

export async function searchCities(query: string): Promise<City[]> {
  const name = query.trim()
  if (name.length < MIN_QUERY_LENGTH || name.length > MAX_QUERY_LENGTH) return []

  // 주요 도시의 이름("서울")이나 행정구역 이름("서울특별시")이면 검색 API 없이 그 도시를 돌려준다
  const popular = POPULAR_CITIES.filter((city) => city.name === name || city.region === name)
  if (popular.length > 0) return popular

  const params = new URLSearchParams({
    name,
    count: String(RESULT_COUNT),
    language: 'ko',
    format: 'json',
  })
  const response = await fetch(`${GEOCODING_URL}?${params}`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (!response.ok) {
    throw new Error(`Open-Meteo 지오코딩 응답 오류: ${response.status}`)
  }
  const { results = [] } = geocodingSchema.parse(await response.json())
  return results.flatMap((item) => {
    const city = parseCity({
      name: item.name,
      region: item.admin1 ?? '',
      country: item.country ?? '',
      latitude: item.latitude,
      longitude: item.longitude,
      timezone: item.timezone ?? 'auto',
    })
    return city ? [city] : []
  })
}
