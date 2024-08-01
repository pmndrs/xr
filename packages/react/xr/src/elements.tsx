import { context, reconciler, useStore, useThree } from '@react-three/fiber'
import { ReactNode, Suspense, useCallback, useMemo } from 'react'
import { xrMeshContext, xrPlaneContext, xrInputSourceStateContext, xrReferenceSpaceContext } from './contexts.js'
import { useXR } from './xr.js'
import { objectToKey } from './utils.js'
import { XRSpace } from './space.js'
import { resolveDetectedImplementation, resolveInputSourceImplementation } from '@pmndrs/xr/internals'
import { useXRSessionVisibilityState } from './hooks.js'
import {
  DefaultXRController,
  DefaultXRGaze,
  DefaultXRHand,
  DefaultXRScreenInput,
  DefaultXRTransientPointer,
} from './default.js'

export function XRElements({ children }: { children?: ReactNode }) {
  const referenceSpace = useXR((xr) => xr.originReferenceSpace)
  const origin = useXR((xr) => xr.origin)
  const visible = useXRSessionVisibilityState() === 'visible'
  const store = useStore()
  const storeWithOriginAsScene = useMemo(
    () =>
      Object.assign({}, store, {
        getState() {
          return { ...store.getState(), scene: origin }
        },
      }),
    [origin, store],
  )
  if (origin == null || referenceSpace == null) {
    return null
  }
  return (
    <>
      {reconciler.createPortal(
        <context.Provider value={store}>
          <xrReferenceSpaceContext.Provider value={referenceSpace}>
            <group matrixAutoUpdate={false} visible={visible}>
              <XRControllers />
              <XRHands />
              <XRTransientPointers />
              <XRGazes />
              <XRScreenInputs />
            </group>
            <XRDetectedMeshes />
            <XRDetectedPlanes />
            {children}
          </xrReferenceSpaceContext.Provider>
        </context.Provider>,
        storeWithOriginAsScene,
        null,
      )}
    </>
  )
}

function XRControllers() {
  const controllerStates = useXR((xr) => xr.controllerStates)
  let Implementation = useXR((xr) => xr.controller)
  if (Implementation === false) {
    return null
  }
  return (
    <>
      {controllerStates.map((state) => {
        const ResolvedImpl = resolveInputSourceImplementation(Implementation, state.inputSource.handedness, {})
        if (ResolvedImpl === false) {
          return null
        }
        return (
          <XRSpace key={objectToKey(state)} space={state.inputSource.gripSpace!}>
            <xrInputSourceStateContext.Provider value={state}>
              <Suspense>
                {typeof ResolvedImpl === 'function' ? <ResolvedImpl /> : <DefaultXRController {...ResolvedImpl} />}
              </Suspense>
            </xrInputSourceStateContext.Provider>
          </XRSpace>
        )
      })}
    </>
  )
}

function XRHands() {
  const handStates = useXR((xr) => xr.handStates)
  const Implementation = useXR((xr) => xr.hand)
  if (Implementation === false) {
    return null
  }
  return (
    <>
      {handStates.map((state) => {
        const ResolvedImpl = resolveInputSourceImplementation(Implementation, state.inputSource.handedness, {})
        if (ResolvedImpl === false) {
          return null
        }
        return (
          <XRSpace key={objectToKey(state)} space={state.inputSource.hand.get('wrist')!}>
            <xrInputSourceStateContext.Provider value={state}>
              <Suspense>
                {typeof ResolvedImpl === 'function' ? <ResolvedImpl /> : <DefaultXRHand {...ResolvedImpl} />}
              </Suspense>
            </xrInputSourceStateContext.Provider>
          </XRSpace>
        )
      })}
    </>
  )
}

function XRTransientPointers() {
  const transientPointerStates = useXR((xr) => xr.transientPointerStates)
  const Implementation = useXR((xr) => xr.transientPointer)
  if (Implementation === false) {
    return null
  }
  return (
    <>
      {transientPointerStates.map((state) => {
        const ResolvedImpl = resolveInputSourceImplementation(Implementation, state.inputSource.handedness, {})
        if (ResolvedImpl === false) {
          return null
        }
        return (
          <XRSpace key={objectToKey(state)} space={state.inputSource.targetRaySpace}>
            <xrInputSourceStateContext.Provider value={state}>
              <Suspense>
                {typeof ResolvedImpl === 'function' ? (
                  <ResolvedImpl />
                ) : (
                  <DefaultXRTransientPointer {...ResolvedImpl} />
                )}
              </Suspense>
            </xrInputSourceStateContext.Provider>
          </XRSpace>
        )
      })}
    </>
  )
}

function XRGazes() {
  const gazeStates = useXR((xr) => xr.gazeStates)
  const Implementation = useXR((xr) => xr.gaze)
  if (Implementation === false) {
    return null
  }
  return (
    <>
      {gazeStates.map((state) => {
        return (
          <XRSpace key={objectToKey(state)} space={state.inputSource.targetRaySpace}>
            <xrInputSourceStateContext.Provider value={state}>
              <Suspense>
                {typeof Implementation === 'function' ? (
                  <Implementation />
                ) : (
                  <DefaultXRGaze {...spreadable(Implementation)} />
                )}
              </Suspense>
            </xrInputSourceStateContext.Provider>
          </XRSpace>
        )
      })}
    </>
  )
}

function XRScreenInputs() {
  const screenInputStates = useXR((xr) => xr.screenInputStates)
  const Implementation = useXR((xr) => xr.screenInput)
  if (Implementation === false) {
    return null
  }
  return (
    <>
      {screenInputStates.map((state) => {
        return (
          <XRSpace key={objectToKey(state)} space={state.inputSource.targetRaySpace}>
            <xrInputSourceStateContext.Provider value={state}>
              <Suspense>
                {typeof Implementation === 'function' ? (
                  <Implementation />
                ) : (
                  <DefaultXRScreenInput {...spreadable(Implementation)} />
                )}
              </Suspense>
            </xrInputSourceStateContext.Provider>
          </XRSpace>
        )
      })}
    </>
  )
}

function spreadable<T>(value: true | T): T | undefined {
  if (value === true) {
    return undefined
  }
  return value
}

function XRDetectedMeshes() {
  const meshes = useXR((xr) => xr.detectedMeshes)
  const Implementation = useXR((xr) => xr.detectedMesh)
  if (Implementation === false) {
    return
  }
  return (
    <>
      {meshes.map((mesh) => {
        const ResolvedImpl = resolveDetectedImplementation(Implementation, mesh.semanticLabel, false)
        if (ResolvedImpl === false) {
          return null
        }
        return (
          <XRSpace key={objectToKey(mesh)} space={mesh.meshSpace}>
            <xrMeshContext.Provider value={mesh}>
              <Suspense>
                <ResolvedImpl />
              </Suspense>
            </xrMeshContext.Provider>
          </XRSpace>
        )
      })}
    </>
  )
}

function XRDetectedPlanes() {
  const planes = useXR((xr) => xr.detectedPlanes)
  const Implementation = useXR((xr) => xr.detectedPlane)
  if (Implementation == null) {
    return
  }
  return (
    <>
      {planes.map((plane) => {
        const ResolvedImpl = resolveDetectedImplementation(Implementation, plane.semanticLabel, false)
        if (ResolvedImpl === false) {
          return null
        }
        return (
          <XRSpace key={objectToKey(plane)} space={plane.planeSpace}>
            <xrPlaneContext.Provider value={plane}>
              <Suspense>
                <ResolvedImpl />
              </Suspense>
            </xrPlaneContext.Provider>
          </XRSpace>
        )
      })}
    </>
  )
}
