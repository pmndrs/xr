import { Group, Object3D } from 'three'
import { XRElementImplementations, XRUpdatesList } from './xr.js'
import { XRInputSourceStateMap } from '../input.js'
import { WithRecord, XRStore, resolveDetectedImplementation, resolveInputSourceImplementation } from '../store.js'
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
  const syncDetectedPlanes = setupSyncDetectedElements<XRPlane>(store, (state) => state.planeSpace, target, updatesList)
  const syncDetectedMeshes = setupSyncDetectedElements<XRMesh>(store, (state) => state.meshSpace, target, updatesList)
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
    syncDetectedPlanes(s.session, s.detectedPlanes, prev.detectedPlanes, s.detectedPlane, prev.detectedPlane)
    syncDetectedMeshes(s.session, s.detectedMeshes, prev.detectedMeshes, s.detectedMesh, prev.detectedMesh)
    syncControllers(s.session, s.controllerStates, prev.controllerStates, s.controller, prev.controller)
    syncGazes(s.session, s.gazeStates, prev.gazeStates, s.gaze, prev.gaze)
    syncHands(s.session, s.handStates, prev.handStates, s.hand, prev.hand)
    syncScreenInputs(s.session, s.screenInputStates, prev.screenInputStates, s.screenInput, prev.screenInput)
    syncTransientPointers(
      s.session,
      s.transientPointerStates,
      prev.transientPointerStates,
      s.transientPointer,
      prev.transientPointer,
    )
  })
  target.add(inputGroup)
  return () => {
    target.remove(inputGroup)
    unsubscribe()
    syncDetectedPlanes(undefined, [], [], false, false)
    syncDetectedMeshes(undefined, [], [], false, false)
    syncControllers(undefined, [], [], false, false)
    syncGazes(undefined, [], [], false, false)
    syncHands(undefined, [], [], false, false)
    syncScreenInputs(undefined, [], [], false, false)
    syncTransientPointers(undefined, [], [], false, false)
  }
}

function setupSyncDetectedElements<S extends XRMesh | XRPlane>(
  store: XRStore<XRElementImplementations>,
  getSpace: (state: S) => XRSpaceType,
  target: Object3D,
  updatesList: XRUpdatesList,
) {
  return setupSync<S, WithRecord<XRElementImplementations>['detectedMesh' | 'detectedPlane']>(
    (session, state, implementationInfo) =>
      runInXRUpdatesListContext(updatesList, () => {
        const implementation = resolveDetectedImplementation(implementationInfo, state.semanticLabel, false)
        if (implementation === false) {
          return
        }
        const spaceObject = new XRSpace(getSpace(state))
        target.add(spaceObject)
        const customCleanup = implementation?.(store, spaceObject, state as any, session)
        return () => {
          target.remove(spaceObject)
          customCleanup?.()
        }
      }),
  )
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
  return setupSync<XRInputSourceStateMap[K], WithRecord<XRElementImplementations>[K]>(
    (session, state, implementationInfo) =>
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

function setupSync<T, I>(create: (session: XRSession, value: T, impl: I) => () => void) {
  let cleanupMap = new Map<T, (() => void) | undefined>()
  return (
    session: XRSession | undefined,
    values: ReadonlyArray<T>,
    prevValues: ReadonlyArray<T>,
    impl: I,
    prevImpl: I,
  ) => {
    if (values === prevValues && impl === prevImpl) {
      return
    }
    if (impl != prevImpl) {
      cleanup(cleanupMap)
    }
    const newCleanupMap = new Map<T, (() => void) | undefined>()
    const valuesLength = values.length
    if (session != null) {
      for (let i = 0; i < valuesLength; i++) {
        const value = values[i]
        let cleanup = cleanupMap.get(value)
        const wasCreated = cleanupMap.delete(value)
        if (!wasCreated) {
          cleanup = create(session, value, impl)
        }
        newCleanupMap.set(value, cleanup)
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
