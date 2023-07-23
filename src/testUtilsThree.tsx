import { beforeEach, afterEach } from 'vitest'
import { create } from '@react-three/test-renderer'
// import { createRef, useEffect } from 'react'
import * as React from 'react'

// https://github.com/testing-library/react-testing-library/blob/main/src/act-compat.js
function getGlobalThis() {
  /* istanbul ignore else */
  if (typeof globalThis !== 'undefined') {
    return globalThis
  }
  /* istanbul ignore next */
  if (typeof self !== 'undefined') {
    return self
  }
  /* istanbul ignore next */
  if (typeof window !== 'undefined') {
    return window
  }
  /* istanbul ignore next */
  if (typeof global !== 'undefined') {
    return global
  }
  /* istanbul ignore next */
  throw new Error('unable to locate global object')
}

function setIsReactActEnvironment(isReactActEnvironment: boolean | undefined) {
  ;(getGlobalThis() as any).IS_REACT_ACT_ENVIRONMENT = isReactActEnvironment
}

function getIsReactActEnvironment() {
  return (getGlobalThis() as any).IS_REACT_ACT_ENVIRONMENT
}

let existingIsReactActEnvironment: boolean | undefined

beforeEach(() => {
  existingIsReactActEnvironment = getIsReactActEnvironment()
  setIsReactActEnvironment(true)
})

afterEach(() => {
  setIsReactActEnvironment(existingIsReactActEnvironment)
  existingIsReactActEnvironment = undefined
})

// function withGlobalActEnvironment(actImplementation: typeof reactThreeTestRendererAct) {
//   return (callback: () => Promise<any>) => {
//     const previousActEnvironment = getIsReactActEnvironment()
//     setIsReactActEnvironment(true)
//     try {
//       // The return value of `act` is always a thenable.
//       let callbackNeedsToBeAwaited = false
//       const actResult = actImplementation(() => {
//         const result = callback()
//         if (result !== null && typeof result === 'object' && typeof result.then === 'function') {
//           callbackNeedsToBeAwaited = true
//         }
//         return result
//       })
//       if (callbackNeedsToBeAwaited) {
//         const thenable = actResult
//         return {
//           then: (resolve: (v: any) => any, reject: (e: any) => any) => {
//             thenable.then(
//               (returnValue) => {
//                 setIsReactActEnvironment(previousActEnvironment)
//                 resolve(returnValue)
//               },
//               (error) => {
//                 setIsReactActEnvironment(previousActEnvironment)
//                 reject(error)
//               }
//             )
//           }
//         }
//       } else {
//         setIsReactActEnvironment(previousActEnvironment)
//         return actResult
//       }
//     } catch (error) {
//       // Can't be a `finally {}` block since we don't know if we have to immediately restore IS_REACT_ACT_ENVIRONMENT
//       // or if we have to await the callback first.
//       setIsReactActEnvironment(previousActEnvironment)
//       throw error
//     }
//   }
// }

// export const act = withGlobalActEnvironment(reactThreeTestRendererAct)

// /**
//  * Got this from vitest react example
//  * @see https://vitest.dev/guide/#examples
//  */
// function toJson(component: ReactTestRenderer) {
//   const result = component.toJSON()
//   expect(result).toBeDefined()
//   expect(result).not.toBeInstanceOf(Array)
//   return result as ReactTestRendererJSON
// }

/**
 * Hack to make async effects affect render
 * @see https://stackoverflow.com/a/70926194
 */
export async function render(
  element: React.ReactElement,
  {
    wrapper: WrapperComponent
  }: { wrapper?: React.FunctionComponent<React.PropsWithChildren> | React.ComponentClass<React.PropsWithChildren> } = {}
) {
  const wrapUiIfNeeded = (innerElement: React.ReactElement) =>
    WrapperComponent ? React.createElement(WrapperComponent, null, innerElement) : innerElement

  const renderer = await create(wrapUiIfNeeded(element))

  async function rerender(newElement = element) {
    await renderer.update(wrapUiIfNeeded(newElement))
  }

  async function unmount() {
    await renderer.unmount()
  }


  return {
    renderer,
    // toJson: () => toJson(root),
    rerender,
    unmount
  }
}

// export async function renderHook<T>(
//   hook: () => T,
//   { wrapper }: { wrapper?: React.FunctionComponent<React.PropsWithChildren> | React.ComponentClass<React.PropsWithChildren> } = {}
// ) {
//   const result = createRef<T | undefined>() as React.MutableRefObject<T | undefined>

//   function TestComponent() {
//     const pendingResult = hook()

//     useEffect(() => {
//       result.current = pendingResult
//     })

//     return null
//   }

//   const { rerender: baseRerender, unmount } = await render(<TestComponent />, { wrapper })

//   function rerender() {
//     return baseRerender(<TestComponent />)
//   }

//   return { result, rerender, unmount }
// }
