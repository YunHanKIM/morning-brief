export const CURRENCIES = ['KRW', 'JPY', 'EUR', 'CNY', 'GBP', 'AUD', 'CAD', 'CHF'] as const

export type Currency = (typeof CURRENCIES)[number]

export const DEFAULT_CURRENCY: Currency = 'KRW'

export const CURRENCY_NAMES: Record<Currency, string> = {
  KRW: '대한민국 원',
  JPY: '일본 엔',
  EUR: '유로',
  CNY: '중국 위안',
  GBP: '영국 파운드',
  AUD: '호주 달러',
  CAD: '캐나다 달러',
  CHF: '스위스 프랑',
}

// 주소(?to=)처럼 믿을 수 없는 값을 받아 목록에 있는 통화로만 좁힌다
export function parseCurrency(value: unknown): Currency {
  return CURRENCIES.find((code) => code === value) ?? DEFAULT_CURRENCY
}
