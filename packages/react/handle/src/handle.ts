import { HandleStore, HandleOptions as BaseHandleOptions, HandleState } from '@pmndrs/handle'
import { useFrame } from '@react-three/fiber'
import { RefObject, useEffect, useMemo, useRef } from 'react'
import { Object3D } from 'three'

export type HandleOptions = {
  target: RefObject<Object3D>
  /**
   * @default target
   */
  relativeTo?: RefObject<Object3D>
  /**
   * @default target
   */
  handle?: RefObject<Object3D>
  /**
   * set to `false` to bind the store yourself using `store.bind(handle)` or capture objects yourself using `store.capture(pointerId, handle)`
   * @default true
   */
  bind?: boolean
} & BaseHandleOptions

export function useHandle<T>(fn: (state: HandleState<T>) => T, options: HandleOptions): HandleStore<T> {
  const fnRef = useRef(fn)
  fnRef.current = fn
  const optionsRef = useRef(options)
  optionsRef.current = options
  const store = useMemo(
    () =>
      new HandleStore(
        (state: HandleState<T>) => fnRef.current(state),
        options.target,
        options.relativeTo,
        () => optionsRef.current,
      ),
    [options.target, options.relativeTo],
  )
  useFrame((state) => store.update(state.clock.getElapsedTime()))
  const handleRef = options.handle ?? options.target
  useEffect(() => {
    if (options.bind === false) {
      return
    }
    const handle = handleRef.current
    if (handle == null) {
      return
    }
    return store.bind(handle as Object3D<any>)
  }, [store, handleRef, options.bind])
  return store
}
