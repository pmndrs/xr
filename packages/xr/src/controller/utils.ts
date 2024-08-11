export type SyncAsync<T> = T | Promise<T>

export function syncAsync<T2, O>(fn1: () => SyncAsync<T2>, fn2: (input: T2) => SyncAsync<O>): SyncAsync<O>
export function syncAsync<T2, T3, O>(
  fn1: () => SyncAsync<T2>,
  fn2: (input: T2) => SyncAsync<T3>,
  fn3: (input: T3) => SyncAsync<O>,
): SyncAsync<O>
export function syncAsync<T2, T3, T4, O>(
  fn1: () => SyncAsync<T2>,
  fn2: (input: T2) => SyncAsync<T3>,
  fn3: (input: T3) => SyncAsync<T4>,
  fn4: (input: T4) => SyncAsync<O>,
): SyncAsync<O>
export function syncAsync<T2, T3, T4, T5, O>(
  fn1: () => SyncAsync<T2>,
  fn2: (input: T2) => SyncAsync<T3>,
  fn3: (input: T3) => SyncAsync<T4>,
  fn4: (input: T4) => SyncAsync<T5>,
  fn5: (input: T5) => SyncAsync<O>,
): SyncAsync<O>

export function syncAsync(
  fn: () => SyncAsync<unknown>,
  ...fns: Array<(input: unknown) => SyncAsync<unknown>>
): SyncAsync<unknown> {
  let value = fn()
  for (const fnEntry of fns) {
    if (value instanceof Promise) {
      value = value.then(fnEntry)
    } else {
      value = fnEntry(value)
    }
  }
  return value
}
