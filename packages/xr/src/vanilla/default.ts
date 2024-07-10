import { Group, Object3D } from 'three'
import { XRHandState } from '../hand/index.js'
import {
  bindPointerXRSessionEvent,
  defaultGrabPointerOpacity,
  defaultRayPointerOpacity,
  defaultTouchPointerOpacity,
} from '../pointer/index.js'
import { PointerRayModel, PointerCursorModel } from './pointer.js'
import { GetXRSpace } from '../space.js'
import { XRSpace } from './space.js'
import { XRHandModel } from './hand.js'
import {
  buildTeleportTargetFilter,
  createTeleportRayLine,
  DefaultXRInputSourceTeleportPointerOptions,
  syncTeleportPointerRayGroup,
  TeleportPointerRayModel,
  XRControllerState,
  XRStore,
} from '../internals.js'
import { XRControllerModel } from './controller.js'
import { XRInputSourceState, XRTransientPointerState } from '../input.js'
import { XRElementImplementations } from './xr.js'
import { setupSyncIsVisible } from '../visible.js'
import {
  DefaultXRControllerOptions,
  DefaultXRGazeOptions,
  DefaultXRHandOptions,
  DefaultXRHandTouchPointerOptions,
  DefaultXRInputSourceGrabPointerOptions,
  DefaultXRInputSourceRayPointerOptions,
  DefaultXRScreenInputOptions,
  DefaultXRTransientPointerOptions,
} from '../default.js'
import {
  CombinedPointer,
  Pointer,
  createGrabPointer,
  createRayPointer,
  createTouchPointer,
} from '@pmndrs/pointer-events'
import { onXRFrame } from './utils.js'

export function createDefaultXRInputSourceRayPointer(
  scene: Object3D,
  store: XRStore<XRElementImplementations>,
  space: Object3D,
  state: XRInputSourceState,
  session: XRSession,
  options?: DefaultXRInputSourceRayPointerOptions,
  combined?: CombinedPointer,
  makeDefault?: boolean,
) {
  //the space must be created before the pointer to make sure that the space is updated before the pointer
  const raySpace = new XRSpace(() => state.inputSource.targetRaySpace)
  const pointer = createRayPointer({ current: raySpace }, state, options)
  const cleanupPointer = setupPointer(scene, store, pointer, combined, makeDefault)
  const unbind = bindPointerXRSessionEvent(pointer, session, state.inputSource, 'select')
  space.add(raySpace)
  let undoAddRayModel: (() => void) | undefined
  const { rayModel: rayModelOptions = true, cursorModel: cursorModelOptions = true } = options ?? {}
  if (rayModelOptions !== false) {
    const rayModel = new PointerRayModel(pointer, { opacity: defaultRayPointerOpacity, ...spreadable(rayModelOptions) })
    raySpace.add(rayModel)
    undoAddRayModel = () => raySpace.remove(rayModel)
  }
  let undoAddCursorModel: (() => void) | undefined
  if (cursorModelOptions !== false) {
    const cursorModel = new PointerCursorModel(pointer, {
      opacity: defaultRayPointerOpacity,
      ...spreadable(cursorModelOptions),
    })
    scene.add(cursorModel)
    undoAddCursorModel = () => scene.remove(cursorModel)
  }
  return () => {
    pointer.exit({ timeStamp: performance.now() })
    space.remove(raySpace)
    undoAddRayModel?.()
    undoAddCursorModel?.()
    unbind()
    cleanupPointer()
  }
}

export function createDefaultXRInputSourceTeleportPointer(
  scene: Object3D,
  store: XRStore<XRElementImplementations>,
  space: Object3D,
  state: XRInputSourceState,
  session: XRSession,
  options?: DefaultXRInputSourceTeleportPointerOptions,
  combined?: CombinedPointer,
  makeDefault?: boolean,
) {
  //the space must be created before the pointer to make sure that the space is updated before the pointer
  const raySpace = new XRSpace(() => state.inputSource.targetRaySpace)
  space.add(raySpace)

  const teleportPointerRayGroup = new Group()
  scene.add(teleportPointerRayGroup)
  onXRFrame((_, delta) => syncTeleportPointerRayGroup(raySpace, teleportPointerRayGroup, delta))

  const linePoints = createTeleportRayLine()
  const pointer = createRayPointer(
    { current: teleportPointerRayGroup },
    state,
    { ...options, customFilter: buildTeleportTargetFilter(options), linePoints },
    'teleport',
  )
  const cleanupPointer = setupPointer(scene, store, pointer, combined, makeDefault)
  const unbind = bindPointerXRSessionEvent(pointer, session, state.inputSource, 'select')
  let undoAddRayModel: (() => void) | undefined
  const { rayModel: rayModelOptions = true, cursorModel: cursorModelOptions = true } = options ?? {}
  if (rayModelOptions !== false) {
    const rayModel = new TeleportPointerRayModel(linePoints)
    rayModel.options = { opacity: defaultRayPointerOpacity, ...spreadable(rayModelOptions) }
    onXRFrame(() => rayModel.update(pointer))
    teleportPointerRayGroup.add(rayModel)
    undoAddRayModel = () => teleportPointerRayGroup.remove(rayModel)
  }
  let undoAddCursorModel: (() => void) | undefined
  if (cursorModelOptions !== false) {
    const cursorModel = new PointerCursorModel(pointer, {
      opacity: defaultRayPointerOpacity,
      ...spreadable(cursorModelOptions),
    })
    onXRFrame(() => (cursorModel.visible = pointer.getEnabled() && pointer.getButtonsDown().size > 0))
    scene.add(cursorModel)
    undoAddCursorModel = () => scene.remove(cursorModel)
  }
  return () => {
    pointer.exit({ timeStamp: performance.now() })
    space.remove(raySpace)
    scene.add(teleportPointerRayGroup)
    undoAddRayModel?.()
    undoAddCursorModel?.()
    unbind()
    cleanupPointer()
  }
}

function setupPointer(
  scene: Object3D,
  store: XRStore<XRElementImplementations>,
  pointer: Pointer,
  combined: CombinedPointer | undefined,
  makeDefault: boolean | undefined,
) {
  if (combined != null) {
    return combined?.register(pointer, makeDefault ?? false)
  }
  onXRFrame(() => pointer.move(scene, { timeStamp: performance.now() }))
  return setupSyncIsVisible(store, (visible) => pointer.setEnabled(visible, { timeStamp: performance.now() }))
}

export function createDefaultXRInputSourceGrabPointer(
  scene: Object3D,
  store: XRStore<XRElementImplementations>,
  space: Object3D,
  state: { inputSource: XRInputSource },
  gripSpace: GetXRSpace,
  session: XRSession,
  event: 'select' | 'squeeze',
  options?: DefaultXRInputSourceGrabPointerOptions,
  combined?: CombinedPointer,
  makeDefault?: boolean,
) {
  //the space must be created before the pointer to make sure that the space is updated before the pointer
  const gripSpaceObject = new XRSpace(gripSpace)
  const pointer = createGrabPointer({ current: gripSpaceObject }, state, options)
  const cleanupPointer = setupPointer(scene, store, pointer, combined, makeDefault)
  const unbind = bindPointerXRSessionEvent(pointer, session, state.inputSource, event)
  space.add(gripSpaceObject)

  let undoAddCursorModel: (() => void) | undefined
  if (options?.cursorModel !== false) {
    const cursorModel = new PointerCursorModel(pointer, {
      opacity: defaultGrabPointerOpacity,
    })
    scene.add(cursorModel)
    undoAddCursorModel = () => scene.remove(cursorModel)
  }
  return () => {
    cleanupPointer()
    pointer.exit({ timeStamp: performance.now() })
    space.remove(gripSpaceObject)
    undoAddCursorModel?.()
    unbind()
  }
}

export function createDefaultXRHandTouchPointer(
  scene: Object3D,
  store: XRStore<XRElementImplementations>,
  space: Object3D,
  state: XRHandState,
  options?: DefaultXRHandTouchPointerOptions,
  combined?: CombinedPointer,
  makeDefault?: boolean,
) {
  //the space must be created before the pointer to make sure that the space is updated before the pointer
  const touchSpaceObject = new XRSpace(() => state.inputSource.hand.get('index-finger-tip'))
  const pointer = createTouchPointer({ current: touchSpaceObject }, state, options)
  const cleanupPointer = setupPointer(scene, store, pointer, combined, makeDefault)
  space.add(touchSpaceObject)
  let undoAddCursorModel: (() => void) | undefined
  const { cursorModel: cursorModelOptions = true } = options ?? {}
  if (cursorModelOptions !== false) {
    const cursorModel = new PointerCursorModel(pointer, {
      opacity: defaultTouchPointerOpacity,
      ...spreadable(cursorModelOptions),
    })
    scene.add(cursorModel)
    undoAddCursorModel = () => scene.remove(cursorModel)
  }
  return () => {
    cleanupPointer()
    pointer.exit({ timeStamp: performance.now() })
    space.remove(touchSpaceObject)
    undoAddCursorModel?.()
  }
}

export function createDefaultXRHand(
  scene: Object3D,
  store: XRStore<XRElementImplementations>,
  space: Object3D,
  state: XRHandState,
  session: XRSession,
  {
    grabPointer: grabPointerOptions = true,
    rayPointer: rayPointerOptions = true,
    teleportPointer: teleportPointerOptions = false,
    model: modelOptions = true,
    touchPointer: touchPointerOptions = true,
  }: DefaultXRHandOptions = {},
): () => void {
  const combined = new CombinedPointer()
  onXRFrame(() => combined.move(scene, { timeStamp: performance.now() }))
  setupSyncIsVisible(store, (visible) => combined.setEnabled(visible, { timeStamp: performance.now() }))

  let destroyRayPointer: (() => void) | undefined
  if (rayPointerOptions !== false) {
    const rayPointerRayModelOptions = spreadable(rayPointerOptions)?.rayModel
    destroyRayPointer = createDefaultXRInputSourceRayPointer(
      scene,
      store,
      space,
      state,
      session,
      {
        minDistance: 0.2,
        ...spreadable(rayPointerOptions),
        rayModel:
          rayPointerRayModelOptions === false
            ? false
            : {
                maxLength: 0.2,
                ...spreadable(rayPointerRayModelOptions),
              },
      },
      combined,
      true,
    )
  }
  const destroyTeleportPointer =
    teleportPointerOptions === false
      ? undefined
      : createDefaultXRInputSourceTeleportPointer(
          scene,
          store,
          space,
          state,
          session,
          spreadable(teleportPointerOptions),
          combined,
        )
  const destroyGrabPointer =
    grabPointerOptions === false
      ? undefined
      : createDefaultXRInputSourceGrabPointer(
          scene,
          store,
          space,
          state,
          () => state.inputSource.hand.get('index-finger-tip'),
          session,
          'select',
          spreadable(grabPointerOptions),
          combined,
        )
  const destroyTouchPointer =
    touchPointerOptions === false
      ? undefined
      : createDefaultXRHandTouchPointer(scene, store, space, state, spreadable(touchPointerOptions), combined)
  let removeModel: (() => void) | undefined
  if (modelOptions !== false) {
    const model = new XRHandModel(state.inputSource.hand, state.assetPath, spreadable(modelOptions))
    space.add(model)
    removeModel = () => space.remove(model)
  }
  return () => {
    destroyRayPointer?.()
    destroyGrabPointer?.()
    destroyTouchPointer?.()
    destroyTeleportPointer?.()
    removeModel?.()
  }
}

export function createDefaultXRController(
  scene: Object3D,
  store: XRStore<XRElementImplementations>,
  space: Object3D,
  state: XRControllerState,
  session: XRSession,
  {
    rayPointer: rayPointerOptions = true,
    teleportPointer: teleportPointerOptions = true,
    grabPointer: grabPointerOptions = true,
    model: modelOptions = true,
  }: DefaultXRControllerOptions = {},
): () => void {
  const combined = new CombinedPointer()
  onXRFrame(() => combined.move(scene, { timeStamp: performance.now() }))
  setupSyncIsVisible(store, (visible) => combined.setEnabled(visible, { timeStamp: performance.now() }))
  const destroyRayPointer =
    rayPointerOptions === false
      ? undefined
      : createDefaultXRInputSourceRayPointer(
          scene,
          store,
          space,
          state,
          session,
          { minDistance: 0.2, ...spreadable(rayPointerOptions) },
          combined,
          true,
        )

  const destroyTeleportPointer =
    teleportPointerOptions === false
      ? undefined
      : createDefaultXRInputSourceTeleportPointer(
          scene,
          store,
          space,
          state,
          session,
          spreadable(teleportPointerOptions),
          combined,
        )
  const destroyGrabPointer =
    grabPointerOptions === false
      ? undefined
      : createDefaultXRInputSourceGrabPointer(
          scene,
          store,
          space,
          state,
          () => state.inputSource.gripSpace,
          session,
          'squeeze',
          spreadable(grabPointerOptions),
          combined,
        )

  let removeModel: (() => void) | undefined
  if (modelOptions !== false) {
    const model = new XRControllerModel(state.layout, state.gamepad, spreadable(modelOptions))
    space.add(model)
    removeModel = () => space.remove(model)
  }
  return () => {
    destroyTeleportPointer?.()
    destroyRayPointer?.()
    destroyGrabPointer?.()
    removeModel?.()
  }
}

export function createDefaultXRTransientPointer(
  scene: Object3D,
  store: XRStore<XRElementImplementations>,
  space: Object3D,
  state: XRTransientPointerState,
  session: XRSession,
  options?: DefaultXRTransientPointerOptions,
  combined?: CombinedPointer,
  makeDefault?: boolean,
): () => void {
  //the space must be created before the pointer to make sure that the space is updated before the pointer
  const raySpace = new XRSpace(() => state.inputSource.targetRaySpace)
  const pointer = createRayPointer({ current: raySpace }, state, options)
  const cleanupPointer = setupPointer(scene, store, pointer, combined, makeDefault)
  const unbind = bindPointerXRSessionEvent(pointer, session, state.inputSource, 'select')
  space.add(raySpace)
  let undoAddCursorModel: (() => void) | undefined
  const { cursorModel: cursorModelOptions = true } = options ?? {}
  if (cursorModelOptions !== false) {
    const cursorModel = new PointerCursorModel(pointer, {
      opacity: defaultRayPointerOpacity,
      ...spreadable(cursorModelOptions),
    })
    scene.add(cursorModel)
    undoAddCursorModel = () => scene.remove(cursorModel)
  }
  return () => {
    cleanupPointer()
    pointer.exit({ timeStamp: performance.now() })
    space.remove(raySpace)
    undoAddCursorModel?.()
    unbind()
  }
}

export function createDefaultXRGaze(
  scene: Object3D,
  store: XRStore<XRElementImplementations>,
  space: Object3D,
  state: XRInputSourceState,
  session: XRSession,
  options?: DefaultXRGazeOptions,
): () => void {
  //the space must be created before the pointer to make sure that the space is updated before the pointer
  const raySpace = new XRSpace(() => state.inputSource.targetRaySpace)
  const pointer = createRayPointer({ current: raySpace }, state, options)
  const cleanupPointer = setupPointer(scene, store, pointer, undefined, undefined)
  const unbind = bindPointerXRSessionEvent(pointer, session, state.inputSource, 'select')
  space.add(raySpace)
  let undoAddCursorModel: (() => void) | undefined
  const { cursorModel: cursorModelOptions = true } = options ?? {}
  if (cursorModelOptions !== false) {
    const cursorModel = new PointerCursorModel(pointer, {
      opacity: defaultRayPointerOpacity,
      ...spreadable(cursorModelOptions),
    })
    scene.add(cursorModel)
    undoAddCursorModel = () => scene.remove(cursorModel)
  }
  return () => {
    cleanupPointer()
    pointer.exit({ timeStamp: performance.now() })
    space.remove(raySpace)
    undoAddCursorModel?.()
    unbind()
  }
}

export function createDefaultXRScreenInput(
  scene: Object3D,
  store: XRStore<XRElementImplementations>,
  space: Object3D,
  state: XRInputSourceState,
  session: XRSession,
  options?: DefaultXRScreenInputOptions,
): () => void {
  //the space must be created before the pointer to make sure that the space is updated before the pointer
  const raySpace = new XRSpace(() => state.inputSource.targetRaySpace)
  const pointer = createRayPointer({ current: raySpace }, state, options)
  const cleanupPointer = setupPointer(scene, store, pointer, undefined, undefined)
  const unbind = bindPointerXRSessionEvent(pointer, session, state.inputSource, 'select')
  space.add(raySpace)
  return () => {
    cleanupPointer()
    space.remove(raySpace)
    pointer.exit({ timeStamp: performance.now() })
    unbind()
  }
}

function spreadable<T>(value: true | T): T | undefined {
  if (value === true) {
    return undefined
  }
  return value
}
