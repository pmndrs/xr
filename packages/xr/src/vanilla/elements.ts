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
import { CombinedPointer, GetCamera } from '@pmndrs/pointer-events'
import { setupSyncIsVisible } from '../visible.js'

export function setupSyncXRElements(
  scene: Object3D,
  getCamera: GetCamera,
  store: XRStore<XRElementImplementations>,
  target: Object3D,
  updatesList: XRUpdatesList,
): () => void {
  const combined = new CombinedPointer(true)
  const onFrame = () => combined.move(scene, { timeStamp: performance.now() })
  updatesList.push(onFrame)
  setupSyncIsVisible(store, (visible) => combined.setEnabled(visible, { timeStamp: performance.now() }))
  const inputGroup = new Group()
  const syncControllers = setupSyncInputSourceElements(
    createDefaultXRController,
    scene,
    getCamera,
    store,
    'controller',
    inputGroup,
    updatesList,
    combined,
  )
  const syncGazes = setupSyncInputSourceElements(
    createDefaultXRGaze,
    scene,
    getCamera,
    store,
    'gaze',
    inputGroup,
    updatesList,
    combined,
  )
  const syncHands = setupSyncInputSourceElements(
    createDefaultXRHand,
    scene,
    getCamera,
    store,
    'hand',
    inputGroup,
    updatesList,
    combined,
  )
  const syncScreenInputs = setupSyncInputSourceElements(
    createDefaultXRScreenInput,
    scene,
    getCamera,
    store,
    'screenInput',
    inputGroup,
    updatesList,
    combined,
  )
  const syncTransientPointers = setupSyncInputSourceElements(
    createDefaultXRTransientPointer,
    scene,
    getCamera,
    store,
    'transientPointer',
    inputGroup,
    updatesList,
    combined,
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
    const index = updatesList.indexOf(onFrame)
    if (index === -1) {
      return
    }
    updatesList.splice(index, 1)
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
    getCamera: GetCamera,
    space: Object3D,
    state: any,
    session: XRSession,
    options: any,
    combined: CombinedPointer,
  ) => void,
  scene: Object3D,
  getCamera: GetCamera,
  store: XRStore<XRElementImplementations>,
  key: K,
  target: Object3D,
  updatesList: XRUpdatesList,
  combined: CombinedPointer,
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
      const spaceObject = new XRSpace(state.inputSource.targetRaySpace)
      target.add(spaceObject)
      const customCleanup =
        typeof implementation === 'object'
          ? defaultCreate(scene, getCamera, spaceObject, state, session, implementation, combined)
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
