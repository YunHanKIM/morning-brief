import type { Widget, WidgetResult } from './types'

export async function runWidget<T>(widget: Widget<T>): Promise<WidgetResult<T>> {
  try {
    const raw = await widget.fetch()
    return { status: 'ok', data: widget.normalize(raw) }
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : String(error),
    }
  }
}
