export type WidgetResult<T> =
  | { status: 'ok'; data: T }
  | { status: 'error'; message: string }

export interface Widget<T, R = unknown> {
  name: string
  fetch: () => Promise<R>
  normalize: (raw: R) => T
}
