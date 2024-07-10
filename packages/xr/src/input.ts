import {
  XRControllerLayoutLoader,
  XRControllerLayoutLoaderOptions,
  XRControllerState,
  createXRControllerState,
} from './controller/index.js'
import { XRHandLoaderOptions, XRHandState, createXRHandState } from './hand/index.js'

type Mutable<T> = {
  [P in keyof T]: T[P] extends ReadonlyArray<infer K> ? Array<K> : never
}

export type XRInputSourceState = XRInputSourceStateMap[keyof XRInputSourceStateMap]

export function isXRInputSourceState(val: unknown): val is XRInputSourceState {
  return val != null && typeof val === 'object' && 'type' in val
}

export type XRTransientPointerState = {
  type: 'transientPointer'
  inputSource: XRInputSource
  events: ReadonlyArray<XRInputSourceEvent>
}

export type XRGazeState = {
  type: 'gaze'
  inputSource: XRInputSource
}

export type XRScreenInputState = {
  type: 'screenInput'
  inputSource: XRInputSource
}

export type XRInputSourceStates = {
  [Key in keyof XRInputSourceStateMap as `${Key}States`]: ReadonlyArray<XRInputSourceStateMap[Key]>
}

export type XRInputSourceStateMap = {
  hand: XRHandState
  controller: XRControllerState
  transientPointer: XRTransientPointerState
  gaze: XRGazeState
  screenInput: XRScreenInputState
}

function setupXRTransientPointer(
  inputSource: XRInputSource,
  session: XRSession,
): ReturnType<SetupXRInputSource<XRTransientPointerState>> {
  //for the transient pointer we are recording all events to make sure we don't miss events emitted on XRInputSource creation
  const events: Array<XRInputSourceEvent> = []
  const listener = (e: XRInputSourceEvent) => events.push(e)
  session.addEventListener('selectstart', listener)
  session.addEventListener('selectend', listener)
  session.addEventListener('select', listener)
  session.addEventListener('squeeze', listener)
  session.addEventListener('squeezestart', listener)
  session.addEventListener('squeezeend', listener)
  return {
    cleanup() {
      session.removeEventListener('selectstart', listener)
      session.removeEventListener('selectend', listener)
      session.removeEventListener('select', listener)
      session.removeEventListener('squeeze', listener)
      session.removeEventListener('squeezestart', listener)
      session.removeEventListener('squeezeend', listener)
    },
    state: {
      type: 'transientPointer',
      inputSource,
      events,
    },
  }
}

type SetupXRInputSource<State> = (
  session: XRSession,
  inputSource: XRInputSource,
) =>
  | {
      state: State
      cleanup?: () => void
    }
  | Promise<{
      state: State
      cleanup?: () => void
    }>

function getXRInputSourceType(inputSource: XRInputSource): keyof XRInputSourceStateMap {
  if (inputSource.hand != null) {
    return 'hand'
  }
  switch (inputSource.targetRayMode) {
    case 'gaze':
      return 'gaze'
    case 'screen':
      return 'screenInput'
    case 'tracked-pointer':
      return 'controller'
    case 'transient-pointer':
      return 'transientPointer'
  }
}

function createXRInputSourceSetupMap(options: (XRControllerLayoutLoaderOptions & XRHandLoaderOptions) | undefined): {
  [Key in keyof XRInputSourceStateMap]: SetupXRInputSource<XRInputSourceStateMap[Key]>
} {
  const layoutLoader = new XRControllerLayoutLoader(options)
  return {
    controller: async (_session, inputSource) => ({ state: await createXRControllerState(inputSource, layoutLoader) }),
    hand: (_session, inputSource) => ({ state: createXRHandState(inputSource, options) }),
    gaze: (_session, inputSource) => ({ state: { type: 'gaze', inputSource } }),
    screenInput: (_session, inputSource) => ({ state: { type: 'screenInput', inputSource } }),
    transientPointer: (session, inputSource) => setupXRTransientPointer(inputSource, session),
  }
}

export function createSyncXRInputSourceStates(
  addAsyncMap: {
    [Key in keyof XRInputSourceStateMap]?: (state: XRInputSourceStateMap[Key]) => void
  },
  options: (XRControllerLayoutLoaderOptions & XRHandLoaderOptions) | undefined,
) {
  let currentInputSources = new Set<XRInputSource>()
  const setupMap = createXRInputSourceSetupMap(options)
  const cleanupMap = new Map<XRInputSource, () => void>()
  return (
    session: XRSession,
    currentStates: XRInputSourceStates | undefined,
    added: ReadonlyArray<XRInputSource> | XRInputSourceArray | undefined,
    removed: ReadonlyArray<XRInputSource> | XRInputSourceArray | 'all' | undefined,
  ): Partial<XRInputSourceStates> => {
    currentInputSources = new Set(session.inputSources)
    const result: Partial<Mutable<XRInputSourceStates>> = {}
    if (removed === 'all') {
      result.controllerStates = []
      result.gazeStates = []
      result.handStates = []
      result.screenInputStates = []
      result.transientPointerStates = []
      for (const cleanup of cleanupMap.values()) {
        cleanup()
      }
    } else if (removed != null) {
      const removedLength = removed.length
      for (let i = 0; i < removedLength; i++) {
        const inputSource = removed[i]
        const type = getXRInputSourceType(inputSource)
        const states = getOrCreate(`${type}States` as 'controllerStates', result, currentStates)
        const index = states.findIndex(({ inputSource: is }) => is === inputSource)
        if (index === -1) {
          throw new Error(`unable to find removed input source ${inputSource}`)
        }
        states.splice(index, 1)
        cleanupMap.get(inputSource)?.()
        cleanupMap.delete(inputSource)
      }
    }

    if (added != null) {
      added.forEach(async (inputSource) => {
        const type = getXRInputSourceType(inputSource)
        let setupResult = setupMap[type](session, inputSource)
        let resolvedSetupResult: {
          state: any
          cleanup?: (() => void) | undefined
        }
        if (setupResult instanceof Promise) {
          resolvedSetupResult = await setupResult
          //test if the input source is still part of the session (can happen since the state is loaded asynchrounously)
          if (!currentInputSources.has(inputSource)) {
            return
          }
          addAsyncMap[type]!(resolvedSetupResult.state as any)
        } else {
          resolvedSetupResult = setupResult
          getOrCreate(`${type}States` as 'controllerStates', result, currentStates).push(resolvedSetupResult.state)
        }
        if (resolvedSetupResult.cleanup != null) {
          cleanupMap.set(inputSource, resolvedSetupResult.cleanup)
        }
      })
    }
    return result
  }
}

function getOrCreate<K extends string, T>(
  key: K,
  result: Partial<Record<K, Array<T>>>,
  current: Record<K, ReadonlyArray<T>> | undefined,
): Array<T> {
  let states = result[key]
  if (states == null) {
    result[key] = states = current == null ? [] : [...current[key]]
  }
  return states
}
