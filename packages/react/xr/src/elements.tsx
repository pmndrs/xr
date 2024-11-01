import { context, reconciler, useStore } from '@react-three/fiber'
import { ReactNode, Suspense, useMemo } from 'react'
import { xrInputSourceStateContext, xrSpaceContext } from './contexts.js'
import { useXR } from './xr.js'
import { objectToKey } from './utils.js'
import { XRSpace } from './space.js'
import { resolveInputSourceImplementation } from '@pmndrs/xr/internals'
import { useXRSessionVisibilityState } from './hooks.js'
import {
  DefaultXRController,
  DefaultXRGaze,
  DefaultXRHand,
  DefaultXRScreenInput,
  DefaultXRTransientPointer,
} from './default.js'
import { shallow } from 'zustand/shallow'

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
          <xrSpaceContext.Provider value={referenceSpace}>
            <group matrixAutoUpdate={false} visible={visible}>
              <XRControllers />
              <XRHands />
              <XRTransientPointers />
              <XRGazes />
              <XRScreenInputs />
            </group>
            {children}
          </xrSpaceContext.Provider>
        </context.Provider>,
        storeWithOriginAsScene,
        null,
      )}
    </>
  )
}

function XRControllers() {
  const controllerStates = useXR((xr) => xr.inputSourceStates.filter((state) => state.type === 'controller'), shallow)
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
          <xrInputSourceStateContext.Provider key={state.id} value={state}>
            <XRSpace space="target-ray-space">
              <Suspense>
                {typeof ResolvedImpl === 'function' ? <ResolvedImpl /> : <DefaultXRController {...ResolvedImpl} />}
              </Suspense>
            </XRSpace>
          </xrInputSourceStateContext.Provider>
        )
      })}
    </>
  )
}

function XRHands() {
  const handStates = useXR((xr) => xr.inputSourceStates.filter((state) => state.type === 'hand'), shallow)
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
          <xrInputSourceStateContext.Provider key={objectToKey(state)} value={state}>
            <XRSpace space="target-ray-space">
              <Suspense>
                {typeof ResolvedImpl === 'function' ? <ResolvedImpl /> : <DefaultXRHand {...ResolvedImpl} />}
              </Suspense>
            </XRSpace>
          </xrInputSourceStateContext.Provider>
        )
      })}
    </>
  )
}

function XRTransientPointers() {
  const transientPointerStates = useXR(
    (xr) => xr.inputSourceStates.filter((state) => state.type === 'transientPointer'),
    shallow,
  )
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
          <XRSpace key={objectToKey(state)} space="target-ray-space">
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
  const gazeStates = useXR((xr) => xr.inputSourceStates.filter((state) => state.type === 'gaze'), shallow)
  const Implementation = useXR((xr) => xr.gaze)
  if (Implementation === false) {
    return null
  }
  return (
    <>
      {gazeStates.map((state) => {
        return (
          <XRSpace key={objectToKey(state)} space="target-ray-space">
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
  const screenInputStates = useXR((xr) => xr.inputSourceStates.filter((state) => state.type === 'screenInput'), shallow)
  const Implementation = useXR((xr) => xr.screenInput)
  if (Implementation === false) {
    return null
  }
  return (
    <>
      {screenInputStates.map((state) => {
        return (
          <XRSpace key={objectToKey(state)} space="target-ray-space">
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
