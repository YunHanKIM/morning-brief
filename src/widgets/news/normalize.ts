import type { NewsRaw } from './fetch'

export interface NewsItem {
  id: number
  title: string
  score: number
  url: string
  discussionUrl: string
}

export interface NewsData {
  items: NewsItem[]
}

const TOP_COUNT = 5

const discussionUrl = (id: number) => `https://news.ycombinator.com/item?id=${id}`

// 외부에서 온 링크는 http(s)만 허용한다 (javascript: 같은 주소로 화면이 실행되지 않게)
function safeUrl(value: string | undefined): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null
  } catch {
    return null
  }
}

export function normalizeNews(raw: NewsRaw): NewsData {
  const items = raw.stories
    .filter((story) => story.type === 'story' && !story.deleted && !story.dead)
    .map((story) => ({
      id: story.id,
      title: story.title,
      score: story.score,
      url: safeUrl(story.url) ?? discussionUrl(story.id),
      discussionUrl: discussionUrl(story.id),
    }))
    .slice(0, TOP_COUNT)
  return { items }
}
