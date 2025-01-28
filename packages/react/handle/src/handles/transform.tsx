import {
  ScaleHandles as ScaleHandlesImpl,
  TranslateHandles as TranslateHandlesImpl,
  RotateHandles as RotateHandlesImpl,
  HandlesContext as HandlesContextImpl,
  HandlesAxisHighlight as HandlesAxisHighlightImpl,
  TransformHandlesMode,
  HandleOptions,
  TransformHandlesSpace,
} from '@pmndrs/handle'
import { ThreeElements, useFrame } from '@react-three/fiber'
import { createContext, forwardRef, useContext, useEffect, useImperativeHandle, useMemo, useRef } from 'react'
import { Euler, Group, Vector2Tuple } from 'three'

export type TransformHandlesProperties = TransformHandlesContextProperties & TransformHandlesHandlesProperties

const xRotationOffset = new Euler()
const yRotationOffset = new Euler(0, 0, Math.PI / 2)
const zRotationOffset = new Euler(0, -Math.PI / 2, 0)

export const TransformHandles = forwardRef<Group, TransformHandlesProperties>(
  ({ children, mode, size, fixed, enabled, x, y, z, e, ...props }, ref) => {
    return (
      <TransformHandlesContext {...props} ref={ref}>
        <TransformHandlesHandles enabled={enabled} mode={mode} x={x} y={y} z={z} e={e} size={size} fixed={fixed} />
        <HandlesAxisHighlight tag="x" rotationOffset={xRotationOffset} />
        <HandlesAxisHighlight tag="y" rotationOffset={yRotationOffset} />
        <HandlesAxisHighlight tag="z" rotationOffset={zRotationOffset} />
        {children}
      </TransformHandlesContext>
    )
  },
)

export const HandlesAxisHighlight = forwardRef<HandlesAxisHighlightImpl, { tag: string; rotationOffset: Euler }>(
  ({ tag, rotationOffset }, ref) => {
    const context = useContext(HandlesContext)
    if (context == null) {
      throw new Error('HandlesAxisHighlight can only be used inside TransformHandlesContext')
    }
    const axisHighlight = useMemo(
      () => new HandlesAxisHighlightImpl(context, rotationOffset),
      [context, rotationOffset],
    )
    useImperativeHandle(ref, () => axisHighlight, [axisHighlight])
    useEffect(() => axisHighlight.bind(tag), [axisHighlight, tag])
    useFrame(() => axisHighlight.update())
    return <primitive object={axisHighlight} />
  },
)

const HandlesContext = createContext<HandlesContextImpl | undefined>(undefined)

export type TransformHandlesContextProperties = Omit<ThreeElements['group'], 'scale'> &
  Pick<HandleOptions<any>, 'alwaysUpdate' | 'apply' | 'stopPropagation'> & {
    context?: HandlesContextImpl
    space?: TransformHandlesSpace | null
  }

export const TransformHandlesContext = forwardRef<Group, TransformHandlesContextProperties>(
  ({ alwaysUpdate, apply, stopPropagation, children, context: providedContext, space, ...props }, ref) => {
    const internalRef = useRef<Group>(null)
    useImperativeHandle(ref, () => internalRef.current!, [])
    const options: HandleOptions<any> = {
      alwaysUpdate,
      apply,
      stopPropagation,
    }
    const optionsRef = useRef(options)
    optionsRef.current = options
    const context = useMemo(
      () => providedContext ?? new HandlesContextImpl(internalRef, () => optionsRef.current),
      [providedContext],
    )
    if (space !== null) {
      context.space = space
    }
    useFrame((state) => context.update(state.clock.getElapsedTime()), -1)
    return (
      <group {...props} ref={internalRef}>
        <HandlesContext.Provider value={context}>{children}</HandlesContext.Provider>
      </group>
    )
  },
)

export type TransformHandlesHandlesProperties = {
  mode?: TransformHandlesMode
  x?: boolean | Vector2Tuple
  y?: boolean | Vector2Tuple
  z?: boolean | Vector2Tuple
  e?: boolean | Vector2Tuple
  enabled?: boolean
  fixed?: boolean | null
  size?: number | null
}

export const TransformHandlesHandles = forwardRef<
  TranslateHandlesImpl | RotateHandlesImpl | ScaleHandlesImpl,
  TransformHandlesHandlesProperties
>(({ mode = 'translate', x, y, z, e, size, fixed, enabled = true }, ref) => {
  const context = useContext(HandlesContext)
  if (context == null) {
    throw new Error('TransformHandlesHandles can only be used inside TransformHandlesContext')
  }
  const handles = useMemo(() => {
    switch (mode) {
      case 'rotate':
        return new RotateHandlesImpl(context)
      case 'scale':
        return new ScaleHandlesImpl(context)
      case 'translate':
        return new TranslateHandlesImpl(context)
    }
  }, [context, mode])
  if (size !== null) {
    handles.size = size
  }
  if (fixed !== null) {
    handles.fixed = fixed
  }
  useImperativeHandle(ref, () => handles, [handles])
  useFrame((state) => handles.update(state.camera))
  useEffect(() => (enabled ? handles.bind({ x, y, z, e }) : undefined), [enabled, handles, x, y, z, e])
  return <primitive object={handles} />
})

/**
 * @deprecated use TransformHandles instead
 */
export const TransformControls = TransformHandles
