/* eslint-disable @typescript-eslint/no-non-null-assertion */

import * as React from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Props as ContainerProps } from '@react-three/fiber/dist/declarations/src/web/Canvas'
import { useEffect, useRef } from 'react'
import { InteractionManager, useStore, useXRStateContextBridge, usePlayer, useRegisterWebXRManager } from '.'
import { WebXRManager, XRFrame } from 'three'

export function XRCanvas({ foveation, children, onCreated, ...rest }: ContainerProps & { foveation?: number }) {
  const player = usePlayer()

  const store = useStore()
  useEffect(() => {
    store.subscribe<WebXRManager | undefined>(
      (webXRManager) => {
        if (foveation != null && webXRManager != null) {
          webXRManager.setFoveation(foveation)
        }
      },
      ({ webXRManager }) => webXRManager
    )
  }, [store, foveation])

  const registerWebXRManager = useRegisterWebXRManager()

  const destroyFunction = useRef<() => void>()

  //unregisters the current webxr manager
  useEffect(() => destroyFunction.current, [])

  const XRStateContextBridge = useXRStateContextBridge()

  return (
    <Canvas
      onCreated={(state) => {
        if (onCreated != null) {
          onCreated(state)
        }
        destroyFunction.current = registerWebXRManager(state.gl.xr)
      }}
      vr
      {...rest}>
      <XRStateContextBridge>
        <primitive object={player} dispose={null}>
          <CurrentCamera />
        </primitive>
        <InteractionManager>{children}</InteractionManager>
      </XRStateContextBridge>
    </Canvas>
  )
}

function CurrentCamera() {
  const camera = useThree(({ camera }) => camera)
  return <primitive object={camera} dispose={null} />
}

export const useXRFrame = (callback: (time: DOMHighResTimeStamp, xrFrame: XRFrame) => void) => {
  const { gl } = useThree()
  const requestRef = React.useRef<number>()
  const previousTimeRef = React.useRef<number>()

  const loop = React.useCallback(
    (time: DOMHighResTimeStamp, xrFrame: XRFrame) => {
      if (previousTimeRef.current !== undefined) {
        callback(time, xrFrame)
      }

      previousTimeRef.current = time
      requestRef.current = gl.xr.getSession()!.requestAnimationFrame(loop)
    },
    [gl.xr, callback]
  )

  React.useEffect(() => {
    if (!gl.xr?.isPresenting) {
      return
    }

    requestRef.current = gl.xr.getSession()!.requestAnimationFrame(loop)

    return () => {
      if (requestRef.current) {
        gl.xr.getSession()!.cancelAnimationFrame(requestRef.current)
      }
    }
  }, [gl.xr.isPresenting, loop, gl.xr])
}
