import type { Widget } from '../types'
import { DEFAULT_CURRENCY, type Currency } from './currencies'
import { fetchExchange, type ExchangeRaw } from './fetch'
import { normalizeExchange, type ExchangeData } from './normalize'

export function createExchangeWidget(
  to: Currency = DEFAULT_CURRENCY,
): Widget<ExchangeData, ExchangeRaw> {
  return {
    name: 'exchange',
    fetch: () => fetchExchange(to),
    normalize: (raw) => normalizeExchange(raw, to),
  }
}
