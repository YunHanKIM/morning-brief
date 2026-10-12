'use server'

import { createExchangeWidget } from '../widgets/exchange'
import { parseCurrency } from '../widgets/exchange/currencies'
import type { ExchangeData } from '../widgets/exchange/normalize'
import { runWidget } from '../widgets/runWidget'
import type { WidgetResult } from '../widgets/types'

// Server Action은 직접 POST로도 호출될 수 있으므로 입력을 목록으로 좁힌다
export async function loadExchange(to: unknown): Promise<WidgetResult<ExchangeData>> {
  return runWidget(createExchangeWidget(parseCurrency(to)))
}
