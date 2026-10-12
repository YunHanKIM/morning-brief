import { z } from 'zod'

const HN_URL = 'https://hacker-news.firebaseio.com/v0'
// 보여줄 건수(5)보다 여유 있게 가져온다. 글이 아니거나 죽은 글은 normalize에서 걸러지기 때문
const FETCH_COUNT = 10
const TIMEOUT_MS = 5000

const idsSchema = z.array(z.number().int().positive()).min(1)

const storySchema = z.object({
  id: z.number().int(),
  type: z.string(),
  title: z.string(),
  score: z.number().int().min(0),
  url: z.string().optional(),
  deleted: z.boolean().optional(),
  dead: z.boolean().optional(),
})

export type HnStory = z.infer<typeof storySchema>

export interface NewsRaw {
  stories: HnStory[]
}

async function getJson(url: string): Promise<unknown> {
  const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) })
  if (!response.ok) {
    throw new Error(`Hacker News 응답 오류: ${response.status}`)
  }
  return response.json()
}

export async function fetchNews(): Promise<NewsRaw> {
  const ids = idsSchema.parse(await getJson(`${HN_URL}/topstories.json`)).slice(0, FETCH_COUNT)

  // 글마다 따로 조회한다. 일부가 실패해도(삭제된 글 등) 나머지는 살린다
  const settled = await Promise.allSettled(
    ids.map(async (id) => storySchema.parse(await getJson(`${HN_URL}/item/${id}.json`))),
  )
  const stories = settled.flatMap((outcome) => (outcome.status === 'fulfilled' ? [outcome.value] : []))
  if (stories.length === 0) {
    throw new Error('Hacker News 글을 하나도 가져오지 못했습니다')
  }
  return { stories }
}
