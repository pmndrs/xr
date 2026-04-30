import { HandleOptions as BaseHandleOptions, HandleState, HandleStore, defaultApply } from '@pmndrs/handle'
import { useFrame, useThree } from '@react-three/fiber'
import { RefObject, useEffect, useMemo, useRef } from 'react'
import { Object3D } from 'three'

export type HandleOptions<T> = {
  /**
   * @default target
   */
  handle?: RefObject<Object3D | null>
  /**
   * set to `false` to bind the store yourself using `store.bind(handle)` or capture objects yourself using `store.capture(pointerId, handle)`
   * @default true
   */
  bind?: boolean
} & BaseHandleOptions<T>

/**
 * // TODO: Add a valid description for this function.
 *
 * @template T - The type of the handle state.
 * @param {RefObject<Object3D | null>} target - The target object to attach the handle to.
 * @param {HandleOptions<T>} [options={}] - Options for configuring the handle.
 * @param {() => HandleOptions<T>} [getHandleOptions] - A function to dynamically provide handle options.
 * @returns {HandleStore<T>} - The handle store instance.
 */
export function useHandle<T>(
  target: RefObject<Object3D | null>,
  options: HandleOptions<T> = {},
  getHandleOptions?: () => HandleOptions<T>,
): HandleStore<T> {
  const invalidate = useThree((s) => s.invalidate)
  const optionsRef = useRef(options)
  optionsRef.current = options
  const getHandleOptionsRef = useRef(getHandleOptions)
  getHandleOptionsRef.current = getHandleOptions
  const invalidateRef = useRef(invalidate)
  invalidateRef.current = invalidate
  const store = useMemo(
    () =>
      new HandleStore<T>(target, () => {
        const opts = { ...getHandleOptionsRef.current?.(), ...optionsRef.current }
        const userApply = opts.apply
        if (userApply == null) {
          return {
            ...opts,
            apply: (state: HandleState<T>, target: Object3D) => {
              const result = defaultApply(state, target)
              invalidateRef.current()
              return result
            },
          }
        }
        return {
          ...opts,
          apply: (state: HandleState<T>, target: Object3D) => {
            const result = userApply(state, target)
            invalidateRef.current()
            return result
          },
        }
      }),
    [target],
  )
  useFrame((state) => store.update(state.clock.getElapsedTime()), -1)
  const handleRef = options.handle ?? target
  useEffect(() => {
    if (options.bind === false) {
      return
    }
    const handle = handleRef.current
    if (handle == null) {
      return
    }
    return store.bind(handle)
  }, [store, handleRef, options.bind])
  return store
}
