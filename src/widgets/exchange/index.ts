import type { Widget } from '../types'
import { fetchExchange, type ExchangeRaw } from './fetch'
import { normalizeExchange, type ExchangeData } from './normalize'

export const exchangeWidget: Widget<ExchangeData, ExchangeRaw> = {
  name: 'exchange',
  fetch: fetchExchange,
  normalize: normalizeExchange,
}
