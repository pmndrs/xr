import {
  context,
  InjectState,
  MeshProps,
  reconciler,
  RootState,
  useFrame,
  useStore,
  useThree,
} from '@react-three/fiber'
import { forwardRef, ReactNode, RefObject, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react'
import {
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PerspectiveCamera,
  Raycaster,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderTarget,
} from 'three'
import { useXRLayer } from './layer.js'
import { createXRLayer, XRLayerEntry, XRLayerOptions, XRLayerProperties, XRLayerShape } from '@pmndrs/xr'
import { XRStore } from '../xr.js'
import { isOrthographicCamera } from '@react-three/fiber/dist/declarations/src/core/utils.js'
import { create, StoreApi, UseBoundStore } from 'zustand'
import { forwardObjectEvents } from '@pmndrs/pointer-events'

declare module 'three' {
  export interface WebGLRenderer {
    setRenderTargetTextures(
      renderTarget: WebGLRenderTarget,
      colorTexture: WebGLTexture,
      depthTexture?: WebGLTexture,
    ): void
  }
}

export type XRRenderTargetLayerProperties = {
  children?: ReactNode
  shape?: XRLayerShape
  renderPriority?: number
  pixelWidth: number
  pixelHeight: number
} & Omit<XRLayerOptions, 'textureType' | 'isStatic' | 'layout'> &
  XRLayerProperties &
  MeshProps

export function NonXRRenderTargetLayer({
  renderOrder,
  pixelWidth,
  pixelHeight,
  children,
  renderPriority = 0,
  ...props
}: XRRenderTargetLayerProperties) {
  const renderTargetRef = useRef<WebGLRenderTarget>(null)
  const ref = useRef<Mesh>(null)
  const materialRef = useRef<MeshBasicMaterial>(null)
  useEffect(() => {
    if (materialRef.current == null || renderTargetRef.current == null) {
      return
    }
    materialRef.current.map = renderTargetRef.current.texture
  }, [])

  const layerStore = useLayerStore(pixelWidth, pixelHeight)
  useForwardEvents(layerStore, ref)
  return (
    <>
      {reconciler.createPortal(
        <context.Provider value={layerStore}>
          <ChildrenToRenderTarget ref={renderTargetRef} renderPriority={renderPriority}>
            {children}
          </ChildrenToRenderTarget>
        </context.Provider>,
        layerStore,
        null,
      )}
      <mesh {...props}>
        <meshBasicMaterial toneMapped={false} />
      </mesh>
    </>
  )
}

export function XRRenderTargetLayer({
  pixelWidth,
  pixelHeight,
  renderOrder = 0,
  shape,
  centralAngle,
  centralHorizontalAngle,
  upperVerticalAngle,
  lowerVerticalAngle,
  colorFormat,
  depthFormat,
  mipLevels,
  blendTextureSourceAlpha,
  chromaticAberrationCorrection,
  quality,
  renderPriority = 0,
  children,
  ...props
}: XRRenderTargetLayerProperties) {
  const ref = useRef<Mesh>(null)
  const renderer = useThree((s) => s.gl)
  const createLayer = useCallback(
    async (store: XRStore, object: Object3D, properties: XRLayerProperties) =>
      createXRLayer(
        store.getState(),
        renderer.xr,
        shape ?? 'quad',
        object,
        pixelWidth,
        pixelHeight,
        { colorFormat, depthFormat, isStatic: false, mipLevels, textureType: 'texture' },
        properties,
      ),
    [colorFormat, depthFormat, mipLevels, pixelHeight, pixelWidth, renderer.xr, shape],
  )
  const layerEntryRef = useXRLayer(ref, renderOrder, createLayer, {
    blendTextureSourceAlpha,
    centralAngle,
    centralHorizontalAngle,
    chromaticAberrationCorrection,
    lowerVerticalAngle,
    quality,
    upperVerticalAngle,
  })
  const layerStore = useLayerStore(pixelWidth, pixelHeight)
  useForwardEvents(layerStore, ref)
  return (
    <>
      {reconciler.createPortal(
        <context.Provider value={layerStore}>
          <ChildrenToRenderTarget renderPriority={renderPriority} layerEntryRef={layerEntryRef}>
            {children}
          </ChildrenToRenderTarget>
        </context.Provider>,
        layerStore,
        null,
      )}
      <mesh {...props} renderOrder={-Infinity} ref={ref}>
        <meshBasicMaterial colorWrite={false} />
      </mesh>
    </>
  )
}

function useForwardEvents(layerStore: UseBoundStore<StoreApi<RootState>>, ref: RefObject<Mesh>) {
  useEffect(() => {
    const { current } = ref
    if (current == null) {
      return
    }
    let cleanup: (() => void) | undefined
    const update = (state: RootState, prevState?: RootState) => {
      if (state.camera === prevState?.camera && state.scene === prevState.scene) {
        return
      }
      cleanup?.()
      cleanup = forwardObjectEvents(current, state.camera, state.scene)
    }
    update(layerStore.getState())
    const unsubscribe = layerStore.subscribe(update)
    return () => {
      unsubscribe()
      cleanup?.()
    }
  }, [layerStore, ref])
}

// Keys that shouldn't be copied between R3F stores
export const privateKeys = [
  'set',
  'get',
  'setSize',
  'setFrameloop',
  'setDpr',
  'events',
  'invalidate',
  'advance',
  'size',
  'viewport',
]

export function useLayerStore(width: number, height: number) {
  const previousRoot = useStore()
  const layerStore = useMemo(() => {
    let previousState = previousRoot.getState()
    // We have our own camera in here, separate from the main scene.
    const camera = new PerspectiveCamera(50, 1, 0.1, 1000)
    camera.position.set(0, 0, 5)
    const pointer = new Vector2()
    let ownState: Partial<RootState> = {
      events: { enabled: false, priority: 0 },
      size: { width: 1, height: 1, left: 0, top: 0 },
      camera,
      scene: new Scene(),
      raycaster: new Raycaster(),
      pointer: pointer,
      mouse: pointer,
      previousRoot,
    }
    //we now merge in order previousState, injectState, ownState
    const store = create<RootState & { setPreviousState: (prevState: RootState) => void }>((innerSet, get) => {
      const merge = () => {
        const result = {} as any
        for (const key in previousState) {
          if (privateKeys.includes(key)) {
            continue
          }
          result[key as keyof RootState] = previousState[key as keyof RootState] as never
        }
        return Object.assign(result, ownState, {
          events: { ...previousState.events, ...ownState.events },
          viewport: Object.assign(
            {},
            previousState.viewport,
            previousState.viewport.getCurrentViewport(camera, new Vector3(), ownState.size),
          ),
        })
      }
      const update = () => innerSet(merge())
      return {
        ...previousState,
        // Set and get refer to this root-state
        set(newOwnState: Partial<InjectState> | ((s: InjectState) => Partial<InjectState>)) {
          if (typeof newOwnState === 'function') {
            newOwnState = newOwnState(get())
          }
          Object.assign(ownState, newOwnState)
          update()
        },
        setPreviousState(prevState: RootState) {
          previousState = prevState
          update()
        },
        get,
        setEvents() {},
        ...merge(),
      }
    })
    return Object.assign(store, {
      setState(state: Partial<RootState>) {
        store.getState().set(state as any)
      },
    })
  }, [previousRoot])
  //syncing up previous store with the current store
  useEffect(() => previousRoot.subscribe(layerStore.getState().setPreviousState), [previousRoot, layerStore])
  useEffect(
    () =>
      layerStore.setState({
        size: { width, height, top: 0, left: 0 },
        viewport: { ...previousRoot.getState().viewport, width, height, aspect: width / height },
      }),
    [width, height, layerStore, previousRoot],
  )
  return layerStore
}

const ChildrenToRenderTarget = forwardRef<
  WebGLRenderTarget,
  {
    renderPriority: number
    children: ReactNode
    layerEntryRef?: RefObject<XRLayerEntry | undefined>
  }
>(({ renderPriority, children, layerEntryRef }, ref) => {
  const store = useStore()

  const renderTargetRef = useRef<WebGLRenderTarget | undefined>(undefined)
  useEffect(() => {
    const renderTarget = (renderTargetRef.current = new WebGLRenderTarget(1, 1, {}))
    return () => renderTarget.dispose()
  }, [])

  useEffect(() => {
    const update = (state: RootState, prevState?: RootState) => {
      const { size, camera } = state
      renderTargetRef.current?.setSize(size.width, size.height)
      if (isOrthographicCamera(camera)) {
        camera.left = size.width / -2
        camera.right = size.width / 2
        camera.top = size.height / 2
        camera.bottom = size.height / -2
      } else {
        camera.aspect = size.width / size.height
      }
      if (size !== prevState?.size || camera !== prevState.camera) {
        camera.updateProjectionMatrix()
        // https://github.com/pmndrs/react-three-fiber/issues/178
        // Update matrix world since the renderer is a frame late
        camera.updateMatrixWorld()
      }
    }
    update(store.getState())
    return store.subscribe(update)
  }, [store])

  useImperativeHandle(ref, () => renderTargetRef.current!, [])

  let oldAutoClear
  let oldXrEnabled
  let oldIsPresenting
  let oldRenderTarget
  useFrame(({ gl, scene, camera }, _delta, frame: XRFrame | undefined) => {
    if (renderTargetRef.current == null || (layerEntryRef != null && layerEntryRef.current == null) || frame == null) {
      return
    }
    oldAutoClear = gl.autoClear
    oldXrEnabled = gl.xr.enabled
    oldIsPresenting = gl.xr.isPresenting
    oldRenderTarget = gl.getRenderTarget()
    gl.autoClear = true
    gl.xr.enabled = false
    gl.xr.isPresenting = false
    const renderTarget = renderTargetRef.current
    if (layerEntryRef?.current != null) {
      const subImage = gl.xr.getBinding().getSubImage(layerEntryRef.current.layer, frame)
      gl.setRenderTargetTextures(renderTarget, subImage.colorTexture)
    }
    gl.setRenderTarget(renderTarget)
    gl.render(scene, camera)
    gl.setRenderTarget(oldRenderTarget)
    gl.autoClear = oldAutoClear
    gl.xr.enabled = oldXrEnabled
    gl.xr.isPresenting = oldIsPresenting
  }, renderPriority)
  return <>{children}</>
})
