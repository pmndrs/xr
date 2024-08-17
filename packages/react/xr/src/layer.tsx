import {
  createXRLayerGeometry,
  updateXRLayerProperties,
  updateXRLayerTransform,
  XRLayerEntry,
  XRLayerOptions,
  XRLayerProperties as XRLayerDynamicProperties,
  createXRLayer,
  XRLayerSrc,
  waitForXRLayerSrcSize,
  getXRLayerSrcTexture,
  setupXRImageLayer,
  setXRLayerRenderTarget,
} from '@pmndrs/xr'
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
import {
  forwardRef,
  MutableRefObject,
  ReactNode,
  RefObject,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useSessionFeatureEnabled } from './hooks.js'
import { useXRStore } from './xr.js'
import {
  BufferGeometry,
  DepthTexture,
  HalfFloatType,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  PerspectiveCamera,
  Raycaster,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderTarget,
} from 'three'
import { create, StoreApi, UseBoundStore } from 'zustand'
import { forwardObjectEvents } from '@pmndrs/pointer-events'

export type XRLayerProperties = XRLayerOptions &
  XRLayerDynamicProperties &
  Omit<MeshProps, 'geometry'> & {
    renderPriority?: number
    children?: ReactNode
    pixelWidth?: number
    pixelHeight?: number
    src?: Exclude<XRLayerSrc, WebGLRenderTarget>
  }

export function XRLayer({
  src,
  pixelWidth = 1024,
  pixelHeight = 1024,
  renderPriority = 0,
  children,
  ...props
}: XRLayerProperties) {
  const [hasSize, setHasSize] = useState(false)
  const ref = useRef<Mesh>(null)
  const renderTargetRef = useRef<WebGLRenderTarget | undefined>(undefined)
  const layerEntryRef = useRef<XRLayerEntry | undefined>(undefined)
  useEffect(() => {
    setHasSize(false)
    let aborted = false
    waitForXRLayerSrcSize(src).then(() => !aborted && setHasSize(true))
    return () => void (aborted = true)
  }, [src])
  const layersEnabled = useSessionFeatureEnabled('layers')
  const geometry = useMemo(
    () =>
      createXRLayerGeometry(props.shape ?? 'quad', {
        centralAngle: props.centralAngle,
        centralHorizontalAngle: props.centralHorizontalAngle,
        lowerVerticalAngle: props.lowerVerticalAngle,
        upperVerticalAngle: props.upperVerticalAngle,
      }),
    [props.centralAngle, props.centralHorizontalAngle, props.lowerVerticalAngle, props.shape, props.upperVerticalAngle],
  )
  const store = useLayerStore(pixelWidth, pixelHeight)
  useForwardEvents(store, ref, [hasSize, layersEnabled])
  if (!hasSize) {
    return null
  }
  return (
    <>
      {src == null && (
        <ChildrenToRenderTarget
          store={store}
          renderPriority={renderPriority}
          renderTargetRef={renderTargetRef}
          layerEntryRef={layersEnabled ? layerEntryRef : undefined}
        >
          {children}
        </ChildrenToRenderTarget>
      )}
      {layersEnabled ? (
        <XRLayerImplementation
          renderTargetRef={renderTargetRef}
          layerEntryRef={layerEntryRef}
          pixelWidth={pixelWidth}
          pixelHeight={pixelHeight}
          ref={ref}
          {...props}
          src={src}
          geometry={geometry}
        />
      ) : (
        <FallbackXRLayerImplementation
          renderTargetRef={renderTargetRef}
          ref={ref}
          {...props}
          src={src}
          pixelWidth={pixelWidth}
          pixelHeight={pixelHeight}
          geometry={geometry}
        />
      )}
    </>
  )
}

export const XRLayerImplementation = forwardRef<
  Mesh,
  Omit<XRLayerProperties, 'src'> & {
    src?: Exclude<XRLayerSrc, WebGLRenderTarget>
    geometry?: BufferGeometry
    pixelWidth: number
    pixelHeight: number
    renderTargetRef: MutableRefObject<WebGLRenderTarget | undefined>
    layerEntryRef: MutableRefObject<XRLayerEntry | undefined>
  }
>(
  (
    {
      src,
      shape,
      colorFormat,
      depthFormat,
      layout,
      mipLevels,
      renderOrder = 0,
      blendTextureSourceAlpha,
      centralAngle,
      centralHorizontalAngle,
      chromaticAberrationCorrection,
      lowerVerticalAngle,
      quality,
      upperVerticalAngle,
      invertStereo,
      pixelWidth,
      pixelHeight,
      renderTargetRef,
      layerEntryRef,
      ...props
    },
    ref,
  ) => {
    const internalRef = useRef<Mesh>(null)
    const renderer = useThree((state) => state.gl)
    const store = useXRStore()
    const layerProperties = {
      blendTextureSourceAlpha,
      centralAngle,
      centralHorizontalAngle,
      chromaticAberrationCorrection,
      lowerVerticalAngle,
      quality,
      upperVerticalAngle,
    }
    const layerPropertiesRef = useRef(layerProperties)
    layerPropertiesRef.current = layerProperties
    const renderOrderRef = useRef(renderOrder)
    renderOrderRef.current = renderOrder

    //create layer
    useEffect(() => {
      if (internalRef.current == null) {
        return
      }
      const resolvedSrc = src ?? createXRLayerRenderTarget(pixelWidth, pixelHeight, renderTargetRef)
      const layer = createXRLayer(
        resolvedSrc,
        store.getState(),
        renderer.xr,
        internalRef.current,
        {
          colorFormat,
          depthFormat,
          invertStereo,
          layout,
          mipLevels,
          shape,
        },
        layerPropertiesRef.current,
      )
      if (layer == null) {
        return
      }
      const layerEntry = (layerEntryRef.current = { layer, renderOrder: renderOrderRef.current })
      store.addLayerEntry(layerEntry)
      if (resolvedSrc instanceof HTMLVideoElement || resolvedSrc instanceof WebGLRenderTarget) {
        return () => {
          store.removeLayerEntry(layerEntry)
          layer.destroy()
        }
      }
      const cleanupXRImageLayer = setupXRImageLayer(renderer, store, layer, resolvedSrc)
      return () => {
        store.removeLayerEntry(layerEntry)
        cleanupXRImageLayer()
        layer.destroy()
      }
    }, [
      colorFormat,
      depthFormat,
      invertStereo,
      layerEntryRef,
      layout,
      mipLevels,
      pixelHeight,
      pixelWidth,
      renderTargetRef,
      renderer,
      shape,
      src,
      store,
    ])

    //update render order
    if (layerEntryRef.current != null) {
      layerEntryRef.current.renderOrder = renderOrder
    }

    //update layer properties
    if (layerEntryRef.current != null) {
      updateXRLayerProperties(layerEntryRef.current.layer, layerPropertiesRef.current)
    }

    //update layer transform
    useFrame(() => {
      if (layerEntryRef.current == null || internalRef.current == null) {
        return
      }
      updateXRLayerTransform(
        store.getState(),
        layerEntryRef.current.layer,
        layerPropertiesRef.current.centralAngle,
        internalRef.current,
      )
    })

    useImperativeHandle(ref, () => internalRef.current!, [])
    return (
      <mesh {...props} renderOrder={-Infinity} ref={internalRef}>
        <meshBasicMaterial colorWrite={false} />
      </mesh>
    )
  },
)

export const FallbackXRLayerImplementation = forwardRef<
  Mesh,
  Omit<XRLayerProperties, 'src'> & {
    src?: Exclude<XRLayerSrc, WebGLRenderTarget>
    geometry?: BufferGeometry
    pixelWidth: number
    pixelHeight: number
    renderTargetRef: MutableRefObject<WebGLRenderTarget | undefined>
  }
>(({ src, renderTargetRef, renderOrder, pixelWidth, pixelHeight, ...props }, ref) => {
  const materialRef = useRef<MeshBasicMaterial>(null)
  useEffect(() => {
    if (materialRef.current == null) {
      return
    }
    const resolvedSrc = src ?? createXRLayerRenderTarget(pixelWidth, pixelHeight, renderTargetRef)
    const texture = getXRLayerSrcTexture(resolvedSrc)
    materialRef.current.map = texture
    materialRef.current.needsUpdate = true
    return () => {
      if (resolvedSrc instanceof WebGLRenderTarget) {
        resolvedSrc.dispose()
        return
      }
      texture.dispose()
    }
  }, [src, pixelWidth, pixelHeight, renderTargetRef])
  return (
    <mesh ref={ref} {...props}>
      <meshBasicMaterial ref={materialRef} toneMapped={false} />
    </mesh>
  )
})

function createXRLayerRenderTarget(
  pixelWidth: number,
  pixelHeight: number,
  renderTargetRef: MutableRefObject<WebGLRenderTarget | undefined>,
) {
  return (renderTargetRef.current = new WebGLRenderTarget(pixelWidth, pixelHeight, {
    minFilter: LinearFilter,
    magFilter: LinearFilter,
    type: HalfFloatType,
    depthTexture: new DepthTexture(pixelWidth, pixelHeight),
  }))
}

function useForwardEvents(store: UseBoundStore<StoreApi<RootState>>, ref: RefObject<Mesh>, deps: Array<any>) {
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
    update(store.getState())
    const unsubscribe = store.subscribe(update)
    return () => {
      unsubscribe()
      cleanup?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, ref, ...deps])
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

function ChildrenToRenderTarget({
  renderPriority,
  children,
  layerEntryRef,
  renderTargetRef,
  store,
}: {
  renderPriority: number
  children: ReactNode
  layerEntryRef: RefObject<XRLayerEntry | undefined> | undefined
  renderTargetRef: RefObject<WebGLRenderTarget | undefined>
  store: UseBoundStore<StoreApi<RootState>>
}) {
  useEffect(() => {
    const update = (state: RootState, prevState?: RootState) => {
      const { size, camera } = state
      if (camera instanceof OrthographicCamera) {
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

  let oldAutoClear
  let oldXrEnabled
  let oldIsPresenting
  let oldRenderTarget
  useFrame((_state, _delta, frame: XRFrame | undefined) => {
    if (
      renderTargetRef.current == null ||
      (layerEntryRef != null && (layerEntryRef.current == null || frame == null))
    ) {
      return
    }
    const { gl, scene, camera } = store.getState()
    oldAutoClear = gl.autoClear
    oldXrEnabled = gl.xr.enabled
    oldIsPresenting = gl.xr.isPresenting
    oldRenderTarget = gl.getRenderTarget()
    gl.autoClear = true
    gl.xr.enabled = false
    gl.xr.isPresenting = false
    const renderTarget = renderTargetRef.current
    setXRLayerRenderTarget(gl, renderTarget, layerEntryRef?.current, frame)
    gl.render(scene, camera)
    gl.setRenderTarget(oldRenderTarget)
    gl.autoClear = oldAutoClear
    gl.xr.enabled = oldXrEnabled
    gl.xr.isPresenting = oldIsPresenting
  }, renderPriority)
  return <>{reconciler.createPortal(<context.Provider value={store}>{children}</context.Provider>, store, null)}</>
}
