import { HandlesContext as HandlesContextImpl, HandleOptions } from '@pmndrs/handle'
import { GroupProps, useFrame } from '@react-three/fiber'
import {
  createContext,
  FC,
  forwardRef,
  ForwardRefExoticComponent,
  PropsWithoutRef,
  ReactNode,
  RefAttributes,
  RefObject,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react'
import { Group, Object3D } from 'three'

const handlesContext = createContext<HandlesContextImpl | undefined>(undefined)

export type HandlesContextProperties = HandleOptions<any> & {
  targetRef: RefObject<Object3D | undefined>
  children?: ReactNode
}

export function HandlesContext({
  children,
  alwaysUpdate,
  apply,
  multitouch,
  scale,
  rotate,
  translate,
  stopPropagation,
  targetRef,
}: HandlesContextProperties) {
  const options: HandleOptions<any> = {
    alwaysUpdate,
    apply,
    multitouch,
    rotate,
    scale,
    stopPropagation,
    translate,
  }
  const optionsRef = useRef(options)
  optionsRef.current = options
  const impl = useMemo(() => new HandlesContextImpl(targetRef, () => optionsRef.current), [])
  useFrame((state) => impl.update(state.clock.getElapsedTime()))
  return <handlesContext.Provider value={impl}>{children}</handlesContext.Provider>
}

export function useHandlesContext(): HandlesContextImpl {
  const context = useContext(handlesContext)
  if (context == null) {
    throw new Error(`uses can only be used inside a 'HandlesContext' component`)
  }
  return context
}

export type RegisteredHandleProperties = Omit<GroupProps, 'scale'> & HandleOptions<any> & { tag: string }

export const RegisteredHandle: ForwardRefExoticComponent<
  PropsWithoutRef<RegisteredHandleProperties> & RefAttributes<Group>
> = forwardRef<Group, RegisteredHandleProperties>(
  ({ children, tag, alwaysUpdate, apply, multitouch, scale, rotate, translate, stopPropagation, ...props }, ref) => {
    const internalRef = useRef<Group>(null)
    useImperativeHandle(ref, () => internalRef.current!, [])
    const context = useHandlesContext()
    const overrideOptions: HandleOptions<any> = {
      alwaysUpdate,
      apply,
      multitouch,
      rotate,
      scale,
      stopPropagation,
      translate,
    }
    const overrideOptionsRef = useRef(overrideOptions)
    overrideOptionsRef.current = overrideOptions
    useEffect(
      () => context.registerControl(internalRef.current!, tag, () => overrideOptionsRef.current),
      [context, tag],
    )
    return (
      <group {...props} ref={internalRef}>
        {children}
      </group>
    )
  },
)
