import * as React from 'react'
import * as THREE from 'three'
import create, { EqualityChecker, GetState, SetState, StateSelector } from 'zustand'
import { Canvas, useFrame, useThree, Props as ContainerProps } from '@react-three/fiber'
import { ARButton } from './webxr/ARButton'
import { VRButton } from './webxr/VRButton'
import { XRController } from './XRController'
import { ObjectsState } from './ObjectsState'
import { InteractionManager, XRInteractionHandler, XRInteractionType } from './Interactions'

export interface XRState {
  set: SetState<XRState>
  get: GetState<XRState>

  controllers: XRController[]
  player: THREE.Group
  isHandTracking: boolean
  session: XRSession | null
  foveation: number
  referenceSpace: XRReferenceSpaceType

  hoverState: Record<XRHandedness, Map<THREE.Object3D, THREE.Intersection>>
  interactions: ObjectsState<XRInteractionType, XRInteractionHandler>
  hasInteraction: (object: THREE.Object3D, eventType: XRInteractionType) => boolean
  getInteraction: (object: THREE.Object3D, eventType: XRInteractionType) => XRInteractionHandler[] | undefined
  addInteraction: (object: THREE.Object3D, eventType: XRInteractionType, handler: XRInteractionHandler) => void
  removeInteraction: (object: THREE.Object3D, eventType: XRInteractionType, handler: XRInteractionHandler) => void
}
const XRStore = create<XRState>((set, get) => ({
  set,
  get,

  controllers: [],
  player: new THREE.Group(),
  isHandTracking: false,
  session: null,
  foveation: 0,
  referenceSpace: 'local-floor',

  hoverState: {
    left: new Map(),
    right: new Map(),
    none: new Map()
  },
  interactions: ObjectsState.make<XRInteractionType, XRInteractionHandler>(),
  hasInteraction(object: THREE.Object3D, eventType: XRInteractionType) {
    return ObjectsState.has(get().interactions, object, eventType)
  },
  getInteraction(object: THREE.Object3D, eventType: XRInteractionType) {
    return ObjectsState.get(get().interactions, object, eventType)
  },
  addInteraction(object: THREE.Object3D, eventType: XRInteractionType, handler: XRInteractionHandler) {
    ObjectsState.add(get().interactions, object, eventType, handler)
  },
  removeInteraction(object: THREE.Object3D, eventType: XRInteractionType, handler: XRInteractionHandler) {
    ObjectsState.delete(get().interactions, object, eventType, handler)
  }
}))

export type HitTestCallback = (hitMatrix: THREE.Matrix4, hit: XRHitTestResult) => void
export function useHitTest(hitTestCallback: HitTestCallback) {
  const hitTestSource = React.useRef<XRHitTestSource | undefined>()
  const hitTestSourceRequested = React.useRef(false)
  const [hitMatrix] = React.useState(() => new THREE.Matrix4())

  useFrame((state, _, frame) => {
    if (!state.gl.xr.isPresenting) return

    const session = state.gl.xr.getSession()
    if (!session) return

    if (!hitTestSourceRequested.current) {
      session.requestReferenceSpace('viewer').then((referenceSpace: XRReferenceSpace) => {
        session.requestHitTestSource?.({ space: referenceSpace })?.then((source: XRHitTestSource) => {
          hitTestSource.current = source
        })
      })
      session.addEventListener(
        'end',
        () => {
          hitTestSourceRequested.current = false
          hitTestSource.current = undefined
        },
        { once: true }
      )
      hitTestSourceRequested.current = true
    }

    if (hitTestSource.current && state.gl.xr.isPresenting && frame) {
      const referenceSpace = state.gl.xr.getReferenceSpace()

      if (referenceSpace) {
        const hitTestResults = frame.getHitTestResults(hitTestSource.current as XRHitTestSource)
        if (hitTestResults.length) {
          const hit = hitTestResults[0]
          const pose = hit.getPose(referenceSpace)

          if (pose) {
            hitMatrix.fromArray(pose.transform.matrix)
            hitTestCallback(hitMatrix, hit)
          }
        }
      }
    }
  })
}

export interface XRProps {
  /**
   * Enables foveated rendering,
   * 0 = no foveation = full resolution,
   * 1 = maximum foveation = the edges render at lower resolution
   */
  foveation?: number
  /** Type of WebXR reference space to use. */
  referenceSpace?: XRReferenceSpaceType
  children: React.ReactNode
}
function XR({ foveation = 0, referenceSpace = 'local-floor', children }: XRProps) {
  const gl = useThree((state) => state.gl)
  const camera = useThree((state) => state.camera)
  const player = useXR((state) => state.player)
  const set = useXR((state) => state.set)
  const session = useXR((state) => state.session)

  React.useEffect(() => {
    const handlers = [0, 1].map((id) => {
      const controller = new XRController(id, gl)
      const onConnected = () => set((state) => ({ controllers: [...state.controllers, controller] }))
      const onDisconnected = () => set((state) => ({ controllers: state.controllers.filter((it) => it !== controller) }))

      controller.addEventListener('connected', onConnected)
      controller.addEventListener('disconnected', onDisconnected)
      player.add(controller)

      return () => {
        controller.removeEventListener('connected', onConnected)
        controller.removeEventListener('disconnected', onDisconnected)
        player.remove(controller)
      }
    })

    return () => {
      handlers.forEach((cleanup) => cleanup())
    }
  }, [gl, set, player])

  React.useEffect(() => {
    const handleSessionChange = () => set(() => ({ session: gl.xr.getSession() }))
    gl.xr.addEventListener('sessionstart', handleSessionChange)
    gl.xr.addEventListener('sessionend', handleSessionChange)

    return () => {
      gl.xr.removeEventListener('sessionstart', handleSessionChange)
      gl.xr.removeEventListener('sessionend', handleSessionChange)
    }
  }, [gl.xr, set])

  React.useEffect(() => {
    if (gl.xr.getFoveation() !== foveation) {
      gl.xr.setFoveation(foveation)
      set(() => ({ foveation }))
    }
  }, [gl, foveation, set])

  React.useEffect(() => {
    gl.xr.setReferenceSpaceType(referenceSpace)
    set(() => ({ referenceSpace }))
  }, [gl.xr, referenceSpace, set])

  React.useEffect(() => {
    const handleInputSourcesChange = (event: Event | XRInputSourceChangeEvent) =>
      set(() => ({ isHandTracking: Object.values((event as XRInputSourceChangeEvent).session.inputSources).some((source) => source.hand) }))
    session?.addEventListener('inputsourceschange', handleInputSourcesChange)
    set(() => ({ isHandTracking: Object.values(session?.inputSources ?? []).some((source) => source.hand) }))

    return () => {
      session?.removeEventListener('inputsourceschange', handleInputSourcesChange)
    }
  }, [session, set])

  return (
    <>
      <primitive object={player} dispose={null}>
        {camera && <primitive object={camera} />}
      </primitive>
      {children}
    </>
  )
}

export interface XRCanvasProps extends ContainerProps, XRProps {}
export const XRCanvas = React.forwardRef<HTMLCanvasElement, XRCanvasProps>(function XRCanvas(
  { foveation, referenceSpace, children, ...rest },
  forwardedRef
) {
  return (
    <Canvas {...rest} ref={forwardedRef}>
      <XR foveation={foveation} referenceSpace={referenceSpace}>
        <InteractionManager>{children}</InteractionManager>
      </XR>
    </Canvas>
  )
})

export function useXRButton(
  mode: 'AR' | 'VR',
  gl: THREE.WebGLRenderer,
  sessionInit?: XRSessionInit,
  container?: React.MutableRefObject<HTMLElement>
) {
  const button = React.useMemo<HTMLButtonElement | HTMLAnchorElement>(() => {
    const target = mode === 'AR' ? ARButton : VRButton
    return target.createButton(gl, sessionInit)
  }, [mode, gl, sessionInit])

  React.useLayoutEffect(() => {
    const parent = container?.current ?? document.body
    parent.appendChild(button)
    return () => void parent.removeChild(button)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [button])

  return button
}

export function XRButton({ mode, sessionInit }: { mode: 'AR' | 'VR'; sessionInit?: XRSessionInit }) {
  const gl = useThree((state) => state.gl)
  useXRButton(mode, gl, sessionInit)

  return null
}

export interface VRCanvasProps extends XRCanvasProps {
  /**
   * `XRSession` configuration options.
   * @see https://immersive-web.github.io/webxr/#feature-dependencies
   */
  sessionInit?: XRSessionInit
}
export function VRCanvas({ sessionInit, children, ...rest }: VRCanvasProps) {
  return (
    <XRCanvas {...rest}>
      <XRButton mode="VR" sessionInit={sessionInit} />
      {children}
    </XRCanvas>
  )
}

export interface ARCanvasProps extends XRCanvasProps {
  /**
   * `XRSession` configuration options.
   * @see https://immersive-web.github.io/webxr/#feature-dependencies
   */
  sessionInit?: XRSessionInit
}
export function ARCanvas({ sessionInit, children, ...rest }: ARCanvasProps) {
  return (
    <XRCanvas {...rest}>
      <XRButton mode="AR" sessionInit={sessionInit} />
      {children}
    </XRCanvas>
  )
}

export function useXR<T = XRState>(
  selector: StateSelector<XRState, T> = (state) => state as unknown as T,
  equalityFn?: EqualityChecker<T>
) {
  return XRStore(selector, equalityFn)
}

export function useController(handedness: XRHandedness) {
  const controllers = useXR((state) => state.controllers)
  const controller = React.useMemo(() => controllers.find((it) => it.inputSource.handedness === handedness), [handedness, controllers])

  return controller
}
