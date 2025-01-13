import { HandlesContext as HandlesContextImpl, HandleOptions, HandleStore } from '@pmndrs/handle'
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
import { Handle, HandleTarget } from '../component.js'

const handlesContext = createContext<HandlesContextImpl | undefined>(undefined)

export type HandlesContextProperties = Pick<HandleOptions<any>, 'alwaysUpdate' | 'apply' | 'stopPropagation'> & {
  targetRef: RefObject<Object3D>
  children?: ReactNode
}

export function HandlesContext({
  children,
  alwaysUpdate,
  apply,
  stopPropagation,
  targetRef,
}: HandlesContextProperties) {
  const options: HandleOptions<any> = {
    alwaysUpdate,
    apply,
    multitouch: false,
    stopPropagation,
  }
  const optionsRef = useRef(options)
  optionsRef.current = options
  const impl = useMemo(() => new HandlesContextImpl(() => optionsRef.current), [])
  useFrame((state) => impl.update(state.clock.getElapsedTime()))
  return (
    <handlesContext.Provider value={impl}>
      <HandleTarget targetRef={targetRef}>{children}</HandleTarget>
    </handlesContext.Provider>
  )
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
  PropsWithoutRef<RegisteredHandleProperties> & RefAttributes<HandleStore<unknown>>
> = forwardRef<HandleStore<unknown>, RegisteredHandleProperties>(
  ({ children, tag, alwaysUpdate, apply, multitouch, scale, rotate, translate, stopPropagation, ...props }, ref) => {
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
    const handleStoreRef = useRef<HandleStore<unknown>>(null)
    const handleRef = useRef<Group>(null)
    const getHandleOptions = useMemo(
      () => context.getHandleOptions.bind(context, tag, () => overrideOptionsRef.current),
      [context, tag],
    )
    useEffect(() => {
      if (handleStoreRef.current == null || handleRef.current == null) {
        return
      }
      return context.registerHandle(handleStoreRef.current, handleRef.current, tag)
    }, [context, tag])
    useImperativeHandle(ref, () => handleStoreRef.current!, [])
    return (
      <group {...props} ref={handleRef}>
        <Handle useTargetFromContext getHandleOptions={getHandleOptions} handleRef={handleRef} ref={handleStoreRef}>
          {children}
        </Handle>
      </group>
    )
  },
)
