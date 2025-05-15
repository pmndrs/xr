import { resolveInputSourceImplementation } from '@pmndrs/xr/internals'
import { context, reconciler, useStore } from '@react-three/fiber'
import { ReactNode, Suspense, useMemo } from 'react'
import { shallow } from 'zustand/shallow'
import { xrInputSourceStateContext, xrSpaceContext } from './contexts.js'
import {
  DefaultXRController,
  DefaultXRGaze,
  DefaultXRHand,
  DefaultXRScreenInput,
  DefaultXRTransientPointer,
} from './default.js'
import { useXRSessionVisibilityState } from './hooks.js'
import { XRSpace } from './space.js'
import { objectToKey } from './utils.js'
import { useXR } from './xr.js'

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
          <xrInputSourceStateContext.Provider value={state} key={objectToKey(state)}>
            <XRSpace space="target-ray-space">
              <Suspense>
                {typeof ResolvedImpl === 'function' ? (
                  <ResolvedImpl />
                ) : (
                  <DefaultXRTransientPointer {...ResolvedImpl} />
                )}
              </Suspense>
            </XRSpace>
          </xrInputSourceStateContext.Provider>
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
          <xrInputSourceStateContext.Provider key={objectToKey(state)} value={state}>
            <XRSpace space="target-ray-space">
              <Suspense>
                {typeof Implementation === 'function' ? (
                  <Implementation />
                ) : (
                  <DefaultXRGaze {...spreadable(Implementation)} />
                )}
              </Suspense>
            </XRSpace>
          </xrInputSourceStateContext.Provider>
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
          <xrInputSourceStateContext.Provider key={objectToKey(state)} value={state}>
            <XRSpace space="target-ray-space">
              <Suspense>
                {typeof Implementation === 'function' ? (
                  <Implementation />
                ) : (
                  <DefaultXRScreenInput {...spreadable(Implementation)} />
                )}
              </Suspense>
            </XRSpace>
          </xrInputSourceStateContext.Provider>
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
