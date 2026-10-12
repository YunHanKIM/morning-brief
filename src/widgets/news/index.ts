import type { Widget } from '../types'
import { fetchNews, type NewsRaw } from './fetch'
import { normalizeNews, type NewsData } from './normalize'

export const newsWidget: Widget<NewsData, NewsRaw> = {
  name: 'news',
  fetch: fetchNews,
  normalize: normalizeNews,
}
