import { Group, Object3D } from 'three'
import { XRElementImplementations, XRUpdatesList } from './xr.js'
import { XRInputSourceState, XRInputSourceStateMap } from '../input.js'
import { WithRecord, XRStore, resolveInputSourceImplementation } from '../store.js'
import { XRSpace } from './space.js'
import {
  createDefaultXRController,
  createDefaultXRGaze,
  createDefaultXRHand,
  createDefaultXRScreenInput,
  createDefaultXRTransientPointer,
} from './default.js'
import { XRSpaceType } from './types.js'

export function setupSyncXRElements(
  scene: Object3D,
  store: XRStore<XRElementImplementations>,
  target: Object3D,
  updatesList: XRUpdatesList,
): () => void {
  const inputGroup = new Group()
  const syncControllers = setupSyncInputSourceElements(
    createDefaultXRController,
    scene,
    store,
    'controller',
    inputGroup,
    updatesList,
  )
  const syncGazes = setupSyncInputSourceElements(createDefaultXRGaze, scene, store, 'gaze', inputGroup, updatesList)
  const syncHands = setupSyncInputSourceElements(createDefaultXRHand, scene, store, 'hand', inputGroup, updatesList)
  const syncScreenInputs = setupSyncInputSourceElements(
    createDefaultXRScreenInput,
    scene,
    store,
    'screenInput',
    inputGroup,
    updatesList,
  )
  const syncTransientPointers = setupSyncInputSourceElements(
    createDefaultXRTransientPointer,
    scene,
    store,
    'transientPointer',
    inputGroup,
    updatesList,
  )
  const unsubscribe = store.subscribe((s, prev) => {
    inputGroup.visible = s.visibilityState === 'visible'
    syncControllers(s.session, s.inputSourceStates, prev.inputSourceStates, s.controller, prev.controller)
    syncGazes(s.session, s.inputSourceStates, prev.inputSourceStates, s.gaze, prev.gaze)
    syncHands(s.session, s.inputSourceStates, prev.inputSourceStates, s.hand, prev.hand)
    syncScreenInputs(s.session, s.inputSourceStates, prev.inputSourceStates, s.screenInput, prev.screenInput)
    syncTransientPointers(
      s.session,
      s.inputSourceStates,
      prev.inputSourceStates,
      s.transientPointer,
      prev.transientPointer,
    )
  })
  target.add(inputGroup)
  return () => {
    target.remove(inputGroup)
    unsubscribe()
    syncControllers(undefined, [], [], false, false)
    syncGazes(undefined, [], [], false, false)
    syncHands(undefined, [], [], false, false)
    syncScreenInputs(undefined, [], [], false, false)
    syncTransientPointers(undefined, [], [], false, false)
  }
}

function setupSyncInputSourceElements<K extends keyof XRInputSourceStateMap>(
  defaultCreate: (
    scene: Object3D,
    store: XRStore<XRElementImplementations>,
    space: Object3D,
    state: any,
    session: XRSession,
    options?: any,
  ) => void,
  scene: Object3D,
  store: XRStore<XRElementImplementations>,
  key: K,
  target: Object3D,
  updatesList: XRUpdatesList,
) {
  return setupSync<K, WithRecord<XRElementImplementations>[K]>(key, (session, state, implementationInfo) =>
    runInXRUpdatesListContext(updatesList, () => {
      const implementation = resolveInputSourceImplementation(
        implementationInfo as WithRecord<XRElementImplementations>['controller'],
        state.inputSource.handedness,
        {},
      )
      if (implementation === false) {
        return
      }
      const spaceObject = new XRSpace(getSpace(key, state.inputSource))
      target.add(spaceObject)
      const customCleanup =
        typeof implementation === 'object'
          ? defaultCreate(scene, store, spaceObject, state, session, implementation)
          : implementation?.(store, spaceObject, state as any, session)
      return () => {
        target.remove(spaceObject)
        customCleanup?.()
      }
    }),
  )
}

function setupSync<K extends keyof XRInputSourceStateMap, I>(
  key: K,
  create: (session: XRSession, value: XRInputSourceStateMap[K], impl: I) => () => void,
) {
  let cleanupMap = new Map<XRInputSourceStateMap[K], (() => void) | undefined>()
  return (
    session: XRSession | undefined,
    values: ReadonlyArray<XRInputSourceState>,
    prevValues: ReadonlyArray<XRInputSourceState>,
    impl: I,
    prevImpl: I,
  ) => {
    if (values === prevValues && impl === prevImpl) {
      return
    }
    if (impl != prevImpl) {
      cleanup(cleanupMap)
    }
    const newCleanupMap = new Map<XRInputSourceStateMap[K], (() => void) | undefined>()
    const valuesLength = values.length
    if (session != null) {
      for (let i = 0; i < valuesLength; i++) {
        const value = values[i]
        if (value.type != key) {
          continue
        }
        let cleanup = cleanupMap.get(value as XRInputSourceStateMap[K])
        const wasCreated = cleanupMap.delete(value as XRInputSourceStateMap[K])
        if (!wasCreated) {
          cleanup = create(session, value as XRInputSourceStateMap[K], impl)
        }
        newCleanupMap.set(value as XRInputSourceStateMap[K], cleanup)
      }
    }
    cleanup(cleanupMap)
    cleanupMap = newCleanupMap
  }
}

function cleanup(map: Map<unknown, (() => void) | undefined>) {
  for (const cleanup of map.values()) {
    cleanup?.()
  }
  map.clear()
}

function getSpace(type: keyof XRInputSourceStateMap, inputSource: XRInputSource): XRSpaceType {
  switch (type) {
    case 'controller':
      return inputSource.gripSpace!
    case 'hand':
      return inputSource.hand!.get('wrist')!
    case 'gaze':
    case 'screenInput':
    case 'transientPointer':
      return inputSource.targetRaySpace
  }
}

export let xrUpdatesListContext: XRUpdatesList | undefined

function runInXRUpdatesListContext<T>(updatesList: XRUpdatesList, fn: () => (() => void) | undefined | void) {
  const innerUpdatesList: XRUpdatesList = []
  const update: XRUpdatesList[number] = (frame, delta) => {
    const length = innerUpdatesList.length
    for (let i = 0; i < length; i++) {
      innerUpdatesList[i](frame, delta)
    }
  }
  updatesList.push(update)
  const prev = xrUpdatesListContext
  xrUpdatesListContext = innerUpdatesList
  const cleanup = fn()
  xrUpdatesListContext = prev
  return () => {
    cleanup?.()
    const index = updatesList.indexOf(update)
    if (index === -1) {
      return
    }
    updatesList.splice(index, 1)
  }
}
