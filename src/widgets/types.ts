export type WidgetResult<T> =
  | { status: 'ok'; data: T }
  | { status: 'error'; message: string }

export interface Widget<T> {
  name: string
  fetch: () => Promise<unknown>
  normalize: (raw: unknown) => T
}
