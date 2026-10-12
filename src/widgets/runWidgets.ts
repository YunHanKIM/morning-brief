import { runWidget } from './runWidget'
import type { Widget, WidgetResult } from './types'

// 위젯마다 T·R이 달라 한 배열에 담으려면 any가 필요하다 (결과는 unknown으로 좁혀 반환)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyWidget = Widget<any, any>

export async function runWidgets(
  widgets: AnyWidget[],
): Promise<Record<string, WidgetResult<unknown>>> {
  const settled = await Promise.allSettled(widgets.map((widget) => runWidget(widget)))
  const results: Record<string, WidgetResult<unknown>> = {}
  settled.forEach((outcome, index) => {
    results[widgets[index].name] =
      outcome.status === 'fulfilled'
        ? outcome.value
        : { status: 'error', message: String(outcome.reason) }
  })
  return results
}
