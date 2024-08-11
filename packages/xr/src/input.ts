import { Object3D } from 'three'
import {
  XRControllerLayoutLoader,
  createXRControllerState,
  type XRControllerGamepadState,
  type XRControllerLayout,
  type XRControllerLayoutLoaderOptions,
} from './controller/index.js'
import {
  type XRHandInputSource,
  type XRHandLoaderOptions,
  type XRHandPoseState,
  createXRHandState,
} from './hand/index.js'

export type XRInputSourceStates = ReadonlyArray<XRInputSourceState>

export type XRInputSourceState = XRInputSourceStateMap[keyof XRInputSourceStateMap]

export function isXRInputSourceState(val: unknown): val is XRInputSourceState {
  return val != null && typeof val === 'object' && 'inputSource' in val
}

export type XRHandState = {
  id: string
  type: 'hand'
  isPrimary: boolean
  inputSource: XRHandInputSource
  events: ReadonlyArray<XRInputSourceEvent>
  pose: XRHandPoseState
  assetPath: string
  object?: Object3D
}

export type XRControllerState = {
  id: string
  type: 'controller'
  isPrimary: boolean
  inputSource: XRInputSource
  events: ReadonlyArray<XRInputSourceEvent>
  gamepad: XRControllerGamepadState
  layout: XRControllerLayout
  object?: Object3D
}

export type XRTransientPointerState = {
  id: string
  type: 'transientPointer'
  isPrimary: boolean
  inputSource: XRInputSource
  events: ReadonlyArray<XRInputSourceEvent>
}

export type XRGazeState = {
  id: string
  type: 'gaze'
  isPrimary: boolean
  inputSource: XRInputSource
  events: ReadonlyArray<XRInputSourceEvent>
}

export type XRScreenInputState = {
  id: string
  type: 'screenInput'
  isPrimary: boolean
  inputSource: XRInputSource
  events: ReadonlyArray<XRInputSourceEvent>
}

export type XRInputSourceStateMap = {
  hand: XRHandState
  controller: XRControllerState
  transientPointer: XRTransientPointerState
  gaze: XRGazeState
  screenInput: XRScreenInputState
}

function setupEvents(session: XRSession, events: Array<XRInputSourceEvent>): () => void {
  const listener = (e: XRInputSourceEvent) => events.push(e)
  session.addEventListener('selectstart', listener)
  session.addEventListener('selectend', listener)
  session.addEventListener('select', listener)
  session.addEventListener('squeeze', listener)
  session.addEventListener('squeezestart', listener)
  session.addEventListener('squeezeend', listener)
  return () => {
    session.removeEventListener('selectstart', listener)
    session.removeEventListener('selectend', listener)
    session.removeEventListener('select', listener)
    session.removeEventListener('squeeze', listener)
    session.removeEventListener('squeezestart', listener)
    session.removeEventListener('squeezeend', listener)
  }
}

let idCounter = 0

export function createSyncXRInputSourceStates(
  addController: (controllerState: XRControllerState) => void,
  options: (XRControllerLayoutLoaderOptions & XRHandLoaderOptions) | undefined,
) {
  const cleanupMap = new Map<XRInputSource, () => void>()
  const controllerLayoutLoader = new XRControllerLayoutLoader(options)
  const idMap = new Map<string, string>()
  return (
    session: XRSession,
    current: ReadonlyArray<XRInputSourceState>,
    changes:
      | Array<{
          isPrimary: boolean
          added?: XRInputSourceArray | ReadonlyArray<XRInputSource>
          removed?: XRInputSourceArray | ReadonlyArray<XRInputSource>
        }>
      | 'remove-all',
  ): ReadonlyArray<XRInputSourceState> => {
    console.log(...changes)

    if (changes === 'remove-all') {
      for (const cleanup of cleanupMap.values()) {
        cleanup()
      }
      return current
    }

    const target = [...current]

    for (const { added, isPrimary, removed } of changes) {
      if (removed != null) {
        for (const inputSource of removed) {
          const index = target.findIndex(({ inputSource: is, isPrimary: ip }) => ip === isPrimary && is === inputSource)
          if (index === -1) {
            continue
          }
          target.splice(index, 1)
          cleanupMap.get(inputSource)?.()
          cleanupMap.delete(inputSource)
        }
      }

      if (added == null) {
        continue
      }

      for (const inputSource of added) {
        const events: Array<XRInputSourceEvent> = []
        let cleanup = setupEvents(session, events)
        const key = `${inputSource.handedness}-${inputSource.hand ? 'hand' : 'nohand'}-${inputSource.targetRayMode}-${inputSource.profiles.join(',')}`
        let id: string | undefined
        if ((id = idMap.get(key)) == null) {
          idMap.set(key, (id = `${idCounter++}`))
        }
        if (inputSource.hand != null) {
          target.push(createXRHandState(id, inputSource, options, events, isPrimary))
        } else {
          switch (inputSource.targetRayMode) {
            case 'gaze':
              target.push({ id, isPrimary, type: 'gaze', inputSource, events })
              break
            case 'screen':
              target.push({ id, isPrimary, type: 'screenInput', inputSource, events })
              break
            case 'transient-pointer':
              target.push({ id, isPrimary, type: 'transientPointer', inputSource, events })
              break
            case 'tracked-pointer':
              let aborted = false
              const cleanupEvents = cleanup
              cleanup = () => {
                cleanupEvents()
                aborted = true
              }
              const stateResult = createXRControllerState(id, inputSource, controllerLayoutLoader, events, isPrimary)
              if (stateResult instanceof Promise) {
                stateResult.then((state) => !aborted && addController(state)).catch(console.error)
              } else {
                target.push(stateResult)
              }
              break
          }
        }
        cleanupMap.set(inputSource, cleanup)
      }
    }

    console.log(target)

    return target
  }
}
